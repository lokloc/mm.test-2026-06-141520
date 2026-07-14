sap.ui.define([], () => {
    "use strict";

    const sLinkSelector = ".pageTopBar .pageBreadcrumbLink";

    function _suppressBreadcrumbFocus(oView) {
        const oRoot = oView?.getDomRef();
        if (!oRoot) {
            return;
        }

        oRoot.querySelectorAll(sLinkSelector).forEach((oLink) => {
            oLink.setAttribute("tabindex", "-1");
        });

        const oActive = document.activeElement;
        if (oActive && oRoot.contains(oActive) && oActive.closest(".pageTopBar")) {
            oActive.blur();
        }
    }

    return {
        attachToView(oView) {
            if (!oView || oView._bPageFocusHelperAttached) {
                return;
            }
            oView._bPageFocusHelperAttached = true;

            oView.addEventDelegate({
                onAfterRendering() {
                    _suppressBreadcrumbFocus(oView);
                }
            }, oView);
        },

        clearHeaderFocus(oView) {
            setTimeout(() => _suppressBreadcrumbFocus(oView), 0);
        }
    };
});
