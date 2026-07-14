sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "code/t1/mm/test/model/formatter",
    "code/t1/mm/test/util/PageFocusHelper",
    "code/t1/mm/test/util/AppDateTime",
    "code/t1/mm/test/util/ExchangeRateService"
], (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageToast, formatter, PageFocusHelper,
    AppDateTime, ExchangeRateService) => {
    "use strict";

    const PO_ITEM_ENTITY_SET = "/poitemSet";
    const PO_HEAD_ENTITY_SET = "/poheadSet";
    const GR_ITEM_ENTITY_SET = "/gritemSet";
    const GR_HEAD_ENTITY_SET = "/grheadSet";

    return Controller.extend("code.t1.mm.test.controller.ThreeWayMatch", {
        onInit() {
            this.getView().setModel(new JSONModel(this._createEmptyModel()), "matchView");

            PageFocusHelper.attachToView(this.getView());

            this.getOwnerComponent().getRouter()
                .getRoute("RouteThreeWayMatch")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        formatAmount(vAmount, sCurrency) {
            return formatter.formatAmount(vAmount, sCurrency);
        },

        formatQty(vQty, sUnit) {
            return formatter.formatQty(vQty, formatter.formatUnit(sUnit));
        },

        formatInvDate(sValue) {
            return formatter.formatInvDate(sValue);
        },

        formatUnit(sUnit) {
            return formatter.formatUnit(sUnit);
        },

        formatExchangeRate(vValue) {
            return formatter.formatExchangeRate(vValue);
        },

        formatFxRatePair(vRate, sFxWaers, sLocalWaers) {
            const fRate = this._parseNumber(vRate);
            if (!fRate) {
                return "-";
            }
            const sFx = (sFxWaers || "USD").trim();
            const sLocal = (sLocalWaers || "KRW").trim();
            return `1 ${sFx} = ${formatter.formatExchangeRate(fRate)} ${sLocal}`;
        },

        formatGrFxAmount(vKrw, vRate, sCurrency) {
            const fUsd = formatter.convertByExchangeRate(vKrw, vRate);
            if (!fUsd) {
                return "-";
            }
            return formatter.formatAmount(fUsd, sCurrency);
        },

        formatMatchResultState(sState) {
            return sState || "None";
        },

        _createEmptyModel() {
            return {
                InvNo: "",
                Waers: "",
                Meins: "",
                summary: {
                    overallStatus: "-",
                    overallState: "None",
                    matchResult: "-",
                    matchResultState: "None",
                    diffAmount: 0,
                    diffQty: 0,
                    flowSuccess: false
                },
                po: this._createEmptyDoc(),
                gr: this._createEmptyDoc(),
                inv: this._createEmptyDoc(),
                exchangeRate: {
                    fcurr: "",
                    tcurr: "KRW",
                    ukurs: 0,
                    fxRate: 0,
                    fxRateDate: "-"
                },
                poHead: {},
                amountRows: [],
                qtyRows: []
            };
        },

        _createEmptyDoc() {
            return {
                docNo: "-",
                docDate: "-",
                amount: 0,
                qty: 0,
                waers: "",
                meins: "",
                amountLocal: 0,
                waersLocal: "",
                amountFx: 0,
                waersFx: "",
                fxRate: 0,
                fxRateDate: "-",
                status: "-",
                statusState: "None"
            };
        },

        _resolveCurrency(aItems, sFallback) {
            for (let i = 0; i < aItems.length; i++) {
                const sWaers = (aItems[i].Waers || "").trim();
                if (sWaers) {
                    return sWaers;
                }
            }
            return sFallback || "";
        },

        _resolveUnit(aItems, sFallback) {
            for (let i = 0; i < aItems.length; i++) {
                const sMeins = (aItems[i].Meins || "").trim();
                if (sMeins) {
                    return sMeins;
                }
            }
            return sFallback || "";
        },

        _createDefaultCompareRows() {
            return {
                amountRows: [
                    { rowKey: "total", label: "총 금액", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "diff", label: "차이 금액", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true }
                ],
                qtyRows: [
                    { rowKey: "total", label: "총 수량", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "diff", label: "차이 수량", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true }
                ]
            };
        },

        _onRouteMatched(oEvent) {
            PageFocusHelper.clearHeaderFocus(this.getView());
            const sInvNo = oEvent.getParameter("arguments").InvNo;
            this._sInvNo = sInvNo;
            this._initPlaceholder(sInvNo);
            this._loadMatchData(sInvNo);
        },

        _initPlaceholder(sInvNo) {
            const oSource = this.getOwnerComponent().getModel("invoiceSource")?.getData();
            const sWaers = oSource?.bill?.Waers || oSource?.item?.Waers || "";
            const sMeins = oSource?.bill?.Meins || oSource?.item?.Meins || "";
            const sPoNo = oSource?.item?.Ebeln || oSource?.bill?.Ebeln || "-";
            const sInvNoDisplay = oSource?.bill?.InvNo || sInvNo || "-";
            const oCompareRows = this._createDefaultCompareRows();

            this.getView().getModel("matchView").setData({
                InvNo: sInvNo,
                Waers: sWaers,
                Meins: sMeins,
                summary: {
                    overallStatus: "-",
                    overallState: "None",
                    matchResult: "-",
                    matchResultState: "None",
                    diffAmount: 0,
                    diffQty: 0,
                    flowSuccess: false
                },
                po: {
                    docNo: sPoNo,
                    docDate: "-",
                    amount: 0,
                    qty: 0,
                    waers: "",
                    meins: sMeins,
                    status: "조회중",
                    statusState: "Information"
                },
                gr: {
                    docNo: "-",
                    docDate: "-",
                    amount: 0,
                    qty: 0,
                    waers: "",
                    meins: sMeins,
                    amountLocal: 0,
                    waersLocal: "KRW",
                    amountFx: 0,
                    waersFx: "",
                    fxRate: 0,
                    fxRateDate: "-",
                    status: "조회중",
                    statusState: "Information"
                },
                inv: {
                    docNo: sInvNoDisplay,
                    docDate: "-",
                    amount: 0,
                    qty: 0,
                    waers: sWaers,
                    meins: sMeins,
                    status: "-",
                    statusState: "None"
                },
                poHead: {},
                amountRows: oCompareRows.amountRows,
                qtyRows: oCompareRows.qtyRows
            });
        },

        _loadMatchData(sInvNo) {
            this.getView().setBusy(true);

            this._resolveBillContext(sInvNo)
                .then((oContext) => {
                    this._applyBillContext(oContext);
                    const sEbeln = oContext.ebeln;
                    if (!sEbeln) {
                        this._setLoadError("po", "PO 번호가 없습니다.");
                        return null;
                    }
                    return Promise.allSettled([
                        this._loadPoItems(sEbeln),
                        this._loadPoHead(sEbeln),
                        this._loadGrItems(sEbeln)
                    ]).then(async (aResults) => {
                        const aPoItems = aResults[0].status === "fulfilled" ? aResults[0].value : [];
                        const oPoHead = aResults[1].status === "fulfilled" ? aResults[1].value : {};
                        const aGrItems = aResults[2].status === "fulfilled" ? aResults[2].value : [];
                        let oGrHead = {};

                        if (aResults[0].status === "rejected") {
                            this._setLoadError("po", "PO 정보 조회에 실패했습니다.");
                        }
                        if (aResults[1].status === "rejected") {
                            MessageToast.show("PO 헤더 조회에 실패했습니다.");
                        }
                        if (aResults[2].status === "rejected") {
                            this._setLoadError("gr", "입고 정보 조회에 실패했습니다.");
                        }

                        const sMblnr = oContext.mblnr || aGrItems[0]?.Mblnr || "";
                        if (sMblnr) {
                            oGrHead = await this._loadGrHead(sMblnr);
                        }

                        return { aPoItems, oPoHead, aGrItems, oGrHead };
                    });
                })
                .then(async (oData) => {
                    if (!oData) {
                        return;
                    }
                    this._applyPoItems(oData.aPoItems, oData.oPoHead);
                    const oTodayFx = await this._loadTodayExchangeRate(
                        oData.oPoHead,
                        this.getView().getModel("matchView").getProperty("/inv/waers")
                    );
                    this._applyGrData(oData.aGrItems, oData.oGrHead, oData.oPoHead);
                    this._applyInvFxInfo(oTodayFx);
                })
                .catch(() => {
                    MessageToast.show("매칭 데이터 조회에 실패했습니다.");
                })
                .finally(() => {
                    this.getView().setBusy(false);
                    PageFocusHelper.clearHeaderFocus(this.getView());
                });
        },

        _resolveBillContext(sInvNo) {
            return new Promise((resolve) => {
                const oSource = this.getOwnerComponent().getModel("invoiceSource")?.getData();
                if (oSource?.bill?.InvNo === sInvNo) {
                    resolve(this._buildBillContext(oSource.bill, oSource.item || {}));
                    return;
                }

                const oModel = this.getOwnerComponent().getModel();
                oModel.read(oModel.createKey("/billSet", { InvNo: sInvNo }), {
                    success: (oBill) => {
                        oModel.read("/bill_itemsSet", {
                            filters: [new Filter("InvNo", FilterOperator.EQ, sInvNo)],
                            sorters: [new Sorter("InvItem")],
                            success: (oData) => {
                                const oItem = (oData.results || [])[0] || {};
                                resolve(this._buildBillContext(oBill, oItem));
                            },
                            error: () => {
                                resolve(this._buildBillContext(oBill, {}));
                            }
                        });
                    },
                    error: () => {
                        resolve(this._buildBillContext({}, {}));
                    }
                });
            });
        },

        _buildBillContext(oBill, oItem) {
            const sEbeln = (oItem.Ebeln || oBill.Ebeln || "").trim();
            const sMblnr = (oItem.Mblnr || "").trim();
            return {
                bill: oBill || {},
                item: oItem || {},
                ebeln: sEbeln,
                mblnr: sMblnr
            };
        },

        _loadPoItems(sEbeln) {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel().read(PO_ITEM_ENTITY_SET, {
                    filters: [new Filter("Ebeln", FilterOperator.EQ, sEbeln)],
                    sorters: [new Sorter("Ebelp")],
                    success: (oData) => resolve(oData.results || []),
                    error: reject
                });
            });
        },

        _loadPoHead(sEbeln) {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel().read(PO_HEAD_ENTITY_SET, {
                    filters: [new Filter("Ebeln", FilterOperator.EQ, sEbeln)],
                    success: (oData) => resolve((oData.results || [])[0] || {}),
                    error: reject
                });
            });
        },

        _loadGrItems(sEbeln) {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel().read(GR_ITEM_ENTITY_SET, {
                    filters: [new Filter("Ebeln", FilterOperator.EQ, sEbeln)],
                    sorters: [new Sorter("Zeile")],
                    success: (oData) => resolve(oData.results || []),
                    error: reject
                });
            });
        },

        _loadGrHead(sMblnr) {
            return new Promise((resolve) => {
                this.getOwnerComponent().getModel().read(GR_HEAD_ENTITY_SET, {
                    filters: [new Filter("Mblnr", FilterOperator.EQ, sMblnr)],
                    success: (oData) => resolve((oData.results || [])[0] || {}),
                    error: () => resolve({})
                });
            });
        },

        _getGrLineQty(oItem) {
            const fQty = this._parseNumber(oItem.Menge);
            return oItem.Shkzg === "H" ? -fQty : fQty;
        },

        _getGrLineLocalAmount(oItem) {
            return this._parseNumber(oItem.Wrbtr);
        },

        _convertGrByFx(fKrwAmount, fUkurs) {
            return formatter.convertByExchangeRate(fKrwAmount, fUkurs);
        },

        _getPoLineAmount(oItem) {
            const fTotalPrice = this._parseNumber(oItem.TotalPrice);
            if (fTotalPrice) {
                return fTotalPrice;
            }

            const fPurePrice = this._parseNumber(oItem.PurePrice);
            const fTaxPrice = this._parseNumber(oItem.TaxPrice);
            if (fPurePrice || fTaxPrice) {
                return fPurePrice + fTaxPrice;
            }

            const fQty = this._parseNumber(oItem.Menge);
            const fNetpr = this._parseNumber(oItem.Netpr);
            const fPeinh = this._parseNumber(oItem.Peinh) || 1;
            return fQty * fNetpr / fPeinh;
        },

        _applyBillContext(oContext) {
            const oBill = oContext.bill || {};
            const oItem = oContext.item || {};
            const oMatchModel = this.getView().getModel("matchView");
            const sWaers = oBill.Waers || oItem.Waers || oMatchModel.getProperty("/Waers") || "";
            const sMeins = oBill.Meins || oItem.Meins || oMatchModel.getProperty("/Meins") || "";
            const fBillAmt = this._parseNumber(oBill.TotalAmt);
            const fBillQty = this._parseNumber(oBill.TotalQty);
            const fItemAmt = this._parseNumber(oItem.ItemAmt);
            const fItemQty = this._parseNumber(oItem.Menge);
            const sInvDate = formatter.formatInvDate(oBill.InvDat || oItem.InvDat);

            oMatchModel.setProperty("/Meins", sMeins);
            oMatchModel.setProperty("/po/docNo", oContext.ebeln || oMatchModel.getProperty("/po/docNo"));

            oMatchModel.setProperty("/inv", {
                docNo: oBill.InvNo || this._sInvNo || "-",
                docDate: sInvDate || "-",
                amount: fItemAmt || fBillAmt,
                qty: fItemQty || fBillQty,
                waers: sWaers,
                meins: sMeins,
                status: formatter.formatInvoiceStatus(oBill.IvZlspr),
                statusState: formatter.formatInvoiceStatusState(oBill.IvZlspr)
            });

            const sInvAmt = formatter.formatAmount(fItemAmt || fBillAmt, sWaers);
            const sInvQty = formatter.formatQty(fItemQty || fBillQty, formatter.formatUnit(sMeins));

            this._updateCompareCell("amountRows", "total", "inv", sInvAmt);
            this._updateCompareCell("qtyRows", "total", "inv", sInvQty);
        },

        _getFxTargetCurrency(oPoHead, sFallback) {
            return (oPoHead?.Waers || oPoHead?.Tcurr || sFallback || "USD").trim();
        },

        async _loadTodayExchangeRate(oPoHead, sFallbackFxWaers) {
            const oMatchModel = this.getView().getModel("matchView");
            const sFxWaers = this._getFxTargetCurrency(oPoHead, sFallbackFxWaers);
            const sLocalWaers = oMatchModel?.getProperty("/gr/waersLocal") || "KRW";
            const oEmptyRate = {
                fcurr: sFxWaers,
                tcurr: sLocalWaers,
                ukurs: 0,
                fxRate: 0,
                fxRateDate: formatter.formatInvDate(AppDateTime.today()) || "-"
            };

            try {
                const oExchangeRate = await ExchangeRateService.loadExchangeRate(
                    this.getOwnerComponent().getModel(),
                    {
                        fcurr: sFxWaers,
                        tcurr: sLocalWaers,
                        gdatu: AppDateTime.today()
                    }
                );
                oMatchModel.setProperty("/exchangeRate", oExchangeRate);
                if (!oExchangeRate.ukurs) {
                    MessageToast.show("기준일 환율을 찾을 수 없습니다.");
                }
                return oExchangeRate;
            } catch (oError) {
                oMatchModel.setProperty("/exchangeRate", oEmptyRate);
                MessageToast.show("기준일 환율 조회에 실패했습니다.");
                return oEmptyRate;
            }
        },

        _applyInvFxInfo(oExchangeRate) {
            const oMatchModel = this.getView().getModel("matchView");
            const oInv = { ...(oMatchModel.getProperty("/inv") || {}) };
            const fAmt = this._parseNumber(oInv.amount);
            const fUkurs = this._parseNumber(oExchangeRate?.ukurs ?? oExchangeRate?.fxRate);
            const sLocalWaers = oMatchModel.getProperty("/gr/waersLocal") || "KRW";

            oMatchModel.setProperty("/inv", {
                ...oInv,
                amountLocal: fUkurs ? formatter.convertToLocalAmount(fAmt, fUkurs) : 0,
                waersLocal: sLocalWaers,
                fxRate: fUkurs,
                fxRateDate: oExchangeRate?.fxRateDate
                    || formatter.formatInvDate(AppDateTime.today())
                    || "-",
                waersFx: oInv.waers || oExchangeRate?.fcurr || "USD"
            });
        },

        _buildGrFxInfo(aItems, oPoHead, sLocalWaers, sFallbackFxWaers) {
            const fUkurs = this._parseNumber(oPoHead?.Ukurs);
            const sFxWaers = this._getFxTargetCurrency(oPoHead, sFallbackFxWaers);
            const sFxDate = formatter.formatInvDate(oPoHead?.Bedat) || "-";

            let fTotalKrw = 0;
            aItems.forEach((oItem) => {
                fTotalKrw += this._getGrLineLocalAmount(oItem);
            });

            return {
                amountLocal: fTotalKrw,
                waersLocal: sLocalWaers,
                amountFx: this._convertGrByFx(fTotalKrw, fUkurs),
                waersFx: sFxWaers,
                fxRate: fUkurs,
                fxRateDate: sFxDate
            };
        },

        _applyPoItems(aItems, oPoHead) {
            const oMatchModel = this.getView().getModel("matchView");
            const sInvWaers = oMatchModel.getProperty("/inv/waers") || "";
            const sInvMeins = oMatchModel.getProperty("/inv/meins") || "";
            const oHead = oPoHead || {};

            oMatchModel.setProperty("/poHead", oHead);

            if (!aItems.length) {
                oMatchModel.setProperty("/po/status", "품목 없음");
                oMatchModel.setProperty("/po/statusState", "Warning");
                return;
            }

            let fTotalQty = 0;
            let fTotalAmt = 0;
            let sPoDate = formatter.formatInvDate(oHead.Bedat);
            let sPoNo = oHead.Ebeln || "";

            aItems.forEach((oItem) => {
                const fQty = this._parseNumber(oItem.Menge);
                const fLineAmt = this._getPoLineAmount(oItem);

                fTotalQty += fQty;
                fTotalAmt += fLineAmt;
                sPoNo = oItem.Ebeln || sPoNo;

                if (!sPoDate) {
                    sPoDate = formatter.formatInvDate(oItem.Lfdat);
                }
            });

            const sPoWaers = this._resolveCurrency(aItems, oHead.Waers || sInvWaers);
            const sPoMeins = this._resolveUnit(aItems, sInvMeins);

            oMatchModel.setProperty("/po", {
                docNo: sPoNo || oMatchModel.getProperty("/po/docNo"),
                docDate: sPoDate || "-",
                amount: fTotalAmt,
                qty: fTotalQty,
                waers: sPoWaers,
                meins: sPoMeins,
                status: "조회완료",
                statusState: "Success"
            });

            const sPoAmt = formatter.formatAmount(fTotalAmt, sPoWaers);
            const sPoQty = formatter.formatQty(fTotalQty, formatter.formatUnit(sPoMeins));

            this._updateCompareCell("amountRows", "total", "po", sPoAmt);
            this._updateCompareCell("qtyRows", "total", "po", sPoQty);
        },

        _applyGrData(aItems, oGrHead, oPoHead) {
            const oMatchModel = this.getView().getModel("matchView");
            const sInvWaers = oMatchModel.getProperty("/inv/waers") || "";
            const sInvMeins = oMatchModel.getProperty("/inv/meins") || "";
            const sPoWaers = oMatchModel.getProperty("/po/waers") || sInvWaers;
            const oHead = oGrHead || {};
            const oPoHeadData = oPoHead || oMatchModel.getProperty("/poHead") || {};

            if (!aItems.length) {
                oMatchModel.setProperty("/gr", {
                    docNo: oHead.Mblnr || "-",
                    docDate: formatter.formatInvDate(oHead.Budat || oHead.Bldat) || "-",
                    amount: 0,
                    qty: 0,
                    waers: "KRW",
                    meins: sInvMeins,
                    amountLocal: 0,
                    waersLocal: "KRW",
                    amountFx: 0,
                    waersFx: this._getFxTargetCurrency(oPoHeadData, sPoWaers),
                    fxRate: this._parseNumber(oPoHeadData.Ukurs),
                    fxRateDate: formatter.formatInvDate(oPoHeadData.Bedat) || "-",
                    status: "품목 없음",
                    statusState: "Warning"
                });
                this._updateCompareDiffs();
                return;
            }

            let fTotalQty = 0;
            let sMblnr = oHead.Mblnr || "";
            const sLocalWaers = this._resolveCurrency(aItems, "KRW");

            aItems.forEach((oItem) => {
                fTotalQty += this._getGrLineQty(oItem);
                sMblnr = oItem.Mblnr || sMblnr;
            });

            const sGrMeins = this._resolveUnit(aItems, sInvMeins);
            const oFx = this._buildGrFxInfo(aItems, oPoHeadData, sLocalWaers, sPoWaers);

            oMatchModel.setProperty("/gr", {
                docNo: sMblnr || "-",
                docDate: formatter.formatInvDate(oHead.Budat || oHead.Bldat) || "-",
                qty: fTotalQty,
                meins: sGrMeins,
                amountLocal: oFx.amountLocal,
                waersLocal: oFx.waersLocal,
                amountFx: oFx.amountFx,
                waersFx: oFx.waersFx,
                fxRate: oFx.fxRate,
                fxRateDate: oFx.fxRateDate,
                status: "조회완료",
                statusState: "Success"
            });

            const sGrKrwAmt = formatter.formatAmount(oFx.amountLocal, oFx.waersLocal);
            const sGrUsdAmt = this.formatGrFxAmount(oFx.amountLocal, oFx.fxRate, oFx.waersFx);
            const sGrQty = formatter.formatQty(fTotalQty, formatter.formatUnit(sGrMeins));

            this._updateCompareCell("amountRows", "total", "gr", sGrUsdAmt);
            this._updateCompareCell("qtyRows", "total", "gr", sGrQty);
            this._updateCompareDiffs();
        },

        _setLoadError(sType, sMessage) {
            const oMatchModel = this.getView().getModel("matchView");
            if (sType === "po") {
                oMatchModel.setProperty("/po/status", "조회 실패");
                oMatchModel.setProperty("/po/statusState", "Error");
            }
            if (sType === "gr") {
                oMatchModel.setProperty("/gr/status", "조회 실패");
                oMatchModel.setProperty("/gr/statusState", "Error");
            }
            MessageToast.show(sMessage);
        },

        _updateCompareCell(sRowsPath, sRowKey, sColumn, sValue) {
            const oMatchModel = this.getView().getModel("matchView");
            const aRows = oMatchModel.getProperty(`/${sRowsPath}`) || [];
            const iIndex = aRows.findIndex((oRow) => oRow.rowKey === sRowKey);
            if (iIndex < 0) {
                return;
            }
            oMatchModel.setProperty(`/${sRowsPath}/${iIndex}/${sColumn}`, sValue);
        },

        _updateCompareDiffs() {
            const oMatchModel = this.getView().getModel("matchView");
            const fPoAmt = this._parseNumber(oMatchModel.getProperty("/po/amount"));
            const fGrAmt = formatter.convertByExchangeRate(
                oMatchModel.getProperty("/gr/amountLocal"),
                oMatchModel.getProperty("/gr/fxRate")
            );
            const fInvAmt = this._parseNumber(oMatchModel.getProperty("/inv/amount"));
            const fPoQty = this._parseNumber(oMatchModel.getProperty("/po/qty"));
            const fGrQty = this._parseNumber(oMatchModel.getProperty("/gr/qty"));
            const fInvQty = this._parseNumber(oMatchModel.getProperty("/inv/qty"));
            const sPoWaers = oMatchModel.getProperty("/po/waers") || "";
            const sGrWaers = oMatchModel.getProperty("/gr/waersFx")
                || oMatchModel.getProperty("/gr/waers") || "";
            const sInvWaers = oMatchModel.getProperty("/inv/waers") || "";
            const sPoMeins = oMatchModel.getProperty("/po/meins") || "";
            const sGrMeins = oMatchModel.getProperty("/gr/meins") || "";
            const sInvMeins = oMatchModel.getProperty("/inv/meins") || "";

            const fAmtDiffInvPo = fInvAmt - fPoAmt;
            const fAmtDiffInvGr = fInvAmt - fGrAmt;
            const fAmtDiffPoGr = fPoAmt - fGrAmt;
            const fQtyDiffInvPo = fInvQty - fPoQty;
            const fQtyDiffInvGr = fInvQty - fGrQty;
            const fQtyDiffPoGr = fPoQty - fGrQty;
            const bAmtOk = Math.abs(fAmtDiffInvGr) < 0.01;
            const bQtyOk = Math.abs(fQtyDiffInvGr) < 0.001;
            const bFlowOk = bAmtOk && bQtyOk && fGrAmt > 0 && fInvAmt > 0;

            oMatchModel.setProperty("/summary/diffAmount", fAmtDiffInvGr);
            oMatchModel.setProperty("/summary/diffQty", fQtyDiffInvGr);
            oMatchModel.setProperty("/summary/flowSuccess", bFlowOk);
            oMatchModel.setProperty("/summary/overallStatus", bFlowOk ? "일치" : "확인필요");
            oMatchModel.setProperty("/summary/overallState", bFlowOk ? "Success" : "Warning");
            oMatchModel.setProperty("/summary/matchResult", bFlowOk ? "매칭 성공" : "불일치");
            oMatchModel.setProperty("/summary/matchResultState", bFlowOk ? "Success" : "Error");

            this._updateCompareCell("amountRows", "total", "result", bAmtOk ? "일치" : "불일치");
            oMatchModel.setProperty("/amountRows/" + this._findRowIndex("amountRows", "total") + "/resultState", bAmtOk ? "Success" : "Error");

            this._updateCompareCell("amountRows", "diff", "po", "-");
            this._updateCompareCell("amountRows", "diff", "gr", "-");
            this._updateCompareCell("amountRows", "diff", "inv", "-");
            this._updateCompareCell("amountRows", "diff", "result", formatter.formatAmount(fAmtDiffInvGr, sInvWaers));
            oMatchModel.setProperty("/amountRows/" + this._findRowIndex("amountRows", "diff") + "/resultState", "None");

            this._updateCompareCell("qtyRows", "total", "result", bQtyOk ? "일치" : "불일치");
            oMatchModel.setProperty("/qtyRows/" + this._findRowIndex("qtyRows", "total") + "/resultState", bQtyOk ? "Success" : "Error");

            this._updateCompareCell("qtyRows", "diff", "po", "-");
            this._updateCompareCell("qtyRows", "diff", "gr", "-");
            this._updateCompareCell("qtyRows", "diff", "inv", "-");
            this._updateCompareCell("qtyRows", "diff", "result",
                formatter.formatQty(fQtyDiffInvGr, formatter.formatUnit(sInvMeins)));
            oMatchModel.setProperty("/qtyRows/" + this._findRowIndex("qtyRows", "diff") + "/resultState", "None");
        },

        _findRowIndex(sRowsPath, sRowKey) {
            const aRows = this.getView().getModel("matchView").getProperty(`/${sRowsPath}`) || [];
            return Math.max(aRows.findIndex((oRow) => oRow.rowKey === sRowKey), 0);
        },

        _parseNumber(vValue) {
            const nValue = parseFloat(vValue);
            return isNaN(nValue) ? 0 : nValue;
        },

        onNavBack() {
            if (this._sInvNo) {
                this.getOwnerComponent().getRouter().navTo("RouteInvoiceCreate", {
                    InvNo: this._sInvNo
                });
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain");
            }
        },

        onNavMain() {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        onNavBillDetail() {
            if (this._sInvNo) {
                this.getOwnerComponent().getRouter().navTo("RouteBillDetail", {
                    InvNo: this._sInvNo
                });
            }
        },

        onNavInvoiceCreate() {
            this.onNavBack();
        },

        onShowMismatch() {
            MessageToast.show("불일치 항목 보기 (추후 구현)");
        },

        onProceedRegister() {
            MessageToast.show("송장 등록 진행 (추후 구현)");
        }
    });
});
