sap.ui.define([
    "sap/m/TableSelectDialog",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ObjectNumber",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/type/Float"
], (TableSelectDialog, Column, ColumnListItem, Label, Text, ObjectNumber, JSONModel, Filter, FilterOperator, Float) => {
    "use strict";

    const createTextCell = (sPath) => new Text({ text: `{${sPath}}` });

    const createAmountCell = (sAmountPath, sUnitPath) => new ObjectNumber({
        number: {
            path: sAmountPath,
            type: new Float({
                minFractionDigits: 2,
                maxFractionDigits: 2
            })
        },
        unit: `{${sUnitPath}}`
    });

    const buildTemplate = (aColumns) => new ColumnListItem({
        type: "Active",
        cells: aColumns.map((oColumn) => {
            if (oColumn.type === "amount") {
                return createAmountCell(oColumn.path, oColumn.unitPath);
            }
            return createTextCell(oColumn.path);
        })
    });

    const buildColumns = (aColumns) => aColumns.map((oColumn) => new Column({
        width: oColumn.width || "auto",
        hAlign: oColumn.hAlign || "Begin",
        header: new Label({ text: oColumn.label })
    }));

    const calcContentWidth = (aColumns) => {
        let fTotal = 1.5;

        aColumns.forEach((oColumn) => {
            if (oColumn.width && /^\d+(\.\d+)?rem$/.test(oColumn.width)) {
                fTotal += parseFloat(oColumn.width);
            } else {
                fTotal += 6;
            }
        });

        return `${Math.ceil(fTotal)}rem`;
    };

    const applySearchFilter = (oDialog, sQuery, aSearchPaths) => {
        const oBinding = oDialog.getBinding("items");
        const sValue = (sQuery || "").trim();

        if (!sValue) {
            oBinding.filter([]);
            return;
        }

        const aFilters = aSearchPaths.map((sPath) => new Filter(sPath, FilterOperator.Contains, sValue));
        oBinding.filter(new Filter({
            filters: aFilters,
            and: false
        }));
    };

    return {
        /**
         * @param {object} oParams
         * @param {sap.ui.core.mvc.View} oParams.oView
         * @param {string} oParams.sTitle
         * @param {object[]} oParams.aItems
         * @param {{label:string,path:string,width?:string,hAlign?:string,type?:string,unitPath?:string}[]} oParams.aColumns
         * @param {string[]} oParams.aSearchPaths
         * @param {function(object):string} oParams.fnGetKey
         * @param {function(string, object):void} oParams.fnOnConfirm
         */
        open(oParams) {
            const oView = oParams.oView;
            const sDialogId = `${oView.getId()}--mainSearchHelpDialog`;
            const oExistingDialog = sap.ui.getCore().byId(sDialogId);

            if (oExistingDialog) {
                oExistingDialog.destroy();
            }

            const oModel = new JSONModel({ items: oParams.aItems || [] });
            const oDialog = new TableSelectDialog(sDialogId, {
                title: oParams.sTitle,
                noDataText: oParams.sNoDataText || "",
                contentWidth: oParams.contentWidth || calcContentWidth(oParams.aColumns),
                growing: true,
                growingThreshold: 100,
                columns: buildColumns(oParams.aColumns),
                search(oEvent) {
                    applySearchFilter(oEvent.getSource(), oEvent.getParameter("value"), oParams.aSearchPaths);
                },
                liveChange(oEvent) {
                    applySearchFilter(oEvent.getSource(), oEvent.getParameter("value"), oParams.aSearchPaths);
                },
                confirm(oEvent) {
                    const oSelectedItem = oEvent.getParameter("selectedItem");
                    if (!oSelectedItem) {
                        return;
                    }

                    const oData = oSelectedItem.getBindingContext().getObject();
                    oParams.fnOnConfirm(oParams.fnGetKey(oData), oData);
                }
            });

            oDialog.setModel(oModel);
            oDialog.bindItems({
                path: "/items",
                template: buildTemplate(oParams.aColumns),
                templateShareable: false
            });

            oDialog.addStyleClass("mainSearchHelpDialog");
            oView.addDependent(oDialog);
            oDialog.open();
        }
    };
});
