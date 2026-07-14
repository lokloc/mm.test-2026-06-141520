sap.ui.define([], () => {
    "use strict";

    const mStatusText = {
        N: "미등록",
        C: "등록완료"
    };

    const mStatusState = {
        N: "Warning",
        C: "Success"
    };

    const mPaymentTermText = {
        Z000: "0일 이내(즉시)",
        Z030: "30일 이내",
        Z060: "60일 이내"
    };

    const mTaxCodeText = {
        V0: "매입부가세 / 수입 / 0% · 수입 매입세",
        V1: "매입/영세 / 국내 / 10% · 국내 매입 부가세",
        V2: "매입/영세 / 수출 / 0% · 수출 영세"
    };

    const mMaterialText = {
        R1000: "Dubai Crude",
        R2000: "WTI Crude",
        R3000: "Brent Crude"
    };

    const mMaterialOilcode = {
        R1000: "DUBAI_CRUDE_USD",
        R2000: "WTI_USD",
        R3000: "BRENT_CRUDE_USD"
    };

    const mTaxCodeDesc = {
        V0: "매입부가세 / 수입 / 0%",
        V1: "매입/영세 / 국내 / 10%",
        V2: "매입/영세 / 수출 / 0%"
    };

    const mApprovalText = {
        "": "미승인",
        A: "승인",
        R: "반려",
        F: "대금청구 완료"
    };

    const mApprovalState = {
        "": "Warning",
        A: "Success",
        R: "Error",
        F: "Success"
    };

    const mInternalStatusText = {
        N: "등록 전",
        C: "등록완료"
    };

    const mInternalStatusState = {
        N: "Information",
        C: "Success"
    };

    const DATE_DISPLAY_PATTERN = "yyyy-MM-dd";

    const normalizeCode = (sCode) => (sCode || "").trim().toUpperCase();

    const parseNumber = (vValue) => {
        const n = parseFloat(vValue);
        return isNaN(n) ? 0 : n;
    };

    const convertByExchangeRate = (vLocalAmount, vUkurs) => {
        const fAmount = parseNumber(vLocalAmount);
        const fRate = parseNumber(vUkurs);
        if (!fAmount || !fRate) {
            return 0;
        }
        return fAmount / fRate;
    };

    const convertToLocalAmount = (vFxAmount, vUkurs) => {
        const fAmount = parseNumber(vFxAmount);
        const fRate = parseNumber(vUkurs);
        if (!fAmount || !fRate) {
            return 0;
        }
        return fAmount * fRate;
    };

    const toSapLocalAmount = (vAmount) => {
        const fAmount = parseNumber(vAmount);
        if (!fAmount) {
            return 0;
        }
        return fAmount / 100;
    };

    const isLocalCurrency = (sCurrency) => (sCurrency || "").trim().toUpperCase() === "KRW";

    return {
        formatInvoiceStatus(sCode) {
            const sKey = normalizeCode(sCode);
            return mStatusText[sKey] || sCode || "";
        },

        formatInvoiceStatusState(sCode) {
            const sKey = normalizeCode(sCode);
            return mStatusState[sKey] || "None";
        },

        isInvoiceRegistered(sCode) {
            return normalizeCode(sCode) === "C";
        },

        formatPaymentTerm(sCode) {
            const sKey = normalizeCode(sCode);
            const sDesc = mPaymentTermText[sKey];
            if (sDesc) {
                return `${sCode} · ${sDesc}`;
            }
            return sCode || "";
        },

        formatTaxCode(sCode) {
            const sKey = normalizeCode(sCode);
            const sDesc = mTaxCodeText[sKey];
            if (sDesc) {
                return `${sCode} · ${sDesc}`;
            }
            return sCode || "";
        },

        formatMaterial(sCode) {
            const sKey = normalizeCode(sCode);
            return mMaterialText[sKey] || sCode || "";
        },

        formatMaterialOilcode(sCode) {
            const sKey = normalizeCode(sCode);
            return mMaterialOilcode[sKey] || "";
        },

        toLocalCalendarDate(vValue) {
            if (!vValue) {
                return null;
            }
            if (vValue instanceof Date) {
                return isNaN(vValue.getTime())
                    ? null
                    : new Date(vValue.getFullYear(), vValue.getMonth(), vValue.getDate());
            }
            if (typeof vValue === "string" && vValue.indexOf("/Date(") === 0) {
                const iTime = parseInt(vValue.replace(/\D/g, ""), 10);
                const oUtc = new Date(iTime);
                return new Date(oUtc.getUTCFullYear(), oUtc.getUTCMonth(), oUtc.getUTCDate());
            }
            if (typeof vValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vValue.trim())) {
                const aParts = vValue.trim().split("-");
                return new Date(
                    parseInt(aParts[0], 10),
                    parseInt(aParts[1], 10) - 1,
                    parseInt(aParts[2], 10)
                );
            }
            const oDate = new Date(vValue);
            return isNaN(oDate.getTime())
                ? null
                : new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
        },

        /**
         * OData Edm.DateTime POST용 — 입력한 달력 날짜가 UTC 기준으로도 동일하게 저장되도록 변환
         */
        toODataDate(vValue) {
            const oLocal = this.toLocalCalendarDate(vValue);
            if (!oLocal) {
                return null;
            }
            return new Date(Date.UTC(
                oLocal.getFullYear(),
                oLocal.getMonth(),
                oLocal.getDate()
            ));
        },

        _toJsDate(vValue) {
            return this.toLocalCalendarDate(vValue);
        },

        formatInvDate(sValue) {
            const oDate = this._toJsDate(sValue);
            if (!oDate) {
                return "";
            }
            const oFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: DATE_DISPLAY_PATTERN
            });
            return oFormat.format(oDate);
        },

        formatDateForPicker(sValue) {
            return this.formatInvDate(sValue);
        },

        parsePickerDate(sValue) {
            return this.toLocalCalendarDate(sValue);
        },

        getDateDisplayPattern() {
            return DATE_DISPLAY_PATTERN;
        },

        formatUnit(sUnit) {
            if (!sUnit) {
                return "";
            }
            const sKey = sUnit.trim().toUpperCase();
            if (sKey === "5A") {
                return "BBL";
            }
            return sUnit;
        },

        formatAmount(vValue, sCurrency) {
            const bLocal = isLocalCurrency(sCurrency);
            const oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: bLocal ? 0 : 2,
                maxFractionDigits: bLocal ? 0 : 2
            });
            const sNum = oFormat.format(parseNumber(vValue));
            return sCurrency ? `${sNum} ${sCurrency}` : sNum;
        },

        formatExchangeRate(vValue) {
            const fValue = parseNumber(vValue);
            if (!fValue) {
                return "-";
            }
            const oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 5
            });
            return oFormat.format(fValue);
        },

        convertByExchangeRate(vLocalAmount, vUkurs) {
            return convertByExchangeRate(vLocalAmount, vUkurs);
        },

        convertToLocalAmount(vFxAmount, vUkurs) {
            return convertToLocalAmount(vFxAmount, vUkurs);
        },

        toSapLocalAmount(vAmount) {
            return toSapLocalAmount(vAmount);
        },

        fromSapLocalAmount(vAmount) {
            return parseNumber(vAmount) * 100;
        },

        formatQty(vValue, sUnit) {
            const oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: 3,
                maxFractionDigits: 3
            });
            const sNum = oFormat.format(parseNumber(vValue));
            const sDisplayUnit = this.formatUnit(sUnit);
            return sDisplayUnit ? `${sNum} ${sDisplayUnit}` : sNum;
        },

        formatUnitPrice(vAmount, vQty, sCurrency) {
            const fQty = parseNumber(vQty);
            if (!fQty) {
                return "-";
            }
            return this.formatAmount(parseNumber(vAmount) / fQty, sCurrency);
        },

        formatVerifyStatus(bOk) {
            return bOk ? "정상" : "확인필요";
        },

        formatVerifyState(bOk) {
            return bOk ? "Success" : "Error";
        },

        formatTaxCodeDesc(sCode) {
            const sKey = normalizeCode(sCode);
            return mTaxCodeDesc[sKey] || "";
        },

        formatPrepStatus() {
            return "등록 준비";
        },

        formatPrepStatusState() {
            return "Warning";
        },

        formatApprovalStatus(sCode) {
            const sKey = (sCode || "").trim().toUpperCase();
            if (Object.prototype.hasOwnProperty.call(mApprovalText, sKey)) {
                return mApprovalText[sKey];
            }
            return sKey || mApprovalText[""];
        },

        formatApprovalStatusState(sCode) {
            const sKey = (sCode || "").trim().toUpperCase();
            return mApprovalState[sKey] ?? mApprovalState[""];
        },

        formatInternalStatus(sCode) {
            const sKey = normalizeCode(sCode);
            return mInternalStatusText[sKey] || sCode || "등록 전";
        },

        formatInternalStatusState(sCode) {
            const sKey = normalizeCode(sCode);
            return mInternalStatusState[sKey] || "Information";
        },

        formatBukrsWithName(sBukrs, sName) {
            const sCode = (sBukrs || "").trim();
            const sCompanyName = (sName || "").trim();
            if (sCode && sCompanyName) {
                return `${sCode}(${sCompanyName})`;
            }
            return sCode || sCompanyName || "";
        }
    };
});
