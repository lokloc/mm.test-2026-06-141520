sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/m/GroupHeaderListItem",
    "code/t1/mm/test/model/formatter",
    "code/t1/mm/test/util/MainSearchHelp"
], (Controller, JSONModel, Sorter, MessageToast, GroupHeaderListItem, formatter, MainSearchHelp) => {
    "use strict";

    return Controller.extend("code.t1.mm.test.controller.Main", {
        onInit() {
            this._bHasSearched = false;
            this._aBillCache = null;
            this._bPendingMainRefresh = false;
            this.getView().setModel(new JSONModel({
                notCreatedCount: 0,
                createdCount: 0
            }), "summary");
            this.getView().setModel(new JSONModel({ items: [] }), "billList");

            this.getOwnerComponent().getRouter()
                .getRoute("RouteMain")
                .attachPatternMatched(this._onMainRouteMatched, this);
        },

        onAfterRendering() {
            if (!this._oBillRowTemplate) {
                const oTable = this.byId("billTable");
                const aItems = oTable?.getItems() || [];
                if (aItems.length > 0) {
                    this._oBillRowTemplate = aItems[0].clone();
                    oTable.removeAllItems();
                }
            }

            if (this._bPendingMainRefresh) {
                this._bPendingMainRefresh = false;
                this._refreshBillListFromServer();
            }
        },

        _onMainRouteMatched() {
            if (!this._bHasSearched) {
                return;
            }

            this._refreshBillListFromServer();
        },

        _refreshBillListFromServer() {
            this._aBillCache = null;

            if (!this._oBillRowTemplate) {
                this._bPendingMainRefresh = true;
                return;
            }

            this._loadBillTable();
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

        onBillPress(oEvent) {
            const oItem = oEvent.getSource();
            if (oItem instanceof GroupHeaderListItem) {
                return;
            }

            const oContext = oItem.getBindingContext("billList") || oItem.getBindingContext();
            if (!oContext) {
                MessageToast.show("선택한 청구서 정보를 찾을 수 없습니다.");
                return;
            }

            const oData = oContext.getObject();
            if (oData._rowType && oData._rowType !== "bill") {
                return;
            }

            const sInvNo = (oContext.getProperty("InvNo") || "").trim();
            if (!sInvNo) {
                MessageToast.show("청구서 번호를 찾을 수 없습니다.");
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteBillDetail", {
                InvNo: sInvNo
            });
        },

        onSearch() {
            this._bHasSearched = true;
            this._loadBillTable();
        },

        onResetSearch() {
            this._clearSearchFields();
            this._bHasSearched = false;
            this._aBillCache = null;
            this.byId("billTable").unbindItems();
            this.getView().getModel("billList").setProperty("/items", []);
            this._resetSummaryCounts();
        },

        onStatusCardPress(oEvent) {
            const oSource = oEvent.getSource();
            const oStatusData = oSource.getCustomData().find((oCustomData) => oCustomData.getKey() === "status");
            const sStatus = oStatusData?.getValue() || "";

            this.byId("cbInvStatus")?.setSelectedKey(sStatus);
            this._bHasSearched = true;
            this._loadBillTable();
        },

        onRefresh() {
            if (!this._bHasSearched) {
                MessageToast.show("먼저 조회를 실행해 주세요.");
                return;
            }
            this._loadBillTable();
            MessageToast.show("청구서 목록을 새로고침했습니다.");
        },

        onVendorValueHelp() {
            this._openVendorSearchHelp();
        },

        onBillValueHelp() {
            this._openBillSearchHelp();
        },

        _getI18nText(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },

        _readODataSet(sPath) {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel().read(sPath, {
                    urlParameters: {
                        "$top": "500"
                    },
                    success: (oData) => resolve(oData.results || []),
                    error: (oError) => {
                        // eslint-disable-next-line no-console
                        console.error(`OData read failed: ${sPath}`, oError);
                        reject(oError);
                    }
                });
            });
        },

        _readBillSetForSearchHelp() {
            if (Array.isArray(this._aBillCache) && this._aBillCache.length > 0) {
                return Promise.resolve(this._aBillCache);
            }

            return this._readODataSet("/billSet").then((aBills) => {
                this._aBillCache = aBills;
                return aBills;
            });
        },

        _openSearchHelp(oConfig) {
            try {
                MainSearchHelp.open({
                    oView: this.getView(),
                    sTitle: oConfig.sTitle,
                    sNoDataText: this._getI18nText("searchHelpNoData"),
                    aItems: oConfig.aItems,
                    aColumns: oConfig.aColumns,
                    aSearchPaths: oConfig.aSearchPaths,
                    fnGetKey: oConfig.fnGetKey,
                    fnOnConfirm: (sKey) => {
                        this.byId(oConfig.sInputId)?.setValue(sKey);
                    }
                });
            } catch (oError) {
                MessageToast.show(this._getI18nText("searchHelpOpenError"));
                // eslint-disable-next-line no-console
                console.error("Search help dialog error:", oError);
            }
        },

        _openVendorSearchHelp() {
            this._readBillSetForSearchHelp()
                .then((aBills) => {
                    const mVendors = new Map();

                    aBills.forEach((oBill) => {
                        const sLifnr = (oBill.Lifnr || "").trim();
                        if (!sLifnr || mVendors.has(sLifnr)) {
                            return;
                        }

                        mVendors.set(sLifnr, {
                            Lifnr: sLifnr,
                            Name1: (oBill.Name1 || "").trim()
                        });
                    });

                    const aItems = Array.from(mVendors.values())
                        .sort((a, b) => a.Lifnr.localeCompare(b.Lifnr));

                    this._openSearchHelp({
                        sInputId: "inpLifnr",
                        sTitle: this._getI18nText("searchHelpVendorTitle"),
                        aItems,
                        aColumns: [
                            { label: this._getI18nText("labelVendorId"), path: "Lifnr", width: "7rem" },
                            { label: this._getI18nText("colVendorName"), path: "Name1", width: "13rem" }
                        ],
                        aSearchPaths: ["Lifnr", "Name1"],
                        fnGetKey: (oItem) => oItem.Lifnr
                    });
                })
                .catch(() => {
                    MessageToast.show(this._getI18nText("searchHelpLoadError"));
                });
        },

        _openBillSearchHelp() {
            this._readBillSetForSearchHelp()
                .then((aBills) => {
                    const aItems = aBills
                        .map((oBill) => ({
                            InvNo: (oBill.InvNo || "").trim(),
                            Lifnr: (oBill.Lifnr || "").trim(),
                            TotalAmt: oBill.TotalAmt,
                            Waers: (oBill.Waers || "").trim()
                        }))
                        .filter((oItem) => oItem.InvNo)
                        .sort((a, b) => a.InvNo.localeCompare(b.InvNo));

                    this._openSearchHelp({
                        sInputId: "inpInvNo",
                        sTitle: this._getI18nText("searchHelpBillTitle"),
                        aItems,
                        aColumns: [
                            { label: this._getI18nText("colInvNo"), path: "InvNo", width: "7rem" },
                            { label: this._getI18nText("labelVendorId"), path: "Lifnr", width: "7rem" },
                            {
                                label: this._getI18nText("colAmount"),
                                path: "TotalAmt",
                                unitPath: "Waers",
                                type: "amount",
                                width: "9rem",
                                hAlign: "End"
                            }
                        ],
                        aSearchPaths: ["InvNo", "Lifnr", "Waers"],
                        fnGetKey: (oItem) => oItem.InvNo
                    });
                })
                .catch(() => {
                    MessageToast.show(this._getI18nText("searchHelpLoadError"));
                });
        },

        _loadBillTable() {
            const oTable = this.byId("billTable");
            const oODataModel = this.getOwnerComponent().getModel();

            if (!this._oBillRowTemplate) {
                const aItems = oTable.getItems() || [];
                if (aItems.length > 0) {
                    this._oBillRowTemplate = aItems[0].clone();
                }
            }

            if (!this._oBillRowTemplate) {
                MessageToast.show("목록을 준비하지 못했습니다. 페이지를 새로고침해 주세요.");
                return;
            }

            oTable.setBusy(true);
            oODataModel.read("/billSet", {
                sorters: [new Sorter("Lifnr")],
                urlParameters: {
                    "$top": "500"
                },
                success: (oData) => {
                    const aAllResults = oData.results || [];
                    this._aBillCache = aAllResults;
                    const aResults = this._applyClientFilters(aAllResults, this._getSearchCriteria());
                    const oBillListModel = this.getView().getModel("billList");

                    oBillListModel.setProperty("/items", this._buildNestedList(aResults));
                    oTable.unbindItems();
                    oTable.destroyItems();
                    oTable.setModel(oBillListModel, "billList");
                    oTable.bindItems({
                        path: "billList>/items",
                        factory: this._createBillListItem.bind(this),
                        templateShareable: false
                    });

                    this._updateSummaryFromResults(aResults);
                    oTable.setBusy(false);

                    if (aResults.length === 0) {
                        MessageToast.show(this._getI18nText("searchNoResult"));
                    }
                },
                error: () => {
                    oTable.setBusy(false);
                    MessageToast.show("청구서 목록 조회에 실패했습니다.");
                }
            });
        },

        _buildNestedList(aResults) {
            const mStatusOrder = { N: 0, C: 1 };
            const mStatusText = { N: "미등록", C: "등록완료" };

            const aSorted = [...aResults].sort((a, b) => {
                const sStatusA = (a.IvZlspr || "").trim().toUpperCase();
                const sStatusB = (b.IvZlspr || "").trim().toUpperCase();
                const iOrderA = mStatusOrder[sStatusA] ?? 9;
                const iOrderB = mStatusOrder[sStatusB] ?? 9;

                if (iOrderA !== iOrderB) {
                    return iOrderA - iOrderB;
                }

                const sVendorA = a.Lifnr || "";
                const sVendorB = b.Lifnr || "";
                if (sVendorA !== sVendorB) {
                    return sVendorA.localeCompare(sVendorB);
                }

                return (a.InvNo || "").localeCompare(b.InvNo || "");
            });

            const aDisplay = [];
            let sLastStatus = null;
            let sLastVendor = null;

            aSorted.forEach((oBill) => {
                const sStatus = (oBill.IvZlspr || "").trim().toUpperCase();
                const sVendorKey = oBill.Lifnr || "";
                const sVendorLabel = oBill.Name1 ? `${oBill.Lifnr} · ${oBill.Name1}` : oBill.Lifnr;

                if (sStatus !== sLastStatus) {
                    aDisplay.push({
                        _rowType: "status",
                        _groupTitle: mStatusText[sStatus] || sStatus || "기타"
                    });
                    sLastStatus = sStatus;
                    sLastVendor = null;
                }

                if (sVendorKey !== sLastVendor) {
                    aDisplay.push({
                        _rowType: "vendor",
                        _groupTitle: sVendorLabel || "(공급업체 없음)"
                    });
                    sLastVendor = sVendorKey;
                }

                aDisplay.push(Object.assign({ _rowType: "bill" }, oBill));
            });

            return aDisplay;
        },

        _createBillListItem(sId, oContext) {
            const oData = oContext.getObject();

            if (oData._rowType === "status" || oData._rowType === "vendor") {
                const oHeader = new GroupHeaderListItem({
                    title: oData._groupTitle,
                    upperCase: false
                });
                oHeader.addStyleClass(oData._rowType === "status" ? "billGroupStatus" : "billGroupVendor");
                return oHeader;
            }

            return this._oBillRowTemplate.clone();
        },

        _updateSummaryFromResults(aResults) {
            let iNotCreated = 0;
            let iCreated = 0;

            aResults.forEach((oItem) => {
                const sStatus = (oItem.IvZlspr || "").trim().toUpperCase();
                if (sStatus === "C") {
                    iCreated++;
                } else if (sStatus === "N") {
                    iNotCreated++;
                }
            });

            const oSummaryModel = this.getView().getModel("summary");
            oSummaryModel.setProperty("/notCreatedCount", iNotCreated);
            oSummaryModel.setProperty("/createdCount", iCreated);
        },

        _resetSummaryCounts() {
            const oSummaryModel = this.getView().getModel("summary");
            oSummaryModel.setProperty("/notCreatedCount", 0);
            oSummaryModel.setProperty("/createdCount", 0);
        },

        _clearSearchFields() {
            ["inpLifnr", "inpInvNo"].forEach((sId) => {
                this.byId(sId)?.setValue("");
            });

            const oDateRange = this.byId("drsBillDate");
            if (oDateRange) {
                oDateRange.setDateValue(null);
                oDateRange.setSecondDateValue(null);
                oDateRange.setValue("");
            }

            this.byId("cbInvStatus")?.setSelectedKey("");
        },

        _getSearchCriteria() {
            const oDateRange = this.byId("drsBillDate");

            return {
                sLifnr: this.byId("inpLifnr")?.getValue().trim() || "",
                sInvNo: this.byId("inpInvNo")?.getValue().trim() || "",
                dFrom: oDateRange?.getDateValue() || null,
                dTo: oDateRange?.getSecondDateValue() || null,
                sStatus: this._getStatusFilter()
            };
        },

        _getStatusFilter() {
            return (this.byId("cbInvStatus")?.getSelectedKey() || "").trim().toUpperCase();
        },

        _applyClientFilters(aResults, oCriteria) {
            const sLifnr = (oCriteria.sLifnr || "").toUpperCase();
            const sInvNo = (oCriteria.sInvNo || "").toUpperCase();
            const sStatus = oCriteria.sStatus || "";
            const dFrom = oCriteria.dFrom ? this._getStartOfDay(oCriteria.dFrom) : null;
            const dTo = oCriteria.dTo ? this._getEndOfDay(oCriteria.dTo) : null;

            return aResults.filter((oBill) => {
                if (sStatus) {
                    const sItemStatus = (oBill.IvZlspr || "").trim().toUpperCase();
                    if (sItemStatus !== sStatus) {
                        return false;
                    }
                }

                if (sLifnr) {
                    const sVendorId = (oBill.Lifnr || "").trim().toUpperCase();
                    const sVendorName = (oBill.Name1 || "").trim().toUpperCase();
                    if (!sVendorId.includes(sLifnr) && !sVendorName.includes(sLifnr)) {
                        return false;
                    }
                }

                if (sInvNo) {
                    const sBillNo = (oBill.InvNo || "").trim().toUpperCase();
                    if (!sBillNo.includes(sInvNo)) {
                        return false;
                    }
                }

                if (dFrom || dTo) {
                    const dInvDate = this._toJsDate(oBill.InvDat);
                    if (!dInvDate) {
                        return false;
                    }
                    if (dFrom && dInvDate < dFrom) {
                        return false;
                    }
                    if (dTo && dInvDate > dTo) {
                        return false;
                    }
                }

                return true;
            });
        },

        _toJsDate(vValue) {
            if (!vValue) {
                return null;
            }
            if (vValue instanceof Date) {
                return isNaN(vValue.getTime()) ? null : vValue;
            }
            if (typeof vValue === "string" && vValue.indexOf("/Date(") === 0) {
                const iTime = parseInt(vValue.replace(/\D/g, ""), 10);
                const oUtc = new Date(iTime);
                return new Date(oUtc.getUTCFullYear(), oUtc.getUTCMonth(), oUtc.getUTCDate());
            }
            const oDate = new Date(vValue);
            return isNaN(oDate.getTime()) ? null : oDate;
        },

        _getStartOfDay(dDate) {
            const dResult = new Date(dDate);
            dResult.setHours(0, 0, 0, 0);
            return dResult;
        },

        _getEndOfDay(dDate) {
            const dResult = new Date(dDate);
            dResult.setHours(23, 59, 59, 999);
            return dResult;
        }
    });
});
