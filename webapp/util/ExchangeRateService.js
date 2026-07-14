sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "code/t1/mm/test/util/AppDateTime",
    "code/t1/mm/test/model/formatter"
], (Filter, FilterOperator, Sorter, AppDateTime, formatter) => {
    "use strict";

    const EXCHANGE_RATE_ENTITY_SET = "/exchange_rateSet";
    const mCache = new Map();

    const toLocalDate = (vDate) => {
        const oDate = vDate instanceof Date ? vDate : AppDateTime.today();
        return new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
    };

    const toJsDate = (vValue) => {
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
    };

    const buildCacheKey = (sFcurr, sTcurr, oDate) => {
        const oLocalDate = toLocalDate(oDate);
        return [
            sFcurr,
            sTcurr,
            oLocalDate.getFullYear(),
            oLocalDate.getMonth(),
            oLocalDate.getDate()
        ].join("|");
    };

    const buildResult = (sFcurr, sTcurr, oGdatu, fUkurs, oReferenceDate) => ({
        fcurr: sFcurr,
        tcurr: sTcurr,
        ukurs: fUkurs,
        fxRate: fUkurs,
        fxRateDate: formatter.formatInvDate(oGdatu) || "-",
        gdatu: oGdatu,
        referenceDate: oReferenceDate,
        isFallback: toLocalDate(oGdatu).getTime() !== toLocalDate(oReferenceDate).getTime()
    });

    const pickClosestPastRate = (aResults, oReferenceDate) => {
        const iRefTime = toLocalDate(oReferenceDate).getTime();
        let oBest = null;
        let iBestTime = -1;

        (aResults || []).forEach((oRow) => {
            const oGdatu = toJsDate(oRow.Gdatu);
            const fUkurs = parseFloat(oRow.Ukurs) || 0;
            if (!oGdatu || !fUkurs) {
                return;
            }

            const iTime = toLocalDate(oGdatu).getTime();
            if (iTime > iRefTime || iTime <= iBestTime) {
                return;
            }

            iBestTime = iTime;
            oBest = oRow;
        });

        return oBest;
    };

    const readExchangeRateSet = (oModel, sFcurr, sTcurr) => new Promise((resolve, reject) => {
        oModel.read(EXCHANGE_RATE_ENTITY_SET, {
            filters: [
                new Filter("Fcurr", FilterOperator.EQ, sFcurr),
                new Filter("Tcurr", FilterOperator.EQ, sTcurr)
            ],
            sorters: [new Sorter("Gdatu", true)],
            success: (oData) => resolve(oData.results || []),
            error: (oError) => reject(oError)
        });
    });

    return {
        loadExchangeRate(oModel, oParams) {
            const sFcurr = (oParams?.fcurr || "USD").trim().toUpperCase();
            const sTcurr = (oParams?.tcurr || "KRW").trim().toUpperCase();
            const oReferenceDate = toLocalDate(oParams?.gdatu || AppDateTime.today());
            const sCacheKey = buildCacheKey(sFcurr, sTcurr, oReferenceDate);

            if (mCache.has(sCacheKey)) {
                return Promise.resolve(mCache.get(sCacheKey));
            }

            if (sFcurr === sTcurr) {
                const oSameCurrency = buildResult(sFcurr, sTcurr, oReferenceDate, 1, oReferenceDate);
                mCache.set(sCacheKey, oSameCurrency);
                return Promise.resolve(oSameCurrency);
            }

            if (!oModel) {
                return Promise.reject(new Error("OData model is required."));
            }

            return readExchangeRateSet(oModel, sFcurr, sTcurr)
                .then((aResults) => {
                    const oMatch = pickClosestPastRate(aResults, oReferenceDate);
                    const oResolvedDate = toJsDate(oMatch?.Gdatu) || oReferenceDate;
                    const fUkurs = parseFloat(oMatch?.Ukurs) || 0;
                    const oResult = buildResult(
                        sFcurr,
                        sTcurr,
                        oResolvedDate,
                        fUkurs,
                        oReferenceDate
                    );
                    mCache.set(sCacheKey, oResult);
                    return oResult;
                });
        },

        clearCache() {
            mCache.clear();
        }
    };
});
