sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text",
    "sap/ui/core/ValueState",
    "code/t1/mm/test/model/formatter",
    "code/t1/mm/test/util/PageFocusHelper",
    "code/t1/mm/test/util/AppDateTime",
    "code/t1/mm/test/util/ExchangeRateService",
    "code/t1/mm/test/util/VerificationBasePrice"
], (Controller, Fragment, JSONModel, Filter, FilterOperator, Sorter, MessageToast, MessageBox,
    Dialog, DialogType, Button, ButtonType, Text, ValueState, formatter, PageFocusHelper, AppDateTime,
    ExchangeRateService, VerificationBasePrice) => {
    "use strict";

    const PO_ITEM_ENTITY_SET = "/poitemSet";
    const PO_HEAD_ENTITY_SET = "/poheadSet";
    const GR_ITEM_ENTITY_SET = "/gritemSet";
    const GR_HEAD_ENTITY_SET = "/grheadSet";
    const MONTH_OIL_ENTITY_SET = "/monthoilSet";

    return Controller.extend("code.t1.mm.test.controller.InvoiceCreate", {
        onInit() {
            this.getView().setModel(new JSONModel({
                Bukrs: "1000",
                BukrsName: "OLEUM"
            }), "invoiceHeader");
            this.getView().setModel(new JSONModel({}), "invoiceItem");
            this.getView().setModel(new JSONModel({}), "billRef");
            this.getView().setModel(new JSONModel({
                calcAmount: 0,
                amountDiff: 0,
                qtyDiff: 0,
                amountVerifyOk: true,
                qtyVerifyOk: true,
                oilPriceYear: "",
                oilPriceMonth: "",
                oilcode: ""
            }), "invoiceMetrics");
            this.getView().setModel(new JSONModel(this._createEmptyMatchModel()), "matchView");
            this.getView().setModel(new JSONModel(this._createDefaultViewState()), "viewState");
            this.getView().setModel(new JSONModel(this._createEmptyProcessFlowData()), "invoiceProcessFlow");

            PageFocusHelper.attachToView(this.getView());

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteInvoiceCreate").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("RouteThreeWayMatch").attachPatternMatched(this._onRouteMatched, this);
        },

        formatInvDate(sValue) {
            return formatter.formatInvDate(sValue);
        },

        formatInvoiceStatus(sCode) {
            return formatter.formatInvoiceStatus(sCode);
        },

        formatInvoiceStatusState(sCode) {
            return formatter.formatInvoiceStatusState(sCode);
        },

        formatPaymentTerm(sCode) {
            return formatter.formatPaymentTerm(sCode);
        },

        formatTaxCode(sCode) {
            return formatter.formatTaxCode(sCode);
        },

        formatTaxCodeDesc(sCode) {
            return formatter.formatTaxCodeDesc(sCode);
        },

        formatMaterial(sCode) {
            return formatter.formatMaterial(sCode);
        },

        formatBukrsWithName(sBukrs, sName) {
            return formatter.formatBukrsWithName(sBukrs, sName);
        },

        formatUnit(sUnit) {
            return formatter.formatUnit(sUnit);
        },

        formatAmount(vAmount, sCurrency) {
            return formatter.formatAmount(vAmount, sCurrency);
        },

        formatQty(vQty, sUnit) {
            return formatter.formatQty(vQty, formatter.formatUnit(sUnit));
        },

        formatVerifyStatus(bOk) {
            return formatter.formatVerifyStatus(bOk);
        },

        formatVerifyState(bOk) {
            return formatter.formatVerifyState(bOk);
        },

        formatPrepStatus() {
            return formatter.formatPrepStatus();
        },

        formatPrepStatusState() {
            return formatter.formatPrepStatusState();
        },

        formatApprovalStatus(sCode) {
            return formatter.formatApprovalStatus(sCode);
        },

        formatApprovalStatusState(sCode) {
            return formatter.formatApprovalStatusState(sCode);
        },

        formatInternalStatus(sCode) {
            return formatter.formatInternalStatus(sCode);
        },

        formatInternalStatusState(sCode) {
            return formatter.formatInternalStatusState(sCode);
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

        formatGrAmountFx(vFx, vLocal, vRate, sCurrency) {
            const fFx = this._parseNumber(vFx);
            if (fFx) {
                return formatter.formatAmount(fFx, sCurrency);
            }
            return this.formatGrFxAmount(vLocal, vRate, sCurrency);
        },

        formatLocalAmountForSap(vAmount, sCurrency) {
            const sSapAmount = formatter.formatAmount(formatter.toSapLocalAmount(vAmount), sCurrency);
            return `${this._getI18nText("labelSapStorageHint")}: ${sSapAmount}`;
        },

        formatMatchVerifyStatus(bOk) {
            return bOk ? "일치" : "불일치";
        },

        formatMatchVerifyState(bOk) {
            return bOk ? "Success" : "Error";
        },

        formatFlowCardClass(bIssue) {
            return "threeWayMatchFlowCard" + (bIssue ? " threeWayMatchFlowCard--issue" : "");
        },

        formatFlowFieldClass(bIssue) {
            return "billDetailFieldRow" + (bIssue ? " threeWayMatchFlowFieldRow--issue" : "");
        },

        formatFlowConnectorClass(bIssue) {
            return "threeWayMatchFlowConnector" + (bIssue ? " threeWayMatchFlowConnector--issue" : "");
        },

        _getI18nText(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },

        _createDefaultViewState() {
            return {
                registered: false,
                actionText: this._getI18nText("btnCreateInvoice"),
                actionIcon: "sap-icon://create-form"
            };
        },

        _isInvoiceRegistered(sIvZlspr) {
            return formatter.isInvoiceRegistered(sIvZlspr);
        },

        _isInvoiceViewMode() {
            return !!this.getView().getModel("viewState").getProperty("/registered");
        },

        _updateInvoiceViewState(bRegistered) {
            this.getView().getModel("viewState").setData({
                registered: !!bRegistered,
                actionText: this._getI18nText(bRegistered ? "btnViewInvoice" : "btnCreateInvoice"),
                actionIcon: bRegistered ? "sap-icon://display" : "sap-icon://create-form"
            });
        },

        onInvoiceFooterAction() {
            if (this.getView().getModel("viewState").getProperty("/registered")) {
                MessageToast.show(this._getI18nText("invoiceViewModeHint"));
                return;
            }
            this.onRegisterInvoice();
        },

        onShowMatchIssueDetail() {
            const oMatchModel = this.getView().getModel("matchView");
            const sDetail = oMatchModel.getProperty("/summary/issueDetail");
            if (!sDetail || sDetail === "일치") {
                return;
            }

            if (!this._oMatchIssueDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "code.t1.mm.test.view.fragments.MatchFlowIssueDialog",
                    controller: this
                }).then((oDialog) => {
                    this._oMatchIssueDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                });
                return;
            }

            this._oMatchIssueDialog.open();
        },

        onCloseMatchIssueDialog() {
            this._oMatchIssueDialog?.close();
        },

        onInvoiceProcessNodePress(oEvent) {
            const oNode = oEvent.getParameter("oNode");
            const sText = oNode?.getStateText?.();
            if (sText) {
                MessageToast.show(sText);
            }
        },

        onShowInvoiceProcessFlow() {
            this._refreshInvoiceProcessFlow();

            if (!this._oInvoiceProcessDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "code.t1.mm.test.view.fragments.InvoiceProcessFlowDialog",
                    controller: this
                }).then((oDialog) => {
                    this._oInvoiceProcessDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    Fragment.byId(this.getView().getId(), "invoiceProcessFlow")?.updateModel();
                    oDialog.open();
                });
                return;
            }

            Fragment.byId(this.getView().getId(), "invoiceProcessFlow")?.updateModel();
            this._oInvoiceProcessDialog.open();
        },

        onCloseInvoiceProcessDialog() {
            this._oInvoiceProcessDialog?.close();
        },

        _createEmptyProcessFlowData() {
            return {
                nodes: [],
                lanes: [],
                summary: { text: "-", state: "None" }
            };
        },

        _resolveRegisterProcessNode(bRegistered) {
            if (bRegistered) {
                return {
                    state: "Positive",
                    stateText: this._getI18nText("processRegisterDone"),
                    highlighted: true
                };
            }
            return {
                state: "Planned",
                stateText: this._getI18nText("processRegisterReady"),
                highlighted: true
            };
        },

        _resolveApprovalProcessNode(bRegistered, sZlspr) {
            if (!bRegistered) {
                return {
                    state: "Planned",
                    stateText: this._getI18nText("processApprovalWaiting"),
                    highlighted: false
                };
            }
            if (sZlspr === "R") {
                return {
                    state: "Negative",
                    stateText: this._getI18nText("processApprovalRejected"),
                    highlighted: true
                };
            }
            if (sZlspr === "A" || sZlspr === "F") {
                return {
                    state: "Positive",
                    stateText: this._getI18nText("processApprovalDone"),
                    highlighted: true
                };
            }
            return {
                state: "Planned",
                stateText: this._getI18nText("processApprovalPending"),
                highlighted: true
            };
        },

        _resolvePaymentProcessNode(bRegistered, sZlspr) {
            if (!bRegistered) {
                return {
                    state: "Planned",
                    stateText: this._getI18nText("processPaymentWaiting"),
                    highlighted: false
                };
            }
            if (sZlspr === "R") {
                return {
                    state: "Neutral",
                    stateText: "-",
                    highlighted: false
                };
            }
            if (sZlspr === "F") {
                return {
                    state: "Positive",
                    stateText: this._getI18nText("processPaymentDone"),
                    highlighted: true
                };
            }
            if (sZlspr === "A") {
                return {
                    state: "Critical",
                    stateText: this._getI18nText("processPaymentWaiting"),
                    highlighted: true
                };
            }
            return {
                state: "Planned",
                stateText: this._getI18nText("processPaymentWaiting"),
                highlighted: false
            };
        },

        _refreshInvoiceProcessFlow() {
            const bRegistered = this._isInvoiceViewMode();
            const sZlspr = (this.getView().getModel("invoiceHeader").getProperty("/Zlspr") || "")
                .trim().toUpperCase();
            const oRegisterNode = this._resolveRegisterProcessNode(bRegistered);
            const oApprovalNode = this._resolveApprovalProcessNode(bRegistered, sZlspr);
            const oPaymentNode = this._resolvePaymentProcessNode(bRegistered, sZlspr);

            const sSummaryText = !bRegistered
                ? this._getI18nText("processRegisterReady")
                : formatter.formatApprovalStatus(sZlspr);
            const sSummaryState = !bRegistered
                ? "Warning"
                : formatter.formatApprovalStatusState(sZlspr);

            const oData = {
                summary: {
                    text: sSummaryText,
                    state: sSummaryState
                },
                nodes: [
                    {
                        nodeId: "1",
                        laneId: "0",
                        title: this._getI18nText("processStepRegister"),
                        titleAbbreviation: this._getI18nText("processStepRegisterAbbr"),
                        children: ["2"],
                        state: oRegisterNode.state,
                        stateText: oRegisterNode.stateText,
                        highlighted: oRegisterNode.highlighted
                    },
                    {
                        nodeId: "2",
                        laneId: "1",
                        title: this._getI18nText("processStepApproval"),
                        titleAbbreviation: this._getI18nText("processStepApprovalAbbr"),
                        children: ["3"],
                        state: oApprovalNode.state,
                        stateText: oApprovalNode.stateText,
                        highlighted: oApprovalNode.highlighted
                    },
                    {
                        nodeId: "3",
                        laneId: "2",
                        title: this._getI18nText("processStepPayment"),
                        titleAbbreviation: this._getI18nText("processStepPaymentAbbr"),
                        children: [],
                        state: oPaymentNode.state,
                        stateText: oPaymentNode.stateText,
                        highlighted: oPaymentNode.highlighted
                    }
                ],
                lanes: [
                    {
                        laneId: "0",
                        iconSrc: "sap-icon://create-form",
                        text: this._getI18nText("processStepRegister"),
                        position: 0
                    },
                    {
                        laneId: "1",
                        iconSrc: "sap-icon://approvals",
                        text: this._getI18nText("processStepApproval"),
                        position: 1
                    },
                    {
                        laneId: "2",
                        iconSrc: "sap-icon://money-bills",
                        text: this._getI18nText("processStepPayment"),
                        position: 2
                    }
                ]
            };

            const oModel = this.getView().getModel("invoiceProcessFlow");
            oModel.setData(oData);
            Fragment.byId(this.getView().getId(), "invoiceProcessFlow")?.updateModel();
        },

        _createEmptyMatchModel() {
            const oCompareRows = this._createDefaultCompareRows();
            return {
                InvNo: "",
                Waers: "",
                Meins: "",
                summary: {
                    overallStatus: "-",
                    overallState: "None",
                    matchResult: "-",
                    matchResultState: "None",
                    issueDetail: "-",
                    diffAmount: 0,
                    diffQty: 0,
                    flowSuccess: false,
                    unitPriceOk: false,
                    hasBadData: false,
                    oilFinalOk: false,
                    oilCalcAmount: 0
                },
                flowIssue: this._createEmptyFlowIssue(),
                exchangeRate: {
                    fcurr: "",
                    tcurr: "KRW",
                    ukurs: 0,
                    fxRate: 0,
                    fxRateDate: "-"
                },
                po: this._createEmptyDoc(),
                gr: this._createEmptyDoc(),
                inv: this._createEmptyDoc(),
                poHead: {},
                amountRows: oCompareRows.amountRows,
                qtyRows: oCompareRows.qtyRows,
                oilFinalFlow: oCompareRows.oilFinalFlow
            };
        },

        _createEmptyFlowIssue() {
            const oField = () => ({ card: false, amount: false, qty: false });
            return {
                po: oField(),
                gr: oField(),
                inv: oField(),
                poGrLink: false,
                grInvLink: false,
                oilFinal: false,
                overall: false
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

        _createDefaultCompareRows() {
            return {
                amountRows: [
                    { rowKey: "total", label: "총 금액", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "diff", label: "차이 금액", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "unit", label: "단가", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "unitDiff", label: "단가 차이", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true }
                ],
                qtyRows: [
                    { rowKey: "total", label: "총 수량", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true },
                    { rowKey: "diff", label: "차이 수량", po: "-", gr: "-", inv: "-", result: "-", resultState: "None", emphasized: true }
                ],
                oilFinalFlow: this._createDefaultOilFinalFlow()
            };
        },

        _formatOilPricePeriod(sYear, sMonth) {
            if (!sYear || !sMonth) {
                return "";
            }
            const nMonth = parseInt(String(sMonth).replace(/^0+/, ""), 10) || parseInt(sMonth, 10);
            if (!nMonth) {
                return "";
            }
            return `${sYear}년 ${nMonth}월`;
        },

        _createDefaultOilFinalFlow() {
            const oSource = (sLabel) => ({ label: sLabel, value: "-", sub: "", oilcode: "" });
            const oMerge = (sTitle) => ({
                title: sTitle,
                result: "-",
                state: "None",
                stateClass: "none"
            });

            return {
                qty: {
                    stageNo: 1,
                    stageTitle: "수량",
                    sourceLeft: oSource("입고 (GR)"),
                    sourceRight: oSource("청구 (IV)"),
                    merge: oMerge("-")
                },
                oilPrice: {
                    stageNo: 2,
                    stageTitle: "입고 기준 유가",
                    sourceLeft: oSource("입고 기준 유가"),
                    sourceRight: oSource("청구 유가"),
                    merge: oMerge("-")
                },
                amount: {
                    stageNo: 3,
                    stageTitle: "유가 기준 금액",
                    sourceLeft: oSource("비교 기준 금액"),
                    sourceRight: oSource("청구 금액"),
                    merge: oMerge("-")
                },
                diff: {
                    stageNo: 4,
                    stageTitle: "차이 금액",
                    merge: {
                        title: "차이 금액",
                        value: "-",
                        result: "-",
                        state: "None",
                        stateClass: "none"
                    }
                }
            };
        },

        _oilFinalStateClass(sState) {
            if (sState === "Success") {
                return "ok";
            }
            if (sState === "Benefit") {
                return "benefit";
            }
            if (sState === "Error") {
                return "fail";
            }
            return "none";
        },

        _resolveOilFinalDiffResult(fDiffAmt, bHasOilPrice) {
            if (!bHasOilPrice) {
                return { text: "-", state: "None" };
            }
            if (this._isAmountClose(0, fDiffAmt)) {
                return { text: "금액 일치", state: "Success" };
            }
            if (fDiffAmt < 0) {
                return { text: "청구 감소 (이득)", state: "Benefit" };
            }
            return { text: "청구 초과", state: "Error" };
        },

        _refreshOilFinalCompareGraph() {
            const oGraph = this.byId("oilFinalCompareGraph");
            if (!oGraph) {
                return;
            }
            oGraph.setFlow(this.getView().getModel("matchView").getProperty("/oilFinalFlow"));
        },

        _onRouteMatched(oEvent) {
            PageFocusHelper.clearHeaderFocus(this.getView());
            const sInvNo = oEvent.getParameter("arguments").InvNo;
            this._sInvNo = sInvNo;
            this._resetAllModels();
            this._applyInvoiceSource(sInvNo);
            this._initMatchPlaceholder(sInvNo);
            this.getView().setBusy(true);
            Promise.all([
                this._loadBillDataAsync(sInvNo),
                this._loadMatchDataAsync(sInvNo)
            ]).then(() => this._loadInvoiceFromServerAsync(sInvNo))
            .then(() => this._reapplyInvoiceExchangeRate())
            .finally(() => {
                this._syncInvoiceFromMatch();
                this._updateCompareDiffs();
                this.getView().setBusy(false);
                this._refreshOilFinalCompareGraph();
                this._refreshInvoiceProcessFlow();
                PageFocusHelper.clearHeaderFocus(this.getView());
            });
        },

        _resetAllModels() {
            this.getView().getModel("invoiceHeader").setData({
                Bukrs: "1000",
                BukrsName: "OLEUM"
            });
            this.getView().getModel("invoiceItem").setData({});
            this.getView().getModel("billRef").setData({});
            this.getView().getModel("invoiceMetrics").setData({
                calcAmount: 0,
                amountDiff: 0,
                qtyDiff: 0,
                amountVerifyOk: true,
                qtyVerifyOk: true,
                unitPriceOk: false,
                hasBadData: false
            });
            this.getView().getModel("matchView").setData(this._createEmptyMatchModel());
            this.getView().getModel("viewState").setData(this._createDefaultViewState());
            this.getView().getModel("invoiceProcessFlow").setData(this._createEmptyProcessFlowData());
            this._refreshOilFinalCompareGraph();
        },

        _initMatchPlaceholder(sInvNo) {
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
                    issueDetail: "-",
                    diffAmount: 0,
                    diffQty: 0,
                    flowSuccess: false,
                    unitPriceOk: false,
                    hasBadData: false,
                    oilFinalOk: false,
                    oilCalcAmount: 0
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
                qtyRows: oCompareRows.qtyRows,
                oilFinalFlow: oCompareRows.oilFinalFlow
            });
        },

        _applyInvoiceSource(sInvNo) {
            const oSourceModel = this.getOwnerComponent().getModel("invoiceSource");
            if (!oSourceModel) {
                return;
            }
            const oSource = oSourceModel.getData();
            if (oSource?.bill?.InvNo === sInvNo) {
                this._buildInvoiceDraft(oSource.bill, oSource.item || {}, oSource.metrics);
            }
        },

        _loadBillDataAsync(sInvNo) {
            return new Promise((resolve) => {
                const oModel = this.getOwnerComponent().getModel();
                const sPath = oModel.createKey("/billSet", { InvNo: sInvNo });

                oModel.read(sPath, {
                    success: (oBill) => {
                        this._loadBillItemAsync(sInvNo, oBill).finally(resolve);
                    },
                    error: () => {
                        if (!this.getView().getModel("invoiceHeader").getProperty("/InvNo")) {
                            MessageToast.show("청구서 정보를 찾을 수 없습니다.");
                        }
                        resolve();
                    }
                });
            });
        },

        _loadBillItemAsync(sInvNo, oBill) {
            return new Promise((resolve) => {
                this.getOwnerComponent().getModel().read("/bill_itemsSet", {
                    filters: [new Filter("InvNo", FilterOperator.EQ, sInvNo)],
                    sorters: [new Sorter("InvItem")],
                    success: (oData) => {
                        const aResults = oData.results || [];
                        let oItem = aResults.length > 0 ? aResults[0] : {};
                        if (!aResults.length) {
                            oItem = this._findBillItemFromSource(sInvNo) || oItem;
                        }
                        this._buildInvoiceDraft(oBill, oItem);
                        resolve();
                    },
                    error: () => {
                        const oItem = this._findBillItemFromSource(sInvNo) || {};
                        this._buildInvoiceDraft(oBill, oItem);
                        if (!oItem.InvItem) {
                            MessageToast.show("청구서 아이템 조회에 실패했습니다.");
                        }
                        resolve();
                    }
                });
            });
        },

        _loadMatchDataAsync(sInvNo) {
            return this._resolveBillContext(sInvNo)
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
                        const sMjahr = aGrItems[0]?.Mjahr || "";
                        if (sMblnr) {
                            oGrHead = await this._loadGrHead(sMblnr, sMjahr);
                        }

                        return {
                            aPoItems,
                            oPoHead,
                            aGrItems,
                            oGrHead,
                            oBillItem: oContext.item || {},
                            oBill: oContext.bill || {}
                        };
                    });
                })
                .then(async (oData) => {
                    if (!oData) {
                        return;
                    }
                    this._applyPoItems(oData.aPoItems, oData.oPoHead);
                    this._applyGrData(oData.aGrItems, oData.oGrHead, oData.oPoHead);
                    await this._applyMonthOilPrice(oData.oGrHead, oData.oBillItem, oData.aPoItems);
                    this._syncInvoiceFromMatch();
                })
                .catch(() => {
                    MessageToast.show("매칭 데이터 조회에 실패했습니다.");
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

        _loadGrHead(sMblnr, sMjahr) {
            return new Promise((resolve) => {
                const aFilters = [new Filter("Mblnr", FilterOperator.EQ, sMblnr)];
                if (sMjahr) {
                    aFilters.push(new Filter("Mjahr", FilterOperator.EQ, sMjahr));
                }
                this.getOwnerComponent().getModel().read(GR_HEAD_ENTITY_SET, {
                    filters: aFilters,
                    success: (oData) => resolve((oData.results || [])[0] || {}),
                    error: () => resolve({})
                });
            });
        },

        _findBillItemFromSource(sInvNo) {
            const oSourceModel = this.getOwnerComponent().getModel("invoiceSource");
            if (!oSourceModel) {
                return null;
            }
            const oSource = oSourceModel.getData();
            if (oSource?.bill?.InvNo === sInvNo && oSource.item) {
                return oSource.item;
            }
            return null;
        },

        _toSapLocalDate(vValue) {
            return formatter.toLocalCalendarDate(vValue);
        },

        _toDate(vValue) {
            return formatter.toLocalCalendarDate(vValue);
        },

        _toODataDate(vValue) {
            return formatter.toODataDate(vValue);
        },

        _toPickerDateString(vValue) {
            return formatter.formatDateForPicker(vValue);
        },

        _getYearFromDate(vValue) {
            if (typeof vValue === "string") {
                const sMatch = vValue.trim().match(/^(\d{4})/);
                if (sMatch) {
                    return sMatch[1];
                }
            }
            const oDate = this._toDate(vValue);
            return oDate ? String(oDate.getFullYear()) : "";
        },

        _getPrevMonthYearMon(vDate) {
            const oDate = this._toSapLocalDate(vDate);
            if (!oDate) {
                return { year: "", month: "" };
            }

            let iYear = oDate.getFullYear();
            let iMonth = oDate.getMonth() + 1;
            iMonth -= 1;
            if (iMonth <= 0) {
                iMonth = 12;
                iYear -= 1;
            }

            return {
                year: String(iYear),
                month: String(iMonth).padStart(2, "0")
            };
        },

        _normalizeMatnr(sMatnr) {
            return (sMatnr || "").trim().toUpperCase();
        },

        _resolvePoItemMatnr(aPoItems, oBillItem) {
            const aItems = aPoItems || [];
            const sEbelp = (oBillItem?.Ebelp || "").trim();

            if (sEbelp) {
                const oMatchedPoItem = aItems.find((oItem) => (oItem.Ebelp || "").trim() === sEbelp);
                if (oMatchedPoItem?.Matnr) {
                    return this._normalizeMatnr(oMatchedPoItem.Matnr);
                }
            }

            for (let i = 0; i < aItems.length; i++) {
                if (aItems[i].Matnr) {
                    return this._normalizeMatnr(aItems[i].Matnr);
                }
            }

            return this._normalizeMatnr(oBillItem?.Matnr);
        },

        _getMonthFilterVariants(sMonat) {
            const sPadded = String(sMonat || "").padStart(2, "0");
            const sUnpadded = String(parseInt(sMonat, 10) || "");
            return sPadded === sUnpadded ? [sPadded] : [sPadded, sUnpadded];
        },

        _readMonthOilByKey(sYearat, sMonat, sOilcode) {
            return new Promise((resolve, reject) => {
                const oModel = this.getOwnerComponent().getModel();
                const sPath = oModel.createKey(MONTH_OIL_ENTITY_SET, {
                    Yearat: sYearat,
                    Monat: sMonat,
                    Oilcode: sOilcode
                });

                oModel.read(sPath, {
                    success: (oData) => resolve(oData || null),
                    error: reject
                });
            });
        },

        _readMonthOilByFilter(sYearat, sMonat, sOilcode) {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel().read(MONTH_OIL_ENTITY_SET, {
                    filters: [
                        new Filter("Yearat", FilterOperator.EQ, sYearat),
                        new Filter("Monat", FilterOperator.EQ, sMonat),
                        new Filter("Oilcode", FilterOperator.EQ, sOilcode)
                    ],
                    success: (oData) => {
                        const aResults = oData.results || [];
                        resolve(aResults[0] || null);
                    },
                    error: reject
                });
            });
        },

        _extractOilPrice(oOil) {
            if (!oOil) {
                return 0;
            }
            return this._parseNumber(oOil.Price ?? oOil.price);
        },

        async _loadMonthOilPrice(sYearat, sMonat, sOilcode) {
            const aMonthVariants = this._getMonthFilterVariants(sMonat);
            let oLastError = null;

            for (let i = 0; i < aMonthVariants.length; i++) {
                const sMonatVariant = aMonthVariants[i];
                try {
                    const oByKey = await this._readMonthOilByKey(sYearat, sMonatVariant, sOilcode);
                    if (oByKey) {
                        return oByKey;
                    }
                } catch (oError) {
                    oLastError = oError;
                }

                try {
                    const oByFilter = await this._readMonthOilByFilter(sYearat, sMonatVariant, sOilcode);
                    if (oByFilter) {
                        return oByFilter;
                    }
                } catch (oError) {
                    oLastError = oError;
                }
            }

            if (oLastError) {
                oLastError._oilQuery = { yearat: sYearat, monat: sMonat, oilcode: sOilcode };
                throw oLastError;
            }

            return null;
        },

        _formatOilLoadQuery(oQuery) {
            if (!oQuery) {
                return "";
            }
            return `Yearat=${oQuery.yearat}, Monat=${oQuery.monat}, Oilcode=${oQuery.oilcode}`;
        },

        async _applyMonthOilPrice(oGrHead, oBillItem, aPoItems) {
            const oItemModel = this.getView().getModel("invoiceItem");
            const oBillRefModel = this.getView().getModel("billRef");
            const oMetricsModel = this.getView().getModel("invoiceMetrics");
            const oMatchModel = this.getView().getModel("matchView");
            const oBillItemData = oBillItem || {};
            const sMatnr = this._resolvePoItemMatnr(aPoItems, oBillItemData)
                || oItemModel.getProperty("/Matnr")
                || oBillRefModel.getProperty("/Matnr");
            const vGrDate = oGrHead?.Budat || oGrHead?.Bldat
                || oMatchModel.getProperty("/gr/budat");
            const oPrev = this._getPrevMonthYearMon(vGrDate);
            const sOilcode = formatter.formatMaterialOilcode(sMatnr);

            oMetricsModel.setProperty("/oilPriceYear", "");
            oMetricsModel.setProperty("/oilPriceMonth", "");
            oMetricsModel.setProperty("/oilcode", "");
            oMetricsModel.setProperty("/oilLoadQuery", "");
            oMetricsModel.setProperty("/oilLoadError", "");

            if (!oPrev.year || !oPrev.month) {
                const sMsg = "입고 전기일(Budat)이 없어 입고 기준 유가를 조회할 수 없습니다.";
                oMetricsModel.setProperty("/oilLoadError", sMsg);
                MessageToast.show(sMsg);
                return;
            }
            if (!sMatnr) {
                const sMsg = "PO 품목 Matnr가 없어 유가 코드를 결정할 수 없습니다.";
                oMetricsModel.setProperty("/oilLoadError", sMsg);
                MessageToast.show(sMsg);
                return;
            }
            if (!sOilcode) {
                const sMsg = `등록되지 않은 원유 자재입니다. (Matnr=${sMatnr})`;
                oMetricsModel.setProperty("/oilLoadError", sMsg);
                MessageToast.show(sMsg);
                return;
            }

            const oQuery = {
                yearat: oPrev.year,
                monat: oPrev.month,
                oilcode: sOilcode,
                matnr: sMatnr,
                grDate: vGrDate ? formatter.formatInvDate(vGrDate) : ""
            };
            oMetricsModel.setProperty("/oilLoadQuery",
                `${this._formatOilLoadQuery(oQuery)}, Matnr=${sMatnr}, GR=${oQuery.grDate || "-"}`);

            try {
                const oOil = await this._loadMonthOilPrice(oPrev.year, oPrev.month, sOilcode);
                if (!oOil) {
                    const sMsg = `${oPrev.year}년 ${oPrev.month}월 · ${sOilcode} 유가 데이터가 없습니다.`
                        + ` (Matnr=${sMatnr}, GR=${oQuery.grDate || "-"})`;
                    oMetricsModel.setProperty("/oilLoadError", sMsg);
                    MessageToast.show(sMsg);
                    return;
                }

                const fPrice = this._extractOilPrice(oOil);
                if (!fPrice) {
                    const sMsg = `${oPrev.year}년 ${oPrev.month}월 · ${sOilcode} 유가 금액(Price)이 0입니다.`
                        + ` (Matnr=${sMatnr}, GR=${oQuery.grDate || "-"})`;
                    oMetricsModel.setProperty("/oilLoadError", sMsg);
                    MessageToast.show(sMsg);
                    return;
                }

                oItemModel.setProperty("/Oilprice", fPrice);
                oItemModel.setProperty("/Matnr", sMatnr);
                oBillRefModel.setProperty("/Oilprice", fPrice);
                oBillRefModel.setProperty("/Matnr", sMatnr);
                oMetricsModel.setProperty("/oilPriceYear", oPrev.year);
                oMetricsModel.setProperty("/oilPriceMonth", oPrev.month);
                oMetricsModel.setProperty("/oilcode", sOilcode);
                oMetricsModel.setProperty("/oilLoadError", "");

                this._computeMetrics();
                this._updateCompareDiffs();
            } catch (oError) {
                const sBase = this._parseODataError(oError) || "입고 기준 유가 조회에 실패했습니다.";
                const sQuery = this._formatOilLoadQuery(oError._oilQuery || oQuery);
                const sMsg = `${sBase} [${sQuery}]`;
                oMetricsModel.setProperty("/oilLoadError", sMsg);
                MessageToast.show(sMsg);
            }
        },

        _collectVerificationInputs(oItem) {
            const oMatchModel = this.getView()?.getModel("matchView");
            const oBillRefModel = this.getView()?.getModel("billRef");
            const oItemData = oItem || {};
            return {
                grQty: this._parseNumber(oMatchModel?.getProperty("/gr/qty"))
                    || this._parseNumber(oItemData.GrMenge),
                prevMonthOilPrice: this._parseNumber(oItemData.Oilprice),
                billPremium: this._parseNumber(oBillRefModel?.getProperty("/Premium")),
                todayUkurs: this._getInvoiceExchangeRate()
            };
        },

        _applyVerificationBasePrice(oItem) {
            return VerificationBasePrice.applyToInvoiceItem(
                oItem,
                this._collectVerificationInputs(oItem)
            );
        },

        _getInvoiceFxReferenceDate() {
            if (this._isInvoiceViewMode()) {
                const sErdat = this.getView().getModel("invoiceHeader")?.getProperty("/Erdat");
                const oErdat = formatter.toLocalCalendarDate(sErdat);
                if (oErdat) {
                    return oErdat;
                }
            }
            return AppDateTime.today();
        },

        _reapplyInvoiceExchangeRate() {
            const oMatchModel = this.getView().getModel("matchView");
            const oPoHead = oMatchModel?.getProperty("/poHead") || {};
            const sWaers = oMatchModel?.getProperty("/inv/waers")
                || this.getView().getModel("invoiceHeader")?.getProperty("/Waers");

            return this._loadInvoiceExchangeRate(oPoHead, sWaers).then((oFx) => {
                this._applyInvFxInfo(oFx);
            });
        },

        _getInvoiceExchangeRate() {
            const oMatchModel = this.getView().getModel("matchView");
            return this._parseNumber(oMatchModel?.getProperty("/exchangeRate/ukurs"));
        },

        _applyInvFxInfo(oExchangeRate) {
            const oMatchModel = this.getView().getModel("matchView");
            const oInv = { ...(oMatchModel.getProperty("/inv") || {}) };
            const fAmt = this._parseNumber(oInv.amount);
            const fUkurs = this._parseNumber(oExchangeRate?.ukurs ?? oExchangeRate?.fxRate);
            const sLocalWaers = this.getView().getModel("invoiceHeader")?.getProperty("/Zwaers")
                || oMatchModel.getProperty("/gr/waersLocal")
                || "KRW";

            oMatchModel.setProperty("/inv", {
                ...oInv,
                amountLocal: fUkurs ? formatter.convertToLocalAmount(fAmt, fUkurs) : 0,
                waersLocal: sLocalWaers,
                fxRate: fUkurs,
                fxRateDate: oExchangeRate?.fxRateDate
                    || formatter.formatInvDate(this._getInvoiceFxReferenceDate())
                    || "-",
                waersFx: oInv.waers || oExchangeRate?.fcurr || "USD"
            });
        },

        async _loadInvoiceExchangeRate(oPoHead, sFallbackFxWaers, vReferenceDate) {
            const oMatchModel = this.getView().getModel("matchView");
            const sFxWaers = this._getFxTargetCurrency(oPoHead, sFallbackFxWaers);
            const sLocalWaers = oMatchModel?.getProperty("/gr/waersLocal")
                || this.getView().getModel("invoiceHeader")?.getProperty("/Zwaers")
                || "KRW";
            const oRefDate = formatter.toLocalCalendarDate(vReferenceDate)
                || this._getInvoiceFxReferenceDate();
            const oEmptyRate = {
                fcurr: sFxWaers,
                tcurr: sLocalWaers,
                ukurs: 0,
                fxRate: 0,
                fxRateDate: formatter.formatInvDate(oRefDate) || "-"
            };

            try {
                const oExchangeRate = await ExchangeRateService.loadExchangeRate(
                    this.getOwnerComponent().getModel(),
                    {
                        fcurr: sFxWaers,
                        tcurr: sLocalWaers,
                        gdatu: oRefDate
                    }
                );
                oMatchModel.setProperty("/exchangeRate", oExchangeRate);
                if (!oExchangeRate.ukurs) {
                    MessageToast.show("기준일 환율을 찾을 수 없습니다.");
                }
                return oExchangeRate;
            } catch (oError) {
                oMatchModel.setProperty("/exchangeRate", oEmptyRate);
                MessageToast.show(this._parseODataError(oError) || "기준일 환율 조회에 실패했습니다.");
                return oEmptyRate;
            }
        },


        _buildInvoiceDraft(oBill, oItem, oMetrics) {
            if (!oBill?.InvNo) {
                return;
            }
            const oItemData = oItem || {};
            const oExistingItem = this.getView().getModel("invoiceItem").getData() || {};
            const oMatchModel = this.getView().getModel("matchView");
            const fMatchGrQty = this._parseNumber(oMatchModel?.getProperty("/gr/qty"));
            const fTotalAmt = parseFloat(oBill.TotalAmt) || 0;
            const fTotalQty = parseFloat(oBill.TotalQty) || 0;
            const fItemAmt = parseFloat(oItemData.ItemAmt) || fTotalAmt;
            const fMenge = parseFloat(oItemData.Menge) || fTotalQty;
            const fPremium = parseFloat(oItemData.Premium)
                || this._parseNumber(oExistingItem.Premium) || 0;
            const fWmwst = parseFloat(oBill.Wmwst) || 0;
            const sInvDat = this._toPickerDateString(oBill.InvDat);
            const sErdat = this._toPickerDateString(AppDateTime.today());

            this.getView().getModel("invoiceHeader").setData({
                InvNo: oBill.InvNo || "",
                Gjahr: this._getYearFromDate(oBill.InvDat),
                Budat: sInvDat,
                Bldat: sInvDat,
                Bukrs: oBill.Bukrs || "1000",
                BukrsName: oBill.BukrsName || "OLEUM",
                Lifnr: oBill.Lifnr || "",
                Waers: oBill.Waers || "",
                Zwaers: "KRW",
                Zlspr: "",
                Zterm: oBill.Zterm || "",
                InvDat: sInvDat,
                Erdat: sErdat
            });

            this.getView().getModel("billRef").setData({
                InvNo: oBill.InvNo || "",
                Ebeln: oItemData.Ebeln || oBill.Ebeln || "",
                Name1: oBill.Name1 || "",
                Matnr: oItemData.Matnr || "",
                Mwskz: oBill.Mwskz || "",
                Oilprice: oItemData.Oilprice || 0,
                Premium: oItemData.Premium || 0,
                Waers: oBill.Waers || oItemData.Waers || "",
                IvZlspr: oBill.IvZlspr || "",
                IvZlsprNm: oBill.IvZlsprNm || ""
            });

            const oInvoiceItem = {
                InvNo: oBill.InvNo || "",
                InvItem: oItemData.InvItem || "00010",
                Ebeln: oItemData.Ebeln || oBill.Ebeln || "",
                Mblnr: oExistingItem.Mblnr || "",
                Mjahr: oExistingItem.Mjahr || this._getYearFromDate(oBill.InvDat),
                Matnr: oItemData.Matnr || oExistingItem.Matnr || "",
                GrMenge: fMatchGrQty || this._parseNumber(oExistingItem.GrMenge) || 0,
                IrMenge: fMenge,
                DiffQty: 0,
                Meins: oItemData.Meins || oBill.Meins || "",
                ItemAmt: fItemAmt,
                ItemAmtD: 0,
                BaseAmt: 0,
                BaseAmtD: 0,
                Hwste: 0,
                Wmwst: fWmwst,
                DiffAmt: 0,
                DiffAmtD: 0,
                Oilprice: this._parseNumber(oExistingItem.Oilprice) || 0,
                Premium: fPremium,
                Waers: oItemData.Waers || oBill.Waers || "",
                Zwaers: "KRW",
                Mwskz: oBill.Mwskz || ""
            };
            const oVerifiedItem = this._applyVerificationBasePrice(oInvoiceItem);
            this.getView().getModel("invoiceItem").setData(oVerifiedItem);

            this.getView().getModel("invoiceMetrics").setData({
                calcAmount: oVerifiedItem.BaseAmt,
                amountDiff: oVerifiedItem.DiffAmt,
                qtyDiff: oVerifiedItem.DiffQty,
                billOilPrice: parseFloat(oItemData.Oilprice) || 0,
                amountVerifyOk: oMetrics?.amountVerifyOk ?? (Math.abs(oVerifiedItem.DiffAmt) < 0.01),
                qtyVerifyOk: oMetrics?.qtyVerifyOk ?? (Math.abs(oVerifiedItem.DiffQty) < 0.001)
            });

            this._refreshInvoiceProcessFlow();
        },

        _isMatchingInvoice(oInvoice, sInvNo) {
            if (!oInvoice) {
                return false;
            }
            return String(oInvoice.InvNo || "").trim().toUpperCase()
                === String(sInvNo || "").trim().toUpperCase();
        },

        _readRegisteredInvoiceHeader(sInvNo) {
            const oModel = this.getOwnerComponent().getModel();
            const sKey = (sInvNo || "").trim();
            if (!sKey) {
                return Promise.resolve(null);
            }

            return new Promise((resolve) => {
                oModel.read(oModel.createKey("/invoiceSet", { InvNo: sKey }), {
                    success: (oInvoice) => {
                        resolve(this._isMatchingInvoice(oInvoice, sKey) ? oInvoice : null);
                    },
                    error: () => resolve(null)
                });
            });
        },

        _loadInvoiceFromServerAsync(sInvNo) {
            return this._readRegisteredInvoiceHeader(sInvNo).then((oInvoice) => {
                const oHeaderModel = this.getView().getModel("invoiceHeader");
                const bExists = !!oInvoice;

                this._updateInvoiceViewState(bExists);
                if (!bExists) {
                    oHeaderModel.setProperty("/Zlspr", "");
                    this._refreshInvoiceProcessFlow();
                    return;
                }

                const sZlspr = String(oInvoice.Zlspr || "").trim().toUpperCase();
                oHeaderModel.setProperty("/Zlspr", sZlspr);
                oHeaderModel.setProperty("/Budat", this._toPickerDateString(oInvoice.Budat));
                oHeaderModel.setProperty("/Bldat", this._toPickerDateString(oInvoice.Bldat));
                oHeaderModel.setProperty("/InvDat", this._toPickerDateString(oInvoice.InvDat));
                oHeaderModel.setProperty("/Erdat", this._toPickerDateString(oInvoice.Erdat));
                if (oInvoice.Zterm) {
                    oHeaderModel.setProperty("/Zterm", oInvoice.Zterm);
                }
                this._refreshInvoiceProcessFlow();
            });
        },

        _syncInvoiceFromMatch() {
            const oMatchModel = this.getView().getModel("matchView");
            const oItemModel = this.getView().getModel("invoiceItem");
            const oMetricsModel = this.getView().getModel("invoiceMetrics");
            const oItem = { ...(oItemModel.getData() || {}) };

            const fGrQty = this._parseNumber(oMatchModel.getProperty("/gr/qty"));
            const sMblnr = oMatchModel.getProperty("/gr/docNo");
            const sMjahr = this._getYearFromDate(oMatchModel.getProperty("/gr/budat")
                || oMatchModel.getProperty("/gr/docDate"));

            if (fGrQty) {
                oItem.GrMenge = fGrQty;
            }
            if (sMblnr && sMblnr !== "-") {
                oItem.Mblnr = sMblnr;
            }
            if (sMjahr) {
                oItem.Mjahr = sMjahr;
            }

            const oVerifiedItem = this._applyVerificationBasePrice(oItem);
            oItemModel.setData(oVerifiedItem);
            this._updateSapItemReference(oVerifiedItem);

            const oEval = this._evaluateMatchRules();
            oMetricsModel.setData({
                ...oMetricsModel.getData(),
                calcAmount: oVerifiedItem.BaseAmt,
                amountDiff: oVerifiedItem.DiffAmt,
                qtyDiff: oVerifiedItem.DiffQty,
                amountVerifyOk: oEval.bUnitPriceOk && !oEval.bHasBadData,
                qtyVerifyOk: oEval.bUnitPriceOk && !oEval.bHasBadData,
                unitPriceOk: oEval.bUnitPriceOk,
                hasBadData: oEval.bHasBadData
            });
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

        _getGrLineQty(oItem) {
            const fQty = this._parseNumber(oItem.Menge);
            return oItem.Shkzg === "H" ? -fQty : fQty;
        },

        _getGrLineLocalAmount(oItem) {
            return this._parseNumber(oItem.Wrbtr);
        },

        _accumulateGrLineAmount(oItem, sFxWaers, sLocalWaers, oTotals) {
            const fAmount = this._parseNumber(oItem.Wrbtr);
            if (!fAmount) {
                return;
            }

            const sItemWaers = (oItem.Waers || "").trim().toUpperCase();
            const sFx = (sFxWaers || "USD").trim().toUpperCase();
            const sLocal = (sLocalWaers || "KRW").trim().toUpperCase();

            if (sItemWaers === sFx) {
                oTotals.fx += fAmount;
            } else if (!sItemWaers || sItemWaers === sLocal) {
                oTotals.local += fAmount;
            } else {
                oTotals.fx += fAmount;
            }
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

        _buildGrFxInfo(aItems, oPoHead, sLocalWaers, sFallbackFxWaers) {
            const fUkurs = this._parseNumber(oPoHead?.Ukurs);
            const sFxWaers = this._getFxTargetCurrency(oPoHead, sFallbackFxWaers);
            const sFxDate = formatter.formatInvDate(oPoHead?.Bedat) || "-";
            const oTotals = { fx: 0, local: 0 };

            aItems.forEach((oItem) => {
                this._accumulateGrLineAmount(oItem, sFxWaers, sLocalWaers, oTotals);
            });

            let fTotalFx = oTotals.fx;
            let fTotalLocal = oTotals.local;

            if (!fTotalFx && fTotalLocal && fUkurs) {
                fTotalFx = this._convertGrByFx(fTotalLocal, fUkurs);
            }
            if (!fTotalLocal && fTotalFx && fUkurs) {
                fTotalLocal = formatter.convertToLocalAmount(fTotalFx, fUkurs);
            }

            return {
                amount: fTotalFx || fTotalLocal,
                amountLocal: fTotalLocal,
                waersLocal: sLocalWaers,
                amountFx: fTotalFx,
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
                    budat: oHead.Budat || oHead.Bldat || null,
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
                budat: oHead.Budat || oHead.Bldat || null,
                amount: oFx.amountFx || oFx.amount || 0,
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

            const sGrUsdAmt = oFx.amountFx
                ? formatter.formatAmount(oFx.amountFx, oFx.waersFx)
                : this.formatGrFxAmount(oFx.amountLocal, oFx.fxRate, oFx.waersFx);
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

        _calcUnitPrice(fAmount, fQty) {
            const fAmt = this._parseNumber(fAmount);
            const fQtyVal = this._parseNumber(fQty);
            return fQtyVal > 0 ? fAmt / fQtyVal : 0;
        },

        _isAmountClose(fLeft, fRight, fTolerance) {
            const fTol = fTolerance ?? 0.01;
            return Math.abs(this._parseNumber(fLeft) - this._parseNumber(fRight)) < fTol;
        },

        _isQtyDifferent(fLeft, fRight, fTolerance) {
            const fTol = fTolerance ?? 0.001;
            return Math.abs(this._parseNumber(fLeft) - this._parseNumber(fRight)) >= fTol;
        },

        _isUnitPriceClose(fLeft, fRight) {
            const fA = this._parseNumber(fLeft);
            const fB = this._parseNumber(fRight);
            if (!fA || !fB) {
                return false;
            }
            const fDiff = Math.abs(fA - fB);
            const fBase = Math.max(Math.abs(fA), Math.abs(fB));
            return fDiff < 0.01 || (fBase > 0 && fDiff / fBase < 0.001);
        },

        _isAmtQtyInconsistent(fAmtA, fQtyA, fAmtB, fQtyB) {
            const fQtyValA = this._parseNumber(fQtyA);
            const fQtyValB = this._parseNumber(fQtyB);
            return fQtyValA > 0 && fQtyValB > 0
                && this._isAmountClose(fAmtA, fAmtB)
                && this._isQtyDifferent(fQtyA, fQtyB);
        },

        _evaluateMatchRules() {
            const oMatchModel = this.getView().getModel("matchView");
            const fPoAmt = this._parseNumber(oMatchModel.getProperty("/po/amount"));
            const fGrAmt = this._parseNumber(oMatchModel.getProperty("/gr/amountFx"))
                || this._parseNumber(oMatchModel.getProperty("/gr/amount"))
                || formatter.convertByExchangeRate(
                    oMatchModel.getProperty("/gr/amountLocal"),
                    oMatchModel.getProperty("/gr/fxRate")
                );
            const fInvAmt = this._parseNumber(oMatchModel.getProperty("/inv/amount"));
            const fPoQty = this._parseNumber(oMatchModel.getProperty("/po/qty"));
            const fGrQty = this._parseNumber(oMatchModel.getProperty("/gr/qty"));
            const fInvQty = this._parseNumber(oMatchModel.getProperty("/inv/qty"));

            const fPoUnit = this._calcUnitPrice(fPoAmt, fPoQty);
            const fGrUnit = this._calcUnitPrice(fGrAmt, fGrQty);
            const fInvUnit = this._calcUnitPrice(fInvAmt, fInvQty);

            const bUnitPoGr = this._isUnitPriceClose(fPoUnit, fGrUnit);
            const bUnitGrInv = this._isUnitPriceClose(fGrUnit, fInvUnit);
            const bUnitPoInv = this._isUnitPriceClose(fPoUnit, fInvUnit);
            const bUnitPriceOk = fPoUnit > 0 && fGrUnit > 0 && fInvUnit > 0
                && bUnitPoGr && bUnitGrInv && bUnitPoInv;

            const bBadPoGr = this._isAmtQtyInconsistent(fPoAmt, fPoQty, fGrAmt, fGrQty);
            const bBadGrInv = this._isAmtQtyInconsistent(fGrAmt, fGrQty, fInvAmt, fInvQty);
            const bBadPoInv = this._isAmtQtyInconsistent(fPoAmt, fPoQty, fInvAmt, fInvQty);
            const bHasBadData = bBadPoGr || bBadGrInv || bBadPoInv;

            const fQtyDiffPoGr = fPoQty - fGrQty;
            const fQtyDiffInvGr = fInvQty - fGrQty;
            const fQtyDiffInvPo = fInvQty - fPoQty;
            const fAmtDiffPoGr = fPoAmt - fGrAmt;
            const fAmtDiffInvGr = fInvAmt - fGrAmt;
            const fAmtDiffInvPo = fInvAmt - fPoAmt;

            const bFlowOk = bUnitPriceOk && !bHasBadData;

            return {
                fPoAmt,
                fGrAmt,
                fInvAmt,
                fPoQty,
                fGrQty,
                fInvQty,
                fPoUnit,
                fGrUnit,
                fInvUnit,
                bUnitPoGr,
                bUnitGrInv,
                bUnitPoInv,
                bUnitPriceOk,
                bBadPoGr,
                bBadGrInv,
                bBadPoInv,
                bHasBadData,
                bFlowOk,
                fQtyDiffPoGr,
                fQtyDiffInvGr,
                fQtyDiffInvPo,
                fAmtDiffPoGr,
                fAmtDiffInvGr,
                fAmtDiffInvPo,
                sPoWaers: oMatchModel.getProperty("/po/waers") || "",
                sGrWaers: oMatchModel.getProperty("/gr/waersFx")
                    || oMatchModel.getProperty("/gr/waers") || "",
                sInvWaers: oMatchModel.getProperty("/inv/waers") || "",
                sPoMeins: oMatchModel.getProperty("/po/meins") || "",
                sGrMeins: oMatchModel.getProperty("/gr/meins") || "",
                sInvMeins: oMatchModel.getProperty("/inv/meins") || ""
            };
        },

        _resolveCompareResult(bMatch) {
            return {
                text: bMatch ? "일치" : "불일치",
                state: bMatch ? "Success" : "Error"
            };
        },

        _resolveOilFinalMergeLabel(sCategory, bMatch) {
            return {
                text: `${sCategory} ${bMatch ? "일치" : "불일치"}`,
                state: bMatch ? "Success" : "Error"
            };
        },

        _buildMatchIssueSummary(oEval, bOilFinalOk, bHasOilPrice) {
            const aIssues = [];

            if (bHasOilPrice && !bOilFinalOk) {
                aIssues.push(this._getI18nText("issueOilFinalMismatch"));
            }

            if (oEval.bBadPoGr) {
                aIssues.push("PO·GR: 수량 상이·금액 동일");
            }
            if (oEval.bBadGrInv) {
                aIssues.push("GR·IV: 수량 상이·금액 동일");
            }
            if (oEval.bBadPoInv) {
                aIssues.push("PO·IV: 수량 상이·금액 동일");
            }

            if (!oEval.bBadPoGr && !this._isAmountClose(oEval.fPoAmt, oEval.fGrAmt)) {
                aIssues.push("PO·GR: 금액 불일치");
            }
            if (!oEval.bBadGrInv && !this._isAmountClose(oEval.fGrAmt, oEval.fInvAmt)) {
                aIssues.push("GR·IV: 금액 불일치");
            }
            if (!oEval.bBadPoInv && !this._isAmountClose(oEval.fPoAmt, oEval.fInvAmt)) {
                aIssues.push("PO·IV: 금액 불일치");
            }

            if (!oEval.bBadPoGr && !oEval.bUnitPoGr && oEval.fPoUnit > 0 && oEval.fGrUnit > 0) {
                aIssues.push("PO·GR: 단가 불일치");
            }
            if (!oEval.bBadGrInv && !oEval.bUnitGrInv && oEval.fGrUnit > 0 && oEval.fInvUnit > 0) {
                aIssues.push("GR·IV: 단가 불일치");
            }
            if (!oEval.bBadPoInv && !oEval.bUnitPoInv && oEval.fPoUnit > 0 && oEval.fInvUnit > 0) {
                aIssues.push("PO·IV: 단가 불일치");
            }

            return aIssues.length ? aIssues.join(" · ") : "일치";
        },

        _buildFlowIssueFlags(oEval, bOilFinalOk, bHasOilPrice) {
            const bPoGrAmt = oEval.bBadPoGr
                || (!oEval.bBadPoGr && !this._isAmountClose(oEval.fPoAmt, oEval.fGrAmt));
            const bPoGrQty = oEval.bBadPoGr
                || this._isQtyDifferent(oEval.fPoQty, oEval.fGrQty);
            const bPoGrUnit = !oEval.bBadPoGr && !oEval.bUnitPoGr
                && oEval.fPoUnit > 0 && oEval.fGrUnit > 0;
            const bPoGr = bPoGrAmt || bPoGrQty || bPoGrUnit;

            const bGrIvAmt = oEval.bBadGrInv
                || (!oEval.bBadGrInv && !this._isAmountClose(oEval.fGrAmt, oEval.fInvAmt));
            const bGrIvQty = oEval.bBadGrInv
                || this._isQtyDifferent(oEval.fGrQty, oEval.fInvQty);
            const bGrIvUnit = !oEval.bBadGrInv && !oEval.bUnitGrInv
                && oEval.fGrUnit > 0 && oEval.fInvUnit > 0;
            const bGrIv = bGrIvAmt || bGrIvQty || bGrIvUnit;

            const bPoIvAmt = oEval.bBadPoInv
                || (!oEval.bBadPoInv && !this._isAmountClose(oEval.fPoAmt, oEval.fInvAmt));
            const bPoIvQty = oEval.bBadPoInv
                || this._isQtyDifferent(oEval.fPoQty, oEval.fInvQty);
            const bPoIvUnit = !oEval.bBadPoInv && !oEval.bUnitPoInv
                && oEval.fPoUnit > 0 && oEval.fInvUnit > 0;
            const bPoIv = bPoIvAmt || bPoIvQty || bPoIvUnit;

            const bOverallOk = oEval.bFlowOk && (!bHasOilPrice || bOilFinalOk);

            return {
                po: {
                    card: bPoGr || bPoIv,
                    amount: bPoGrAmt || bPoIvAmt,
                    qty: bPoGrQty || bPoIvQty
                },
                gr: {
                    card: bPoGr || bGrIv,
                    amount: bPoGrAmt || bGrIvAmt,
                    qty: bPoGrQty || bGrIvQty
                },
                inv: {
                    card: bGrIv || bPoIv,
                    amount: bGrIvAmt || bPoIvAmt,
                    qty: bGrIvQty || bPoIvQty
                },
                poGrLink: bPoGr,
                grInvLink: bGrIv,
                oilFinal: bHasOilPrice && !bOilFinalOk,
                overall: !bOverallOk
            };
        },

        _updateOilFinalCompare() {
            const oMatchModel = this.getView().getModel("matchView");
            const oMetrics = this.getView().getModel("invoiceMetrics").getData() || {};
            const oItem = this.getView().getModel("invoiceItem").getData() || {};
            const oVerification = this._collectVerificationInputs(oItem);
            const fGrQty = oVerification.grQty;
            const fOilPrice = oVerification.prevMonthOilPrice;
            const fPremium = oVerification.billPremium;
            const fInvQty = this._parseNumber(oMatchModel.getProperty("/inv/qty"));
            const fBillOilPrice = this._parseNumber(oMetrics.billOilPrice);
            const fInvAmt = this._parseNumber(oMatchModel.getProperty("/inv/amount"));
            const sWaers = oMatchModel.getProperty("/inv/waers")
                || this.getView().getModel("invoiceItem").getProperty("/Waers") || "USD";
            const sMeins = oMatchModel.getProperty("/gr/meins")
                || oMatchModel.getProperty("/inv/meins") || "";
            const sYear = oMetrics.oilPriceYear || "";
            const sMonth = oMetrics.oilPriceMonth || "";
            const sOilcode = oMetrics.oilcode || "";
            const fCalcUsd = VerificationBasePrice.calcUsd(oVerification);
            const fDiffUsd = fInvAmt - fCalcUsd;
            const bHasOilPrice = fOilPrice > 0 && fGrQty > 0;
            const bQtyOk = !this._isQtyDifferent(fGrQty, fInvQty);
            const bOilPriceOk = !fBillOilPrice || this._isAmountClose(fOilPrice, fBillOilPrice);
            const bAmtOk = this._isAmountClose(fCalcUsd, fInvAmt);
            const bOilFinalOk = bHasOilPrice && bQtyOk && bAmtOk;
            const oQtyMerge = this._resolveOilFinalMergeLabel("수량", bQtyOk);
            const oOilMerge = this._resolveOilFinalMergeLabel(
                "기준 유가",
                bHasOilPrice && (bOilPriceOk || !fBillOilPrice)
            );
            const oAmtMerge = this._resolveOilFinalMergeLabel("금액", bHasOilPrice && bAmtOk);
            const sOilCalcLabel = fOilPrice ? formatter.formatAmount(fOilPrice, sWaers) : "-";
            const sPremiumLabel = fPremium ? formatter.formatAmount(fPremium, sWaers) : "-";
            const sAmountExtra = fPremium
                ? `Premium ${sPremiumLabel}`
                : "";

            const sDiffValue = bHasOilPrice ? formatter.formatAmount(fDiffUsd, sWaers) : "-";
            const oDiffResult = this._resolveOilFinalDiffResult(fDiffUsd, bHasOilPrice);

            oMatchModel.setProperty("/oilFinalFlow/qty/sourceLeft/value",
                formatter.formatQty(fGrQty, formatter.formatUnit(sMeins)));
            oMatchModel.setProperty("/oilFinalFlow/qty/sourceRight/value",
                formatter.formatQty(fInvQty, formatter.formatUnit(sMeins)));
            oMatchModel.setProperty("/oilFinalFlow/qty/merge/title", oQtyMerge.text);
            oMatchModel.setProperty("/oilFinalFlow/qty/merge/result", "");
            oMatchModel.setProperty("/oilFinalFlow/qty/merge/state", oQtyMerge.state);
            oMatchModel.setProperty("/oilFinalFlow/qty/merge/stateClass",
                this._oilFinalStateClass(oQtyMerge.state));

            oMatchModel.setProperty("/oilFinalFlow/oilPrice/sourceLeft/value", sOilCalcLabel);
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/sourceLeft/sub",
                this._formatOilPricePeriod(sYear, sMonth));
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/sourceLeft/oilcode", sOilcode || "");
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/sourceRight/value",
                fBillOilPrice ? formatter.formatAmount(fBillOilPrice, sWaers) : "-");
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/merge/title",
                bHasOilPrice ? oOilMerge.text : "-");
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/merge/result", "");
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/merge/state",
                bHasOilPrice ? oOilMerge.state : "None");
            oMatchModel.setProperty("/oilFinalFlow/oilPrice/merge/stateClass",
                this._oilFinalStateClass(bHasOilPrice ? oOilMerge.state : "None"));

            oMatchModel.setProperty("/oilFinalFlow/amount/sourceLeft/value",
                formatter.formatAmount(fCalcUsd, sWaers));
            oMatchModel.setProperty("/oilFinalFlow/amount/sourceLeft/sub",
                VerificationBasePrice.formatFormulaLabel(sYear, sMonth));
            oMatchModel.setProperty("/oilFinalFlow/amount/sourceLeft/extra", sAmountExtra);
            oMatchModel.setProperty("/oilFinalFlow/amount/sourceRight/value",
                formatter.formatAmount(fInvAmt, sWaers));
            oMatchModel.setProperty("/oilFinalFlow/amount/merge/title",
                bHasOilPrice ? oAmtMerge.text : "-");
            oMatchModel.setProperty("/oilFinalFlow/amount/merge/result", "");
            oMatchModel.setProperty("/oilFinalFlow/amount/merge/state",
                bHasOilPrice ? oAmtMerge.state : "None");
            oMatchModel.setProperty("/oilFinalFlow/amount/merge/stateClass",
                this._oilFinalStateClass(bHasOilPrice ? oAmtMerge.state : "None"));

            oMatchModel.setProperty("/oilFinalFlow/diff/merge/value", sDiffValue);
            oMatchModel.setProperty("/oilFinalFlow/diff/merge/result",
                bHasOilPrice ? oAmtMerge.text : "-");
            oMatchModel.setProperty("/oilFinalFlow/diff/merge/state",
                bHasOilPrice ? oDiffResult.state : "None");
            oMatchModel.setProperty("/oilFinalFlow/diff/merge/stateClass",
                this._oilFinalStateClass(bHasOilPrice ? oDiffResult.state : "None"));

            this._refreshOilFinalCompareGraph();

            oMatchModel.setProperty("/summary/oilFinalOk", bOilFinalOk);
            oMatchModel.setProperty("/summary/oilCalcAmount", fCalcUsd);

            return { bOilFinalOk, bHasOilPrice };
        },

        _applyMatchToInvoiceMetrics(oEval) {
            const oMetricsModel = this.getView().getModel("invoiceMetrics");
            const oMetrics = oMetricsModel.getData() || {};

            oMetricsModel.setData({
                ...oMetrics,
                amountVerifyOk: oEval.bUnitPriceOk && !oEval.bHasBadData,
                qtyVerifyOk: oEval.bUnitPriceOk && !oEval.bHasBadData,
                unitPriceOk: oEval.bUnitPriceOk,
                hasBadData: oEval.bHasBadData
            });
        },

        _updateCompareDiffs() {
            const oMatchModel = this.getView().getModel("matchView");
            const oEval = this._evaluateMatchRules();
            const oOilFinal = this._updateOilFinalCompare();
            const sIssueSummary = this._buildMatchIssueSummary(
                oEval, oOilFinal.bOilFinalOk, oOilFinal.bHasOilPrice);
            const bOverallOk = oEval.bFlowOk && (!oOilFinal.bHasOilPrice || oOilFinal.bOilFinalOk);
            const bAmtGrInvMatch = this._isAmountClose(oEval.fGrAmt, oEval.fInvAmt);
            const bQtyGrInvMatch = !this._isQtyDifferent(oEval.fGrQty, oEval.fInvQty);
            const bUnitOk = oEval.bUnitPriceOk && !oEval.bHasBadData;
            const oAmtResult = this._resolveCompareResult(bAmtGrInvMatch);
            const oQtyResult = this._resolveCompareResult(bQtyGrInvMatch);
            const oUnitResult = this._resolveCompareResult(bUnitOk);

            const sReviewNeeded = this._getI18nText("statusReviewNeeded");
            const sDisplayStatus = bOverallOk ? "일치" : sReviewNeeded;

            oMatchModel.setProperty("/summary/diffAmount", oEval.fAmtDiffInvGr);
            oMatchModel.setProperty("/summary/diffQty", oEval.fQtyDiffInvGr);
            oMatchModel.setProperty("/summary/flowSuccess", bOverallOk);
            oMatchModel.setProperty("/summary/unitPriceOk", oEval.bUnitPriceOk);
            oMatchModel.setProperty("/summary/hasBadData", oEval.bHasBadData);
            oMatchModel.setProperty("/summary/issueDetail", sIssueSummary);
            oMatchModel.setProperty("/summary/overallStatus", sDisplayStatus);
            oMatchModel.setProperty("/summary/overallState", bOverallOk ? "Success" : "Error");
            oMatchModel.setProperty("/summary/matchResult", sDisplayStatus);
            oMatchModel.setProperty("/summary/matchResultState", bOverallOk ? "Success" : "Error");
            oMatchModel.setProperty("/flowIssue", this._buildFlowIssueFlags(
                oEval, oOilFinal.bOilFinalOk, oOilFinal.bHasOilPrice));

            this._updateCompareCell("amountRows", "total", "result", oAmtResult.text);
            oMatchModel.setProperty(
                "/amountRows/" + this._findRowIndex("amountRows", "total") + "/resultState",
                oAmtResult.state
            );

            this._updateCompareCell("amountRows", "diff", "po", "-");
            this._updateCompareCell("amountRows", "diff", "gr", "-");
            this._updateCompareCell("amountRows", "diff", "inv", "-");
            this._updateCompareCell("amountRows", "diff", "result", formatter.formatAmount(oEval.fAmtDiffInvGr, oEval.sInvWaers));
            oMatchModel.setProperty(
                "/amountRows/" + this._findRowIndex("amountRows", "diff") + "/resultState",
                "None"
            );

            this._updateCompareCell("qtyRows", "total", "result", oQtyResult.text);
            oMatchModel.setProperty(
                "/qtyRows/" + this._findRowIndex("qtyRows", "total") + "/resultState",
                oQtyResult.state
            );

            this._updateCompareCell("qtyRows", "diff", "po", "-");
            this._updateCompareCell("qtyRows", "diff", "gr", "-");
            this._updateCompareCell("qtyRows", "diff", "inv", "-");
            this._updateCompareCell("qtyRows", "diff", "result",
                formatter.formatQty(oEval.fQtyDiffInvGr, formatter.formatUnit(oEval.sInvMeins)));
            oMatchModel.setProperty(
                "/qtyRows/" + this._findRowIndex("qtyRows", "diff") + "/resultState",
                "None"
            );

            this._updateCompareCell("amountRows", "unit", "po",
                formatter.formatUnitPrice(oEval.fPoAmt, oEval.fPoQty, oEval.sPoWaers));
            this._updateCompareCell("amountRows", "unit", "gr",
                formatter.formatUnitPrice(oEval.fGrAmt, oEval.fGrQty, oEval.sGrWaers));
            this._updateCompareCell("amountRows", "unit", "inv",
                formatter.formatUnitPrice(oEval.fInvAmt, oEval.fInvQty, oEval.sInvWaers));
            this._updateCompareCell("amountRows", "unit", "result", oUnitResult.text);
            oMatchModel.setProperty(
                "/amountRows/" + this._findRowIndex("amountRows", "unit") + "/resultState",
                oUnitResult.state
            );

            const fUnitDiffInvGr = oEval.fInvUnit - oEval.fGrUnit;

            this._updateCompareCell("amountRows", "unitDiff", "po", "-");
            this._updateCompareCell("amountRows", "unitDiff", "gr", "-");
            this._updateCompareCell("amountRows", "unitDiff", "inv", "-");
            this._updateCompareCell("amountRows", "unitDiff", "result",
                formatter.formatAmount(fUnitDiffInvGr, oEval.sInvWaers));
            oMatchModel.setProperty(
                "/amountRows/" + this._findRowIndex("amountRows", "unitDiff") + "/resultState",
                "None"
            );

            this._applyMatchToInvoiceMetrics(oEval);
            this._refreshInvoiceProcessFlow();
        },

        _findRowIndex(sRowsPath, sRowKey) {
            const aRows = this.getView().getModel("matchView").getProperty(`/${sRowsPath}`) || [];
            return Math.max(aRows.findIndex((oRow) => oRow.rowKey === sRowKey), 0);
        },

        _parseNumber(vValue) {
            const nValue = parseFloat(vValue);
            return isNaN(nValue) ? 0 : nValue;
        },

        _parseODataError(oError) {
            try {
                const oResponse = JSON.parse(oError.responseText);
                return oResponse.error?.message?.value || "송장 등록에 실패했습니다.";
            } catch (e) {
                return oError.message || "송장 등록에 실패했습니다.";
            }
        },

        _resolveCreateZlspr(oHeader) {
            const oHeaderModel = this.getView().getModel("invoiceHeader");
            const oCurrentHeader = {
                ...(oHeader || {}),
                ...(oHeaderModel?.getData() || {})
            };
            const sSelected = (oCurrentHeader.Zlspr || "").trim().toUpperCase();
            if (sSelected === "R") {
                return "R";
            }
            if (sSelected === "A") {
                return "A";
            }

            const bMatched = !!this.getView().getModel("matchView").getProperty("/summary/flowSuccess");
            const oMetrics = this.getView().getModel("invoiceMetrics").getData() || {};
            if (bMatched && oMetrics.unitPriceOk && !oMetrics.hasBadData) {
                return "A";
            }

            return sSelected;
        },

        _buildInvoiceCreatePayload() {
            this._syncInvoiceFromMatch();
            this._computeMetrics();

            const oHeaderModel = this.getView().getModel("invoiceHeader");
            const oHeader = { ...(oHeaderModel.getData() || {}) };
            const sZlspr = this._resolveCreateZlspr(oHeader);
            if (sZlspr && sZlspr !== oHeader.Zlspr) {
                oHeaderModel.setProperty("/Zlspr", sZlspr);
                oHeader.Zlspr = sZlspr;
            }

            const oBudat = this._toODataDate(oHeader.Budat);
            const oBldat = this._toODataDate(oHeader.Bldat);
            const oInvDat = this._toODataDate(oHeader.InvDat || oHeader.Budat);
            const oErdat = this._toODataDate(oHeader.Erdat || AppDateTime.today());

            return {
                InvNo: oHeader.InvNo,
                Gjahr: oHeader.Gjahr || this._getYearFromDate(oHeader.Budat),
                Budat: oBudat,
                Bldat: oBldat,
                Bukrs: oHeader.Bukrs || "1000",
                Lifnr: oHeader.Lifnr || "",
                Waers: oHeader.Waers || "",
                Zwaers: oHeader.Zwaers || "KRW",
                Zlspr: sZlspr,
                Zterm: oHeader.Zterm || "",
                InvDat: oInvDat,
                Erdat: oErdat
            };
        },

        _buildInvoiceItemSapPayload(oItem) {
            return {
                InvNo: oItem.InvNo || "",
                InvItem: oItem.InvItem || "00010",
                Ebeln: oItem.Ebeln || "",
                Mblnr: oItem.Mblnr || "",
                Mjahr: oItem.Mjahr || "",
                Matnr: oItem.Matnr || "",
                GrMenge: this._parseNumber(oItem.GrMenge),
                IrMenge: this._parseNumber(oItem.IrMenge),
                DiffQty: this._parseNumber(oItem.DiffQty),
                Meins: oItem.Meins || "",
                ItemAmt: this._parseNumber(oItem.ItemAmt),
                ItemAmtD: formatter.toSapLocalAmount(oItem.ItemAmtD),
                BaseAmt: this._parseNumber(oItem.BaseAmt),
                BaseAmtD: formatter.toSapLocalAmount(oItem.BaseAmtD),
                Hwste: formatter.toSapLocalAmount(oItem.Hwste),
                Wmwst: this._parseNumber(oItem.Wmwst),
                DiffAmt: this._parseNumber(oItem.DiffAmt),
                DiffAmtD: formatter.toSapLocalAmount(oItem.DiffAmtD),
                Oilprice: this._parseNumber(oItem.Oilprice),
                Premium: this._parseNumber(oItem.Premium),
                Waers: oItem.Waers || "",
                Zwaers: oItem.Zwaers || "KRW",
                Mwskz: oItem.Mwskz || ""
            };
        },

        _updateSapItemReference(oItem) {
            this.getView().getModel("invoiceMetrics").setProperty(
                "/sapItemReference",
                this._buildInvoiceItemSapPayload(oItem)
            );
        },

        _computeMetrics() {
            const oItem = { ...(this.getView().getModel("invoiceItem").getData() || {}) };
            const oVerifiedItem = this._applyVerificationBasePrice(oItem);
            this.getView().getModel("invoiceItem").setData(oVerifiedItem);
            this._updateSapItemReference(oVerifiedItem);

            const oMetrics = this.getView().getModel("invoiceMetrics").getData() || {};
            this.getView().getModel("invoiceMetrics").setData({
                ...oMetrics,
                calcAmount: oVerifiedItem.BaseAmt,
                amountDiff: oVerifiedItem.DiffAmt,
                qtyDiff: oVerifiedItem.DiffQty,
                amountVerifyOk: Math.abs(oVerifiedItem.DiffAmt) < 0.01,
                qtyVerifyOk: Math.abs(oVerifiedItem.DiffQty) < 0.001
            });
        },

        onNavBack() {
            if (this._sInvNo) {
                this.getOwnerComponent().getRouter().navTo("RouteBillDetail", {
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

        onSaveDraft() {
            MessageToast.show("임시저장되었습니다.");
        },

        _showInvoiceRegisterSuccessDialog(sInvNo, fnOnClose) {
            const sMessage = this.getOwnerComponent().getModel("i18n")
                .getResourceBundle()
                .getText("invoiceRegisterSuccessMessage", [sInvNo]);

            this._fnInvoiceRegisterSuccessClose = fnOnClose;

            if (!this._oInvoiceRegisterSuccessDialog) {
                this._oInvoiceRegisterSuccessDialog = new Dialog({
                    type: DialogType.Message,
                    title: this._getI18nText("invoiceRegisterSuccessTitle"),
                    state: ValueState.Success,
                    content: new Text({ text: sMessage }),
                    beginButton: new Button({
                        type: ButtonType.Emphasized,
                        text: this._getI18nText("btnOk"),
                        press: () => {
                            this._oInvoiceRegisterSuccessDialog.close();
                            if (typeof this._fnInvoiceRegisterSuccessClose === "function") {
                                this._fnInvoiceRegisterSuccessClose();
                            }
                        }
                    })
                });
                this.getView().addDependent(this._oInvoiceRegisterSuccessDialog);
            } else {
                this._oInvoiceRegisterSuccessDialog.getContent()[0].setText(sMessage);
            }

            this._oInvoiceRegisterSuccessDialog.open();
        },

        onRegisterInvoice() {
            if (this.getView().getModel("viewState").getProperty("/registered")) {
                MessageToast.show(this._getI18nText("invoiceViewModeHint"));
                return;
            }

            const oHeader = this.getView().getModel("invoiceHeader").getData() || {};
            const oMetrics = this.getView().getModel("invoiceMetrics").getData() || {};

            if (!oHeader.InvNo) {
                MessageToast.show("송장번호가 없습니다.");
                return;
            }
            if (!oHeader.Budat || !oHeader.Bldat) {
                MessageToast.show("전기일과 증빙일을 입력하세요.");
                return;
            }
            if (!oHeader.Erdat) {
                MessageToast.show("생성일자를 입력하세요.");
                return;
            }

            const fnCreate = () => {
                this.getView().setBusy(true);
                const oPayload = this._buildInvoiceCreatePayload();
                this.getOwnerComponent().getModel().create("/invoiceSet", oPayload, {
                    success: () => {
                        this.getView().setBusy(false);
                        this._showInvoiceRegisterSuccessDialog(oHeader.InvNo, () => {
                            this.getOwnerComponent().getRouter().navTo("RouteMain");
                        });
                    },
                    error: (oError) => {
                        this.getView().setBusy(false);
                        MessageBox.error(this._parseODataError(oError));
                    }
                });
            };

            const sIssue = this.getView().getModel("matchView").getProperty("/summary/issueDetail")
                || this._getI18nText("statusReviewNeeded");

            if (oMetrics.hasBadData || !oMetrics.unitPriceOk) {
                MessageBox.confirm(`${sIssue}. 그래도 송장을 등록하시겠습니까?`, {
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            fnCreate();
                        }
                    }
                });
                return;
            }

            fnCreate();
        },

        onDeleteInvoice() {
            if (!this.getView().getModel("viewState").getProperty("/registered")) {
                return;
            }

            const oHeader = this.getView().getModel("invoiceHeader").getData() || {};
            const sInvNo = (oHeader.InvNo || this._sInvNo || "").trim();
            if (!sInvNo) {
                MessageToast.show(this._getI18nText("msgDeleteInvoiceFailed"));
                return;
            }

            MessageBox.confirm(
                this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("confirmDeleteInvoice", [sInvNo]),
                {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }

                    this.getView().setBusy(true);
                    const oModel = this.getOwnerComponent().getModel();
                    oModel.remove(oModel.createKey("/invoiceSet", { InvNo: sInvNo }), {
                        success: () => {
                            this.getView().setBusy(false);
                            MessageToast.show(this._getI18nText("msgDeleteInvoiceSuccess"));
                            this.getOwnerComponent().getRouter().navTo("RouteMain");
                        },
                        error: (oError) => {
                            this.getView().setBusy(false);
                            MessageBox.error(this._parseODataError(oError) || this._getI18nText("msgDeleteInvoiceFailed"));
                        }
                    });
                }
            });
        }
    });
});
