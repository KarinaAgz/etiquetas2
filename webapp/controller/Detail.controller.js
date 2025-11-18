sap.ui.define([
    "logaligroup/etiquetas/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], function(BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
    "use strict";

    return BaseController.extend("logaligroup.etiquetas.controller.Detail", {
        onInit: function() {
            console.log("Detail inicializado");
            var oRouter = this.getRouter();
            oRouter.getRoute("RouteDetail").attachMatched(this._onObjectMatched, this);  // Bind 'this'
        },

        _onObjectMatched: function(oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sFolio = oArgs.folio;
            if (!sFolio) {
                MessageBox.error("Folio no proporcionado");
                return;
            }

            var oModel = this.getView().getModel("zbasc");  // Asume agregado en manifest
            if (!oModel) {
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
                return;
            }

            var sUrl = "/Z_ALTA_Set('" + encodeURIComponent(sFolio) + "')";  // Encode para seguridad

            oModel.read(sUrl, {
                success: function(oData) {
                    console.log("Datos:", oData);
                    var oDetailModel = new JSONModel(oData);
                    this.getView().setModel(oDetailModel, "basculaDetails");
                }.bind(this),
                error: function(oError) {
                    console.error("Error:", oError);
                    MessageBox.error(this.getResourceBundle().getText("msgErrorCargarDetalle"));  // Msg i18n
                }.bind(this)
            });
        },

        goBackBtn: function() {
            this.goBack();
        }
    });
});