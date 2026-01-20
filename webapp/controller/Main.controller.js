sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "logaligroup/etiquetas/controller/BaseController"
], function (Controller, MessageToast, MessageBox, BaseController) {
    "use strict";

    return BaseController.extend("logaligroup.etiquetas.controller.Main", {

        onInit: function () {
            console.log("Main inicializado");
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                modoSelectivo: false,
                printer: "pdf",      // Se mantiene en el modelo pero NO se envía al backend
                logo: true           // Se mantiene pero NO se envía
            }), "view");
        },

        onImpresoraChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("view").setProperty("/printer", sKey);
        },

        onLogoChange: function (oEvent) {
            var bSelected = oEvent.getParameter("selected");
            this.getView().getModel("view").setProperty("/logo", bSelected);
        },

        onCheckboxChange: function (oEvent) {
            var bSelected = oEvent.getParameter("selected");
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            oViewModel.setProperty("/modoSelectivo", bSelected);

            if (bSelected) {
                oView.byId("reimpFolio").setValue("");
                oView.byId("reimpFolioFinal").setValue("");
            } else {
                oView.byId("txtListaHUs").setValue("");
            }
        },

        onInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sId = oInput.getId();
            var sValue = oInput.getValue();
            var oBundle = this.getResourceBundle();
            var sNewValue = sValue.replace(/[^0-9]/g, '');

            if (sId.includes("reimpFolio") || sId.includes("reimpFolioFinal")) {
                if (sNewValue.length > 11) {
                    sNewValue = sNewValue.substring(0, 11);
                    oInput.setValueState("Warning");
                    oInput.setValueStateText("Máximo 11 dígitos permitidos.");
                } else if (sNewValue.length > 0 && (isNaN(sNewValue) || parseInt(sNewValue) <= 0)) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText(oBundle.getText("msgInputInvalido"));
                    sNewValue = "";
                } else {
                    oInput.setValueState("None");
                }
                oInput.setValue(sNewValue);
            } else if (sId.includes("txtListaHUs")) {
                var sCleanValue = sValue.replace(/\s/g, '');
                var aHUs = sCleanValue.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                var bValid = true;
                var sErrorMsg = "";

                for (var i = 0; i < aHUs.length; i++) {
                    var sHU = aHUs[i].replace(/[^0-9]/g, '');
                    if (sHU.length !== 11) {
                        bValid = false;
                        sErrorMsg = "Cada folio HU debe tener exactamente 11 dígitos.";
                        break;
                    }
                }

                if (!bValid || aHUs.length > 100) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText(sErrorMsg || "Máximo 100 folios de 11 dígitos.");
                } else {
                    oInput.setValueState("None");
                }
            } else {
                if (sValue && (isNaN(sValue) || parseInt(sValue) <= 0)) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText(oBundle.getText("msgInputInvalido"));
                } else {
                    oInput.setValueState("None");
                }
            }
        },

        // === REIMPRESIÓN (individual, rango y selectiva) ===
        onReimprimir: function (oEvent) {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var bModoSelectivo = oViewModel.getProperty("/modoSelectivo");
            var oButton = oEvent.getSource();
            var oBundle = this.getResourceBundle();

            var oModel = this.getModel("ZSB_STANDARD_LABELS");
            if (!oModel) {
                MessageBox.error(oBundle.getText("msgModelNoDisponible"));
                return;
            }

            if (bModoSelectivo) {
                // ----- MODO SELECTIVA -----
                var sLista = oView.byId("txtListaHUs").getValue().trim();
                if (!sLista) {
                    MessageBox.warning(oBundle.getText("msgListaInvalida"));
                    return;
                }
                var aHUs = sLista.split(',').map(s => s.trim()).filter(Boolean);
                if (aHUs.length > 100 || aHUs.length === 0) {
                    MessageBox.warning(oBundle.getText("msgListaInvalida"));
                    return;
                }
                for (var i = 0; i < aHUs.length; i++) {
                    if (isNaN(aHUs[i]) || aHUs[i].length !== 11) {
                        MessageBox.warning(oBundle.getText("msgListaInvalida"));
                        return;
                    }
                }

                MessageBox.confirm(oBundle.getText("msgConteoHUs", [aHUs.length]), {
                    onClose: function (sAction) {
                        if (sAction === "OK") {
                            oButton.setBusy(true);
                            this.procesaListaSelectiva(oModel, aHUs, oButton);
                            oView.byId("txtListaHUs").setValue("");
                        }
                    }.bind(this)
                });
            } else {
                // ----- MODO INDIVIDUAL / RANGO -----
                var sFolio1 = oView.byId("reimpFolio").getValue().trim();
                var sFolio2 = oView.byId("reimpFolioFinal").getValue().trim();

                if (!sFolio1 || sFolio1.length !== 11) {
                    MessageBox.warning(oBundle.getText("msgFolioInvalido"));
                    return;
                }
                if (sFolio2 && (sFolio2.length !== 11 || parseInt(sFolio1) >= parseInt(sFolio2))) {
                    MessageBox.warning(oBundle.getText("msgRangoInvalido"));
                    return;
                }

                var sHandunit2 = sFolio2 || '';

                // CAMBIO: Igual que Erick → SOLO handunit y handunit2 (sin printer ni logo)
                var oUrl = "/PDFStandard(handunit='" + sFolio1 + "',handunit2='" + sHandunit2 + "')";

                console.log("Llamando a (individual/rango):", oUrl);

                oButton.setBusy(true);
                this.sendRequest(oModel, oUrl);
                oButton.setBusy(false);

                oView.byId("reimpFolio").setValue("");
                oView.byId("reimpFolioFinal").setValue("");
            }
        },

        // === PROCESAMIENTO SELECTIVA (sin printer ni logo) ===
        procesaListaSelectiva: function (oModel, aHUs, oButton) {
            var i = 0;
            var that = this;
            function callNext() {
                if (i >= aHUs.length) {
                    oButton.setBusy(false);
                    MessageToast.show("Procesamiento selectivo completado: " + aHUs.length + " etiquetas.");
                    return;
                }
                var sHU = aHUs[i];

                // CAMBIO: Igual que Erick → solo handunit, sin printer ni logo
                var oUrl = "/PDFStandard(handunit='" + sHU + "',handunit2='')";

                console.log("Llamando selectiva a HU " + sHU + ":", oUrl);

                oModel.read(oUrl, {
                    success: function (oData) {
                        that.openPdfFromBase64(oData.Pdfbase64);
                        i++;
                        callNext();
                    },
                    error: function (oError) {
                        console.error("Error en HU " + sHU, oError);
                        i++;
                        callNext();
                    }
                });
            }
            callNext();
        },

        // === PARTICIÓN (sin printer ni logo) ===
        onParticionar: function (oEvent) {
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

            // CAMBIO: Igual que Erick → sin printer ni logo
            var oUrl = "/PDFStParticion(handunit='" + sFolio + "',quan1='" + sCant1 + "',quan2='" + sCant2 + "')";

            console.log("Llamando partición a:", oUrl);

            oButton.setBusy(true);
            this.sendRequest(oModel, oUrl);
            oButton.setBusy(false);

            oView.byId("partFolio").setValue("");
            oView.byId("cant1").setValue("");
            oView.byId("cant2").setValue("");
        },

        // === UNIFICACIÓN (sin printer ni logo) ===
        onUnificar: function (oEvent) {
            var oView = this.getView();
            var sFolio1 = oView.byId("uniFolio1").getValue().trim();
            var sFolio2 = oView.byId("uniFolio2").getValue().trim();
            var oButton = oEvent.getSource();

            if (!sFolio1 || !sFolio2 || isNaN(sFolio1) || isNaN(sFolio2) || sFolio1 === sFolio2) {
                MessageBox.warning(this.getResourceBundle().getText("msgUnificarInvalido"));
                return;
            }

            var oModel = this.getModel("ZSB_STANDARD_LABELS");

            // CAMBIO: Igual que Erick → sin printer ni logo
            var oUrl = "/PDFStUnificacion(handunit1='" + sFolio1 + "',handunit2='" + sFolio2 + "')";

            console.log("Llamando unificación a:", oUrl);

            oButton.setBusy(true);
            this.sendRequest(oModel, oUrl);
            oButton.setBusy(false);

            oView.byId("uniFolio1").setValue("");
            oView.byId("uniFolio2").setValue("");
        }
    });
});