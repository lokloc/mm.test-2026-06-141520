sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "code/t1/mm/test/model/formatter",
    "code/t1/mm/test/util/PageFocusHelper",
    "code/t1/mm/test/util/VerificationBasePriceService"
], (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageToast, formatter, PageFocusHelper,
    VerificationBasePriceService) => {
    "use strict";

    return Controller.extend("code.t1.mm.test.controller.BillDetail", {
        onInit() {
            this.getView().setModel(new JSONModel({}), "billItem");
            this.getView().setModel(new JSONModel({
                unitPrice: 0,
                calcAmount: 0,
                calcAmountLocal: 0,
                amountDiff: 0,
                qtyDiff: 0,
                amountVerifyOk: true,
                qtyVerifyOk: true
            }), "detailMetrics");

            PageFocusHelper.attachToView(this.getView());

            this.getOwnerComponent().getRouter()
                .getRoute("RouteBillDetail")
                .attachPatternMatched(this._onRouteMatched, this);
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

        formatMaterial(sCode) {
            return formatter.formatMaterial(sCode);
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

        formatUnitPrice(vAmount, vQty, sCurrency) {
            return formatter.formatUnitPrice(vAmount, vQty, sCurrency);
        },

        formatVerifyStatus(bOk) {
            return formatter.formatVerifyStatus(bOk);
        },

        formatVerifyState(bOk) {
            return formatter.formatVerifyState(bOk);
        },

        formatBillActionText(sIvZlspr) {
            return formatter.isInvoiceRegistered(sIvZlspr)
                ? this._getI18nText("btnMatchAndView")
                : this._getI18nText("btnMatchAndRegister");
        },

        formatBillActionIcon(sIvZlspr) {
            return formatter.isInvoiceRegistered(sIvZlspr)
                ? "sap-icon://display"
                : "sap-icon://compare";
        },

        _getI18nText(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },

        _onRouteMatched(oEvent) {
            PageFocusHelper.clearHeaderFocus(this.getView());
            const sInvNo = oEvent.getParameter("arguments").InvNo;
            const oModel = this.getOwnerComponent().getModel();
            const sPath = oModel.createKey("/billSet", { InvNo: sInvNo });

            this.getView().getModel("billItem").setData({});
            this._resetDetailMetrics();

            this.getView().bindElement({
                path: sPath,
                events: {
                    dataRequested: () => this.getView().setBusy(true),
                    dataReceived: (oEvent) => {
                        this.getView().setBusy(false);
                        PageFocusHelper.clearHeaderFocus(this.getView());
                        if (!this.getOwnerComponent().getRouter().getRoute("RouteBillDetail").isMatched()) {
                            return;
                        }
                        const oContext = oEvent.getSource().getBoundContext();
                        if (!oContext || !oContext.getObject()) {
                            MessageToast.show("청구서 상세 정보를 찾을 수 없습니다.");
                            this.onNavBack();
                            return;
                        }
                        this._computeDetailMetrics();
                    }
                }
            });

            this._loadBillItem(sInvNo);
        },

        _loadBillItem(sInvNo) {
            this.getView().setBusy(true);

            this.getOwnerComponent().getModel().read("/bill_itemsSet", {
                filters: [new Filter("InvNo", FilterOperator.EQ, sInvNo)],
                sorters: [new Sorter("InvItem")],
                success: (oData) => {
                    const aResults = oData.results || [];
                    const oFirstItem = aResults.length > 0 ? aResults[0] : {};
                    this.getView().getModel("billItem").setData(oFirstItem);
                    this._computeDetailMetrics();
                    this.getView().setBusy(false);
                },
                error: () => {
                    this.getView().setBusy(false);
                    MessageToast.show("청구서 아이템 조회에 실패했습니다.");
                }
            });
        },

        _resetDetailMetrics() {
            this.getView().getModel("detailMetrics").setData({
                unitPrice: 0,
                calcAmount: 0,
                calcAmountLocal: 0,
                amountDiff: 0,
                qtyDiff: 0,
                amountVerifyOk: true,
                qtyVerifyOk: true
            });
        },

        _computeDetailMetrics() {
            const oHeaderCtx = this.getView().getBindingContext();
            const oItem = this.getView().getModel("billItem").getData() || {};

            if (!oHeaderCtx) {
                return;
            }

            const fTotalAmt = parseFloat(oHeaderCtx.getProperty("TotalAmt")) || 0;
            const fTotalQty = parseFloat(oHeaderCtx.getProperty("TotalQty")) || 0;
            const fItemAmt = parseFloat(oItem.ItemAmt) || fTotalAmt;
            const fMenge = parseFloat(oItem.Menge) || fTotalQty;
            const sEbeln = (oItem.Ebeln || oHeaderCtx.getProperty("Ebeln") || "").trim();
            const sWaers = oHeaderCtx.getProperty("Waers") || oItem.Waers || "USD";

            VerificationBasePriceService.calcForBill(this.getOwnerComponent().getModel(), {
                ebeln: sEbeln,
                matnr: oItem.Matnr,
                billPremium: oItem.Premium,
                fxWaers: sWaers,
                localWaers: "KRW"
            }).then((oResult) => {
                const fCalcAmount = oResult.baseUsd;
                const fAmountDiff = fTotalAmt - fCalcAmount;
                const fQtyDiff = fTotalQty - fMenge;

                this.getView().getModel("detailMetrics").setData({
                    unitPrice: fMenge ? fTotalAmt / fMenge : 0,
                    calcAmount: fCalcAmount,
                    calcAmountLocal: oResult.baseLocal,
                    amountDiff: fAmountDiff,
                    qtyDiff: fQtyDiff,
                    amountVerifyOk: Math.abs(fAmountDiff) < 0.01,
                    qtyVerifyOk: Math.abs(fQtyDiff) < 0.001
                });
            }).catch(() => {
                this._resetDetailMetrics();
            });
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        onCreateInvoice() {
            const oContext = this.getView().getBindingContext();
            const sInvNo = oContext?.getProperty("InvNo");
            if (!sInvNo) {
                MessageToast.show("청구서 정보가 없습니다.");
                return;
            }
            this._setInvoiceSource(oContext);
            this.getOwnerComponent().getRouter().navTo("RouteInvoiceCreate", {
                InvNo: sInvNo
            });
        },

        _setInvoiceSource(oContext) {
            this.getOwnerComponent().setModel(new JSONModel({
                bill: oContext.getObject(),
                item: this.getView().getModel("billItem").getData(),
                metrics: this.getView().getModel("detailMetrics").getData()
            }), "invoiceSource");
        },

        onEdit() {
            const sInvNo = this.getView().getBindingContext()?.getProperty("InvNo");
            MessageToast.show(sInvNo ? `내용 수정: ${sInvNo}` : "내용 수정");
        },

        onVerify() {
            this._computeDetailMetrics();
            const oMetrics = this.getView().getModel("detailMetrics").getData();
            if (oMetrics.amountVerifyOk && oMetrics.qtyVerifyOk) {
                MessageToast.show("검증 결과: 정상");
            } else {
                MessageToast.show("검증 결과: 확인이 필요합니다.");
            }
        }
    });
});
