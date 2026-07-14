sap.ui.define([
    "code/t1/mm/test/model/formatter"
], (formatter) => {
    "use strict";

    function parseNumber(vValue) {
        const nValue = parseFloat(vValue);
        return isNaN(nValue) ? 0 : nValue;
    }

    /**
     * 검증 기준가격(USD) = (입고 전월 유가 + 청구서 Premium) × 입고수량
     */
    function calcUsd(oInput) {
        const fGrQty = parseNumber(oInput?.grQty);
        const fOil = parseNumber(oInput?.prevMonthOilPrice);
        const fPremium = parseNumber(oInput?.billPremium);
        if (!fGrQty || !fOil) {
            return 0;
        }
        return fGrQty * (fOil + fPremium);
    }

    function toLocal(fUsd, fTodayUkurs) {
        const fRate = parseNumber(fTodayUkurs);
        if (!fRate) {
            return 0;
        }
        return formatter.convertToLocalAmount(fUsd, fRate);
    }

    function applyToInvoiceItem(oItem, oInput) {
        const oResult = { ...(oItem || {}) };
        const fBaseUsd = calcUsd(oInput);
        const fGrQty = parseNumber(oInput?.grQty);
        const fIrMenge = parseNumber(oResult.IrMenge);
        const fItemAmt = parseNumber(oResult.ItemAmt);
        const fWmwst = parseNumber(oResult.Wmwst);
        const fUkurs = parseNumber(oInput?.todayUkurs);

        if (fGrQty) {
            oResult.GrMenge = fGrQty;
        }
        if (parseNumber(oInput?.prevMonthOilPrice)) {
            oResult.Oilprice = parseNumber(oInput.prevMonthOilPrice);
        }
        if (parseNumber(oInput?.billPremium) || oInput?.billPremium === 0) {
            oResult.Premium = parseNumber(oInput.billPremium);
        }

        oResult.BaseAmt = fBaseUsd;
        oResult.DiffQty = fIrMenge - parseNumber(oResult.GrMenge);
        oResult.DiffAmt = fItemAmt - fBaseUsd;
        oResult.Zwaers = oResult.Zwaers || "KRW";

        if (fUkurs) {
            oResult.ItemAmtD = toLocal(fItemAmt, fUkurs);
            oResult.BaseAmtD = toLocal(fBaseUsd, fUkurs);
            oResult.Hwste = toLocal(fWmwst, fUkurs);
            oResult.DiffAmtD = oResult.ItemAmtD - oResult.BaseAmtD;
        }

        return oResult;
    }

    function formatFormulaLabel(sYear, sMonth) {
        if (sYear && sMonth) {
            return `(입고 전월 유가 + 청구 Premium) × 입고수량 · ${sYear}년 ${sMonth}월`;
        }
        return "(입고 전월 유가 + 청구 Premium) × 입고수량";
    }

    return {
        parseNumber,
        calcUsd,
        toLocal,
        applyToInvoiceItem,
        formatFormulaLabel
    };
});
