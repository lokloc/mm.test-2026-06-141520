sap.ui.define([
	"sap/ui/test/Opa5"
], function (Opa5) {
	"use strict";
	var sViewName = "DateSetup";

	Opa5.createPageObjects({
		onTheDateSetupPage: {

			actions: {
				iConfirmDateSetup: function () {
					return this.waitFor({
						id: "btnDateSetupStart",
						viewName: sViewName,
						actions: new sap.ui.test.actions.Press(),
						errorMessage: "Did not find the date setup start button"
					});
				}
			},

			assertions: {

				iShouldSeeTheDateSetupPage: function () {
					return this.waitFor({
						id: "dateSetupPage",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The " + sViewName + " view is displayed");
						},
						errorMessage: "Did not find the " + sViewName + " view"
					});
				}
			}
		}
	});

});
