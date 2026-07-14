sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "code/t1/mm/test/model/formatter",
    "code/t1/mm/test/util/AppDateTime",
    "code/t1/mm/test/util/ExchangeRateService",
    "code/t1/mm/test/util/VerificationBasePrice"
], (Filter, FilterOperator, formatter, AppDateTime, ExchangeRateService, VerificationBasePrice) => {
    "use strict";

    const GR_ITEM_ENTITY_SET = "/gritemSet";
    const GR_HEAD_ENTITY_SET = "/grheadSet";
    const MONTH_OIL_ENTITY_SET = "/monthoilSet";

    function parseNumber(vValue) {
        return VerificationBasePrice.parseNumber(vValue);
    }

    function toSapLocalDate(vValue) {
        if (!vValue) {
            return null;
        }
        if (vValue instanceof Date && !isNaN(vValue.getTime())) {
            return vValue;
        }
        const sValue = String(vValue).trim();
        if (/^\d{8}$/.test(sValue)) {
            const oDate = new Date(
                parseInt(sValue.slice(0, 4), 10),
                parseInt(sValue.slice(4, 6), 10) - 1,
                parseInt(sValue.slice(6, 8), 10)
            );
            return isNaN(oDate.getTime()) ? null : oDate;
        }
        const oParsed = new Date(sValue);
        return isNaN(oParsed.getTime()) ? null : oParsed;
    }

    function getPrevMonthYearMon(vDate) {
        const oDate = toSapLocalDate(vDate);
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
    }

    function getMonthFilterVariants(sMonat) {
        const sPadded = String(sMonat || "").padStart(2, "0");
        const sUnpadded = String(parseInt(sMonat, 10) || "");
        return sPadded === sUnpadded ? [sPadded] : [sPadded, sUnpadded];
    }

    function readEntitySet(oModel, sPath, oOptions) {
        return new Promise((resolve, reject) => {
            oModel.read(sPath, {
                ...oOptions,
                success: (oData) => resolve(oData),
                error: reject
            });
        });
    }

    function readGrItems(oModel, sEbeln) {
        return readEntitySet(oModel, GR_ITEM_ENTITY_SET, {
            filters: [new Filter("Ebeln", FilterOperator.EQ, sEbeln)]
        }).then((oData) => oData.results || []);
    }

    function readGrHead(oModel, sMblnr, sMjahr) {
        if (!sMblnr) {
            return Promise.resolve({});
        }
        return readEntitySet(oModel, GR_HEAD_ENTITY_SET, {
            filters: [
                new Filter("Mblnr", FilterOperator.EQ, sMblnr),
                new Filter("Mjahr", FilterOperator.EQ, sMjahr || "")
            ]
        }).then((oData) => (oData.results || [])[0] || {});
    }

    function sumGrQty(aItems) {
        let fTotal = 0;
        (aItems || []).forEach((oItem) => {
            const fQty = parseNumber(oItem.Menge);
            fTotal += oItem.Shkzg === "H" ? -fQty : fQty;
        });
        return fTotal;
    }

    function extractOilPrice(oOil) {
        if (!oOil) {
            return 0;
        }
        return parseNumber(oOil.Price ?? oOil.price);
    }

    async function readMonthOilPrice(oModel, sYearat, sMonat, sOilcode) {
        const aMonthVariants = getMonthFilterVariants(sMonat);

        for (let i = 0; i < aMonthVariants.length; i++) {
            const sMonatVariant = aMonthVariants[i];
            try {
                const sPath = oModel.createKey(MONTH_OIL_ENTITY_SET, {
                    Yearat: sYearat,
                    Monat: sMonatVariant,
                    Oilcode: sOilcode
                });
                const oByKey = await readEntitySet(oModel, sPath, {});
                if (oByKey) {
                    return oByKey;
                }
            } catch (e) {
                // try filter read next
            }

            try {
                const oData = await readEntitySet(oModel, MONTH_OIL_ENTITY_SET, {
                    filters: [
                        new Filter("Yearat", FilterOperator.EQ, sYearat),
                        new Filter("Monat", FilterOperator.EQ, sMonatVariant),
                        new Filter("Oilcode", FilterOperator.EQ, sOilcode)
                    ]
                });
                const oMatch = (oData.results || [])[0];
                if (oMatch) {
                    return oMatch;
                }
            } catch (e) {
                // try next variant
            }
        }

        return null;
    }

    async function loadTodayExchangeRate(oModel, sFxWaers, sLocalWaers) {
        return ExchangeRateService.loadExchangeRate(oModel, {
            fcurr: sFxWaers || "USD",
            tcurr: sLocalWaers || "KRW",
            gdatu: AppDateTime.today()
        });
    }

    /**
     * OData에서 검증 기준가격 입력값 조회
     * @param {sap.ui.model.odata.v2.ODataModel} oModel
     * @param {{ ebeln: string, matnr?: string, billPremium?: number, fxWaers?: string, localWaers?: string }} oParams
     */
    async function loadInputs(oModel, oParams) {
        const sEbeln = (oParams?.ebeln || "").trim();
        const sMatnr = (oParams?.matnr || "").trim();
        const fBillPremium = parseNumber(oParams?.billPremium);
        const sFxWaers = (oParams?.fxWaers || "USD").trim();
        const sLocalWaers = (oParams?.localWaers || "KRW").trim();
        const oEmpty = {
            grQty: 0,
            prevMonthOilPrice: 0,
            billPremium: fBillPremium,
            todayUkurs: 0
        };

        if (!sEbeln) {
            return oEmpty;
        }

        const aGrItems = await readGrItems(oModel, sEbeln);
        const fGrQty = sumGrQty(aGrItems);
        const sMblnr = (aGrItems[0]?.Mblnr || "").trim();
        const sMjahr = (aGrItems[0]?.Mjahr || "").trim();
        const oGrHead = await readGrHead(oModel, sMblnr, sMjahr);
        const vGrDate = oGrHead.Budat || oGrHead.Bldat;
        const oPrev = getPrevMonthYearMon(vGrDate);
        const sOilcode = formatter.formatMaterialOilcode(sMatnr);
        let fOilPrice = 0;

        if (oPrev.year && oPrev.month && sOilcode) {
            const oOil = await readMonthOilPrice(oModel, oPrev.year, oPrev.month, sOilcode);
            fOilPrice = extractOilPrice(oOil);
        }

        const oExchangeRate = await loadTodayExchangeRate(oModel, sFxWaers, sLocalWaers);

        return {
            grQty: fGrQty,
            prevMonthOilPrice: fOilPrice,
            billPremium: fBillPremium,
            todayUkurs: parseNumber(oExchangeRate?.ukurs ?? oExchangeRate?.fxRate)
        };
    }

    async function calcForBill(oModel, oParams) {
        const oInputs = await loadInputs(oModel, oParams);
        const fBaseUsd = VerificationBasePrice.calcUsd(oInputs);
        return {
            ...oInputs,
            baseUsd: fBaseUsd,
            baseLocal: VerificationBasePrice.toLocal(fBaseUsd, oInputs.todayUkurs)
        };
    }

    return {
        loadInputs,
        calcForBill
    };
});
