sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("logaligroup.etiquetas.controller.BaseController", {
        getRouter: function() {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        getModel: function(sName) {
            return this.getView().getModel(sName);  
        },

        setModel: function(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function() {
            var oModel = this.getModel("i18n");
            return oModel ? oModel.getResourceBundle() : null;
        },

        // Nueva: goBack para Detail
        goBack: function() {
            this.getRouter().navTo("RouteMain");
        },

        openPdfFromBase64: function(sBase64, sSuccessMessageKey) {
            var oBundle = this.getResourceBundle();
            if (!sBase64) {
                MessageBox.warning(oBundle.getText("msgContenidoPdfNoEncontrado"));
                return;
            }

            try {
                var byteCharacters = atob(sBase64);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: "application/pdf" });
                var blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, "_blank");

                if (sSuccessMessageKey) {
                    MessageToast.show(oBundle.getText(sSuccessMessageKey));
                }
            } catch (e) {
                console.error("Error Base64 a PDF:", e);
                MessageBox.error(oBundle.getText("msgErrorMostrarPdf"));
            }
        },

        sendRequest: function(oModel, oUrl) {
            console.log("Request a:", oUrl);
            oModel.read(oUrl, {
                success: function(oData) {
                    this.openPdfFromBase64(oData.Pdfbase64, "msgReimpresionExitosa");
                    console.log("Respuesta:", oData);
                }.bind(this),
                error: function(oError) {
                    MessageBox.error(this.getResourceBundle().getText("msgErrorReimpresion"));
                    console.log("Error:", oError);
                }.bind(this)
            });
        }
    });
});