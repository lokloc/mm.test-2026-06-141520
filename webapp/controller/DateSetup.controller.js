sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "code/t1/mm/test/util/AppDateTime",
    "code/t1/mm/test/model/formatter"
], (Controller, JSONModel, MessageToast, AppDateTime, formatter) => {
    "use strict";

    return Controller.extend("code.t1.mm.test.controller.DateSetup", {
        onInit() {
            this.getOwnerComponent().getRouter()
                .getRoute("RouteDateSetup")
                .attachPatternMatched(this._onRouteMatched, this);

            this._initDateSetupModel();
        },

        _onRouteMatched() {
            if (AppDateTime.isConfigured()) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
                return;
            }

            this._initDateSetupModel();
        },

        _initDateSetupModel() {
            const oNow = new Date();
            const sTime = [
                String(oNow.getHours()).padStart(2, "0"),
                String(oNow.getMinutes()).padStart(2, "0"),
                String(oNow.getSeconds()).padStart(2, "0")
            ].join(":");

            this.getView().setModel(new JSONModel({
                date: this._formatDateValue(oNow),
                time: sTime
            }), "dateSetup");
        },

        onStart() {
            const oModel = this.getView().getModel("dateSetup");
            const vDate = oModel.getProperty("/date");
            const sTime = (oModel.getProperty("/time") || "").trim();

            if (!vDate) {
                MessageToast.show(this._getI18nText("dateSetupDateRequired"));
                return;
            }

            if (!sTime) {
                MessageToast.show(this._getI18nText("dateSetupTimeRequired"));
                return;
            }

            const oDateTime = this._combineDateAndTime(vDate, sTime);
            if (!oDateTime || isNaN(oDateTime.getTime())) {
                MessageToast.show(this._getI18nText("dateSetupInvalidDateTime"));
                return;
            }

            AppDateTime.set(oDateTime);
            this._updateAppDateTimeModel(oDateTime);
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        _combineDateAndTime(vDate, sTime) {
            const oDate = this._parseDateValue(vDate);
            if (!oDate || isNaN(oDate.getTime())) {
                return null;
            }

            const aParts = sTime.split(":");
            const iHours = parseInt(aParts[0], 10);
            const iMinutes = parseInt(aParts[1], 10);
            const iSeconds = parseInt(aParts[2], 10) || 0;

            return new Date(
                oDate.getFullYear(),
                oDate.getMonth(),
                oDate.getDate(),
                isNaN(iHours) ? 0 : iHours,
                isNaN(iMinutes) ? 0 : iMinutes,
                isNaN(iSeconds) ? 0 : iSeconds,
                0
            );
        },

        _formatDateValue(oDate) {
            const fnPad = (nValue) => String(nValue).padStart(2, "0");
            return `${oDate.getFullYear()}-${fnPad(oDate.getMonth() + 1)}-${fnPad(oDate.getDate())}`;
        },

        _parseDateValue(vDate) {
            const oLocal = formatter.toLocalCalendarDate(vDate);
            return oLocal && !isNaN(oLocal.getTime()) ? oLocal : null;
        },

        _updateAppDateTimeModel(oDateTime) {
            const oAppModel = this.getOwnerComponent().getModel("appDateTime");
            if (!oAppModel) {
                return;
            }

            oAppModel.setData({
                configured: true,
                timestamp: oDateTime.getTime(),
                date: new Date(oDateTime.getFullYear(), oDateTime.getMonth(), oDateTime.getDate()),
                time: [
                    String(oDateTime.getHours()).padStart(2, "0"),
                    String(oDateTime.getMinutes()).padStart(2, "0"),
                    String(oDateTime.getSeconds()).padStart(2, "0")
                ].join(":"),
                displayText: this._formatDisplayText(oDateTime)
            });
        },

        _formatDisplayText(oDateTime) {
            const fnPad = (nValue) => String(nValue).padStart(2, "0");
            return `${oDateTime.getFullYear()}.${fnPad(oDateTime.getMonth() + 1)}.${fnPad(oDateTime.getDate())} `
                + `${fnPad(oDateTime.getHours())}:${fnPad(oDateTime.getMinutes())}:${fnPad(oDateTime.getSeconds())}`;
        },

        _getI18nText(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});
