sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "logaligroup/etiquetas/controller/BaseController"  
], function(Controller, MessageToast, MessageBox, BaseController) {
    "use strict";

    return BaseController.extend("logaligroup.etiquetas.controller.Main", {  // Extiende BaseController
        onInit: function() {
            console.log("Main inicializado");
        },

        onInputChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();
            if (sValue && (isNaN(sValue) || parseInt(sValue) <= 0)) {
                oInput.setValueState("Error");
                oInput.setValueStateText(this.getResourceBundle().getText("msgInputInvalido"));
            } else {
                oInput.setValueState("None");
            }
        },

        onReimprimir: function(oEvent) {
            var oView = this.getView();
            var sFolio = oView.byId("reimpFolio").getValue().trim();
            var oButton = oEvent.getSource();  // Para busy

            if (!sFolio || isNaN(sFolio) || sFolio.length !== 11) {
                MessageBox.warning(this.getResourceBundle().getText("msgFolioInvalido"));  // Minúscula 'w'
                return;
            }

            var oModel = this.getModel("ZSB_STANDARD_LABELS");
            if (!oModel) {
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
                return;
            }

            var oUrl = "/PDFStReimpresion(handunit='" + sFolio + "')";  // ¡CORREGIDO: Define oUrl!

            oButton.setBusy(true);
            this.sendRequest(oModel, oUrl);
            oButton.setBusy(false);  // Limpia busy post-request (ajusta si callback)
            oView.byId("reimpFolio").setValue("");  // Limpia input
        },

        onParticionar: function(oEvent) {
            var oView = this.getView();
            var sFolio = oView.byId("partFolio").getValue().trim();
            var sCant1 = oView.byId("cant1").getValue().trim();
            var sCant2 = oView.byId("cant2").getValue().trim();
            var oButton = oEvent.getSource();

            if (!sFolio || !sCant1 || !sCant2 || isNaN(sFolio) || isNaN(sCant1) || isNaN(sCant2) || parseInt(sCant1) <= 0 || parseInt(sCant2) <= 0) {
                MessageBox.warning(this.getResourceBundle().getText("msgParticionarInvalido"));
                return;
            }

            var oModel = this.getModel("ZSB_STANDARD_LABELS");
            var oUrl = "/PDFStParticion(handunit='" + sFolio + "',quan1='" + sCant1 + "',quant2='" + sCant2 + "')";

            if (!oModel) {
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
                return;
            }

            oButton.setBusy(true);
            this.sendRequest(oModel, oUrl);
            oButton.setBusy(false);
            // Limpia inputs
            oView.byId("partFolio").setValue("");
            oView.byId("cant1").setValue("");
            oView.byId("cant2").setValue("");
        },

        onUnificar: function(oEvent) {
            var oView = this.getView();
            var sFolio1 = oView.byId("uniFolio1").getValue().trim();
            var sFolio2 = oView.byId("uniFolio2").getValue().trim();
            var oButton = oEvent.getSource();

            if (!sFolio1 || !sFolio2 || isNaN(sFolio1) || isNaN(sFolio2) || sFolio1 === sFolio2) {
                MessageBox.warning(this.getResourceBundle().getText("msgUnificarInvalido"));
                return;
            }

            var oModel = this.getModel("ZSB_STANDARD_LABELS");
            var oUrl = "/PDFStUnificacion(handunit1='" + sFolio1 + "',handunit2='" + sFolio2 + "')";

            if (!oModel) {
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));  // Corregido msg
                return;
            }

            oButton.setBusy(true);
            this.sendRequest(oModel, oUrl);
            oButton.setBusy(false);
            // Limpia inputs
            oView.byId("uniFolio1").setValue("");
            oView.byId("uniFolio2").setValue("");
        }
    });
});