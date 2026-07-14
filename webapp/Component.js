sap.ui.define([
    "sap/ui/core/UIComponent",
    "code/t1/mm/test/model/models",
    "code/t1/mm/test/util/AppDateTime"
], (UIComponent, models, AppDateTime) => {
    "use strict";

    return UIComponent.extend("code.t1.mm.test.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createAppDateTimeModel(), "appDateTime");

            const oRouter = this.getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
            oRouter.initialize();
            sap.ui.getCore().loadLibrary("sap.suite.ui.commons", { async: true });
        },

        _onRouteMatched(oEvent) {
            const sRouteName = oEvent.getParameter("name");
            if (sRouteName === "RouteDateSetup" || AppDateTime.isConfigured()) {
                return;
            }

            this.getRouter().navTo("RouteDateSetup", {}, true);
        }
    });
});