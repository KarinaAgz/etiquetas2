sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "logaligroup/etiquetas/controller/BaseController"
], function (Controller, MessageToast, MessageBox, BaseController) {
    "use strict";

    return BaseController.extend("logaligroup.etiquetas.controller.Main", {  // Extiende BaseController
        onInit: function () {
            console.log("Main inicializado");
            // Inicial: Modo no selectivo (para binding de visibilidad)
            this.getView().setModel(new sap.ui.model.json.JSONModel({ modoSelectivo: false }), "view");
        },

        onCheckboxChange: function (oEvent) {
            var bSelected = oEvent.getParameter("selected");
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            oViewModel.setProperty("/modoSelectivo", bSelected);

            // Reset campos opuestos
            if (bSelected) {
                oView.byId("reimpFolio").setValue("");
                oView.byId("reimpFolioFinal").setValue("");
            } else {
                oView.byId("txtListaHUs").setValue("");
            }
        },

        onInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sId = oInput.getId();  // Para identificar el input
            var sValue = oInput.getValue();
            var oBundle = this.getResourceBundle();
            var sNewValue = sValue.replace(/[^0-9]/g, '');  // Quita todo lo que no sea dígito (fuerza solo números)

            if (sId.includes("reimpFolio") || sId.includes("reimpFolioFinal")) {
                // Para Inputs de Folio: Fuerza exactamente 11 dígitos máx
                if (sNewValue.length > 11) {
                    sNewValue = sNewValue.substring(0, 11);  // Trunca a 11
                    oInput.setValueState("Warning");
                    oInput.setValueStateText("Máximo 11 dígitos permitidos.");
                } else if (sNewValue.length > 0 && (isNaN(sNewValue) || parseInt(sNewValue) <= 0)) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText(oBundle.getText("msgInputInvalido"));
                    sNewValue = "";  // Limpia si inválido
                } else {
                    oInput.setValueState("None");
                }
                oInput.setValue(sNewValue);  // Aplica el valor limpio
            } else if (sId.includes("txtListaHUs")) {
                // Para TextArea: Valida cada HU sea exactamente 11 dígitos
                var sCleanValue = sValue.replace(/\s/g, '');  // Quita espacios
                var aHUs = sCleanValue.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                var bValid = true;
                var sErrorMsg = "";

                for (var i = 0; i < aHUs.length; i++) {
                    var sHU = aHUs[i].replace(/[^0-9]/g, '');  // Fuerza dígitos en cada HU
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
                    // Opcional: Re-aplica con solo dígitos limpios (sin cambiar el input del user)
                }
            } else {
                // Para otros inputs (cantidades, etc.): Validación original
                if (sValue && (isNaN(sValue) || parseInt(sValue) <= 0)) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText(oBundle.getText("msgInputInvalido"));
                } else {
                    oInput.setValueState("None");
                }
            }
        },
        onReimprimir: function (oEvent) {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var bModoSelectivo = oViewModel.getProperty("/modoSelectivo");
            var oButton = oEvent.getSource();
            var oBundle = this.getResourceBundle();

            if (bModoSelectivo) {
                // MODO SELECTIVA
                var sLista = oView.byId("txtListaHUs").getValue().trim();
                if (!sLista) {
                    MessageBox.warning(oBundle.getText("msgListaInvalida"));
                    return;
                }
                var aHUs = sLista.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                if (aHUs.length > 100 || aHUs.length === 0) {
                    MessageBox.warning(oBundle.getText("msgListaInvalida"));
                    return;
                }
                // Valida cada HU: 11 dígitos numéricos
                for (var i = 0; i < aHUs.length; i++) {
                    if (isNaN(aHUs[i]) || aHUs[i].length !== 11) {
                        MessageBox.warning(oBundle.getText("msgListaInvalida"));
                        return;
                    }
                }
                // Confirmación con conteo
                MessageBox.confirm(oBundle.getText("msgConteoHUs", [aHUs.length]), {
                    onClose: function (sAction) {
                        if (sAction === "OK") {
                            var oModel = this.getModel("ZSB_STANDARD_LABELS");
                            if (!oModel) {
                                MessageBox.error(oBundle.getText("msgModelNoDisponible"));
                                return;
                            }
                            oButton.setBusy(true);
                            this.procesaListaSelectiva(oModel, aHUs, oButton);
                            oView.byId("txtListaHUs").setValue("");  // Limpia
                        }
                    }.bind(this)
                });
                return;  // Sale temprano
            } else {
                // MODO INDIVIDUAL/RANGO
                var sFolio1 = oView.byId("reimpFolio").getValue().trim();
                var sFolio2 = oView.byId("reimpFolioFinal").getValue().trim();

                if (!sFolio1 || isNaN(sFolio1) || sFolio1.length !== 11) {
                    MessageBox.warning(oBundle.getText("msgFolioInvalido"));
                    return;
                }

                if (sFolio2) {
                    if (isNaN(sFolio2) || sFolio2.length !== 11 || parseInt(sFolio1) >= parseInt(sFolio2)) {
                        MessageBox.warning(oBundle.getText("msgRangoInvalido"));
                        return;
                    }
                }

                var oModel = this.getModel("ZSB_STANDARD_LABELS");
                if (!oModel) {
                    MessageBox.error(oBundle.getText("msgModelNoDisponible"));
                    return;
                }

                var sHandunit2 = sFolio2 || '';
                var oUrl = "/PDFStandard(handunit='" + sFolio1 + "',handunit2='" + sHandunit2 + "')";

                oButton.setBusy(true);
                this.sendRequest(oModel, oUrl);
                oButton.setBusy(false);

                oView.byId("reimpFolio").setValue("");
                oView.byId("reimpFolioFinal").setValue("");
            }
        },

        // Nueva función helper para procesar lista selectiva (múltiples calls secuenciales)
        procesaListaSelectiva: function (oModel, aHUs, oButton) {
            var i = 0;
            var fnRecursiveCall = function () {
                if (i >= aHUs.length) {
                    oButton.setBusy(false);
                    MessageToast.show("Procesamiento selectivo completado para " + aHUs.length + " HUs.");
                    return;
                }
                var sHU = aHUs[i];
                var oUrl = "/PDFStandard(handunit='" + sHU + "',handunit2='')";  // Individual por cada HU
                oModel.read(oUrl, {
                    success: function (oData) {
                        this.openPdfFromBase64(oData.Pdfbase64);  // Abre PDF sin toast extra
                        i++;
                        fnRecursiveCall.call(this);
                    }.bind(this),
                    error: function (oError) {
                        console.error("Error en HU " + sHU + ":", oError);
                        i++;
                        fnRecursiveCall.call(this);
                    }.bind(this)
                });
            }.bind(this);
            fnRecursiveCall();
        },

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
            var oUrl = "/PDFStUnificacion(handunit1='" + sFolio1 + "',handunit2='" + sFolio2 + "')";

            if (!oModel) {
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
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