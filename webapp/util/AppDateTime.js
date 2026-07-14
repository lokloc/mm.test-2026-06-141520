sap.ui.define([], () => {
    "use strict";

    let oCurrentDateTime = null;

    return {
        isConfigured() {
            return oCurrentDateTime instanceof Date && !isNaN(oCurrentDateTime.getTime());
        },

        set(vDateTime) {
            oCurrentDateTime = new Date(vDateTime);
        },

        now() {
            return this.isConfigured() ? new Date(oCurrentDateTime) : new Date();
        },

        today() {
            const oDate = this.now();
            return new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
        },

        reset() {
            oCurrentDateTime = null;
        }
    };
});
