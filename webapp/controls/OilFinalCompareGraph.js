sap.ui.define(["sap/ui/core/Control"], (Control) => {
    "use strict";

    const BOX = {
        std: { w: 200, h: 88 },
        merge: { w: 180, h: 88 },
        oil: { w: 250, h: 104 },
        amt: { w: 290, h: 100 },
        final: { w: 300, h: 100 }
    };
    const GAP = 36;
    const PAD_L = 24;
    const PAD_R = 48;
    const H = 400;
    const ROW = { top: 48, mid: 168, bottom: 288 };

    const COL = (() => {
        let x = PAD_L;
        const c = {};
        c.qty = x; x += BOX.std.w + GAP;
        c.qtyMerge = x; x += BOX.merge.w + GAP;
        c.oil = x; x += BOX.oil.w + GAP;
        c.oilMerge = x; x += BOX.merge.w + GAP;
        c.amt = x; x += BOX.amt.w + GAP;
        c.amtMerge = x; x += BOX.merge.w + GAP;
        c.final = x;
        return c;
    })();

    const CANVAS_W = COL.final + BOX.final.w + PAD_R;
    const ZOOM = 0.9;

    const EDGES = [
        ["qtyGr", "qtyMerge"], ["qtyInv", "qtyMerge"],
        ["qtyMerge", "oilCalc"], ["qtyMerge", "oilBill"],
        ["oilCalc", "oilMerge"], ["oilBill", "oilMerge"],
        ["oilMerge", "amtCalc"], ["oilMerge", "amtInv"],
        ["amtCalc", "amtMerge"], ["amtInv", "amtMerge"],
        ["amtMerge", "diffFinal"]
    ];

    const POS = {
        qtyGr: { x: COL.qty, y: ROW.top, w: BOX.std.w, h: BOX.std.h },
        qtyInv: { x: COL.qty, y: ROW.bottom, w: BOX.std.w, h: BOX.std.h },
        qtyMerge: { x: COL.qtyMerge, y: ROW.mid, w: BOX.merge.w, h: BOX.std.h },
        oilCalc: { x: COL.oil, y: ROW.top - 7, w: BOX.oil.w, h: BOX.oil.h },
        oilBill: { x: COL.oil, y: ROW.bottom + 8, w: BOX.oil.w, h: BOX.std.h },
        oilMerge: { x: COL.oilMerge, y: ROW.mid, w: BOX.merge.w, h: BOX.std.h },
        amtCalc: { x: COL.amt, y: ROW.top, w: BOX.amt.w, h: BOX.amt.h },
        amtInv: { x: COL.amt, y: ROW.bottom + 6, w: BOX.amt.w, h: BOX.std.h },
        amtMerge: { x: COL.amtMerge, y: ROW.mid, w: BOX.merge.w, h: BOX.std.h },
        diffFinal: { x: COL.final, y: 163, w: BOX.final.w, h: BOX.final.h }
    };

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function palette(sState) {
        if (sState === "Success") {
            return { fill: "#f5fae5", stroke: "#30914c", text: "#256f3a" };
        }
        if (sState === "Benefit") {
            return { fill: "#e8f4fd", stroke: "#0070f2", text: "#0070f2" };
        }
        if (sState === "Error") {
            return { fill: "#ffebeb", stroke: "#bb0000", text: "#a10000" };
        }
        return { fill: "#ffffff", stroke: "#0070f2", text: "#32363a" };
    }

    function edgePt(oPos, sSide) {
        const cy = oPos.y + oPos.h / 2;
        if (sSide === "right") {
            return { x: oPos.x + oPos.w, y: cy };
        }
        if (sSide === "left") {
            return { x: oPos.x, y: cy };
        }
        return { x: oPos.x + oPos.w / 2, y: cy };
    }

    function ortho(oFrom, oTo) {
        const mx = (oFrom.x + oTo.x) / 2;
        return `M ${oFrom.x} ${oFrom.y} L ${mx} ${oFrom.y} L ${mx} ${oTo.y} L ${oTo.x} ${oTo.y}`;
    }

    function flowNodes(oFlow) {
        if (!oFlow) {
            return [];
        }
        const q = oFlow.qty || {};
        const o = oFlow.oilPrice || {};
        const a = oFlow.amount || {};
        const d = oFlow.diff || {};

        return [
            { key: "qtyGr", title: q.sourceLeft?.label || "입고 (GR)", value: q.sourceLeft?.value || "-", state: "None" },
            { key: "qtyInv", title: q.sourceRight?.label || "청구 (IV)", value: q.sourceRight?.value || "-", state: "None" },
            { key: "qtyMerge", title: q.merge?.title || "-", state: q.merge?.state || "None", merge: true },
            { key: "oilCalc", title: o.sourceLeft?.label || "입고 기준 유가", value: o.sourceLeft?.value || "-",
                sub: o.sourceLeft?.sub || "", extra: o.sourceLeft?.oilcode || "", state: "None" },
            { key: "oilBill", title: o.sourceRight?.label || "청구 유가", value: o.sourceRight?.value || "-", state: "None" },
            { key: "oilMerge", title: o.merge?.title || "-", state: o.merge?.state || "None", merge: true },
            { key: "amtCalc", title: a.sourceLeft?.label || "비교 기준 금액", value: a.sourceLeft?.value || "-",
                sub: a.sourceLeft?.sub || "", extra: a.sourceLeft?.extra || "", state: "None" },
            { key: "amtInv", title: a.sourceRight?.label || "청구 금액", value: a.sourceRight?.value || "-", state: "None" },
            { key: "amtMerge", title: a.merge?.title || "-", state: a.merge?.state || "None", merge: true },
            { key: "diffFinal", title: d.merge?.title || "차이 금액", value: d.merge?.value || "-",
                result: d.merge?.result || "-", state: d.merge?.state || "None" }
        ];
    }

    function nodeSvg(oNode) {
        const oPos = POS[oNode.key];
        if (!oPos) {
            return "";
        }
        const c = palette(oNode.state);
        const cx = oPos.x + oPos.w / 2;

        if (oNode.merge) {
            return `<g><rect x="${oPos.x}" y="${oPos.y}" width="${oPos.w}" height="${oPos.h}" rx="8"`
                + ` fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5"/>`
                + `<text x="${cx}" y="${oPos.y + oPos.h / 2 + 5}" text-anchor="middle"`
                + ` class="oilFinalCompareGraph__merge">${esc(oNode.title)}</text></g>`;
        }

        let sub = "";
        if (oNode.key === "oilCalc" && (oNode.sub || oNode.extra)) {
            if (oNode.sub) {
                sub += `<text x="${cx}" y="${oPos.y + 62}" text-anchor="middle" class="oilFinalCompareGraph__sub">${esc(oNode.sub)}</text>`;
            }
            if (oNode.extra) {
                sub += `<text x="${cx}" y="${oPos.y + 80}" text-anchor="middle" class="oilFinalCompareGraph__sub">${esc(oNode.extra)}</text>`;
            }
        } else if (oNode.key === "amtCalc" && (oNode.sub || oNode.extra)) {
            if (oNode.sub) {
                sub += `<text x="${cx}" y="${oPos.y + 62}" text-anchor="middle" class="oilFinalCompareGraph__sub">${esc(oNode.sub)}</text>`;
            }
            if (oNode.extra) {
                sub += `<text x="${cx}" y="${oPos.y + 80}" text-anchor="middle" class="oilFinalCompareGraph__sub">${esc(oNode.extra)}</text>`;
            }
        } else if (oNode.sub) {
            sub = `<text x="${cx}" y="${oPos.y + 68}" text-anchor="middle" class="oilFinalCompareGraph__sub">${esc(oNode.sub)}</text>`;
        }

        const result = oNode.key === "diffFinal" && oNode.result
            ? `<text x="${cx}" y="${oPos.y + 80}" text-anchor="middle" fill="${c.text}"`
            + ` class="oilFinalCompareGraph__result">${esc(oNode.result)}</text>`
            : "";

        const titleY = oPos.h > BOX.std.h ? 22 : 24;
        const valueY = oPos.h > BOX.std.h ? 42 : 48;

        return `<g><rect x="${oPos.x}" y="${oPos.y}" width="${oPos.w}" height="${oPos.h}" rx="8"`
            + ` fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5"/>`
            + `<text x="${cx}" y="${oPos.y + titleY}" text-anchor="middle" class="oilFinalCompareGraph__title">${esc(oNode.title)}</text>`
            + `<text x="${cx}" y="${oPos.y + valueY}" text-anchor="middle" fill="${c.text}"`
            + ` class="oilFinalCompareGraph__value">${esc(oNode.value)}</text>`
            + sub + result + `</g>`;
    }

    function buildSvg(oFlow) {
        const mNodes = {};
        flowNodes(oFlow).forEach((n) => { mNodes[n.key] = n; });

        const lines = EDGES.map(([from, to]) => {
            const oFrom = mNodes[from];
            const oTo = mNodes[to];
            if (!oFrom || !oTo || !POS[from] || !POS[to]) {
                return "";
            }
            const mEdgeStroke = {
                Error: "#bb0000",
                Success: "#30914c",
                Benefit: "#0070f2"
            };
            const stroke = mEdgeStroke[oTo.state] || "#0070f2";
            const d = ortho(edgePt(POS[from], "right"), edgePt(POS[to], "left"));
            return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="2.5" marker-end="url(#oilFinalCmpArrow)"/>`;
        }).join("");

        const nodes = flowNodes(oFlow).map(nodeSvg).join("");

        const nDisplayW = Math.ceil(CANVAS_W * ZOOM);
        const nDisplayH = Math.ceil(H * ZOOM);

        return `<div class="oilFinalCompareGraph__canvas" style="width:${nDisplayW}px;height:${nDisplayH}px">`
            + `<svg class="oilFinalCompareGraph__svg" width="${CANVAS_W}" height="${H}"`
            + ` style="transform:scale(${ZOOM});transform-origin:top left"`
            + ` viewBox="0 0 ${CANVAS_W} ${H}" xmlns="http://www.w3.org/2000/svg">`
            + `<defs><marker id="oilFinalCmpArrow" markerWidth="8" markerHeight="8" refX="7" refY="4"`
            + ` orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#0070f2"/></marker></defs>`
            + lines + nodes + `</svg></div>`;
    }

    return Control.extend("code.t1.mm.test.controls.OilFinalCompareGraph", {
        metadata: {
            properties: {
                flow: { type: "object", defaultValue: null }
            }
        },

        setFlow(oFlow) {
            this.setProperty("flow", oFlow, true);
            this._renderGraph();
            return this;
        },

        onAfterRendering() {
            this._renderGraph();
        },

        _renderGraph() {
            const oEl = this.getDomRef()?.querySelector(".oilFinalCompareGraph__scroll");
            if (oEl) {
                oEl.innerHTML = buildSvg(this.getFlow());
            }
        },

        renderer(oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.class("oilFinalCompareGraph");
            oRm.openEnd();
            oRm.openStart("div");
            oRm.class("oilFinalCompareGraph__scroll");
            oRm.openEnd();
            oRm.close("div");
            oRm.close("div");
        }
    });
});
