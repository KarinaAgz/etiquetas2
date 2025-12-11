sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "logaligroup/etiquetas/controller/BaseController"
], function (Controller, MessageToast, MessageBox, BaseController) {
    "use strict";

    return BaseController.extend("logaligroup.etiquetas.controller.Main", {

        onInit: function () {
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                modoSelectivo: false,
                modoMasivo: false,
                printer: "pdf",
                logo: true,
                cantidadHUs: 0,
                werks: "1000",
                lgort: "W500"
            }), "view");
        },

        onImpresoraChange: function (oEvent) {
            this.getView().getModel("view").setProperty("/printer", oEvent.getParameter("selectedItem").getKey());
        },

        onLogoChange: function (oEvent) {
            this.getView().getModel("view").setProperty("/logo", oEvent.getParameter("selected"));
        },

        onModoSelectivoChange: function (oEvent) {
            var b = oEvent.getParameter("selected");
            var m = this.getView().getModel("view");
            m.setProperty("/modoSelectivo", b);
            m.setProperty("/cantidadHUs", 0);
            this.byId("reimpFolio")?.setValue("");
            this.byId("reimpFolioFinal")?.setValue("");
            this.byId("txtListaReimp")?.setValue("");
        },

        onModoMasivoChange: function (oEvent) {
            var b = oEvent.getParameter("selected");
            var m = this.getView().getModel("view");
            m.setProperty("/modoMasivo", b);
            m.setProperty("/cantidadHUs", 0);
            var ta = this._getCurrentTextArea();
            if (ta) ta.setValue("");
        },

        _getCurrentTextArea: function () {
            var key = this.byId("_IDGenIconTabBar").getSelectedKey();
            if (key === "reimpresion") return this.byId("txtListaReimp");
            if (key === "particion")   return this.byId("txtListaPart");
            if (key === "unificacion") return this.byId("txtListaUnif");
            return null;
        },

        onInputChange: function (oEvent) {
            var input = oEvent.getSource();
            input.setValue(input.getValue().replace(/[^0-9,\s\n]/g, ""));
            if (input.getId().includes("txtLista")) {
                this._validateListaHUs();
            }
        },

        _validateListaHUs: function () {
            var ta = this._getCurrentTextArea();
            if (!ta) return;
            var arr = ta.getValue().split(/[\s,\n]+/).map(s => s.trim()).filter(Boolean);
            var m = this.getView().getModel("view");

            if (arr.length > 100) {
                ta.setValueState("Error").setValueStateText("Máximo 100 HUs");
                m.setProperty("/cantidadHUs", 0);
            } else if (arr.length === 0) {
                ta.setValueState("None");
                m.setProperty("/cantidadHUs", 0);
            } else if (arr.every(h => h.length === 11 && !isNaN(h))) {
                ta.setValueState("None");
                m.setProperty("/cantidadHUs", arr.length);
            } else {
                ta.setValueState("Error").setValueStateText("Cada HU debe tener 11 dígitos");
                m.setProperty("/cantidadHUs", 0);
            }
        },

        _getListaHUs: function () {
            var ta = this._getCurrentTextArea();
            if (!ta) return null;
            var s = ta.getValue().trim();
            if (!s) {
                MessageBox.warning("La lista está vacía");
                return null;
            }
            var arr = s.split(/[\s,\n]+/).map(t => t.trim()).filter(Boolean);
            if (arr.length > 100 || arr.some(h => h.length !== 11 || isNaN(h))) {
                MessageBox.warning("Lista inválida o supera 100 HUs");
                return null;
            }
            return arr;
        },

        onReimprimir: function (oEvent) {
            var vm = this.getView().getModel("view");
            var selectivo = vm.getProperty("/modoSelectivo");
            var printer = vm.getProperty("/printer");
            var logo = vm.getProperty("/logo");
            var btn = oEvent.getSource();

            if (selectivo) {
                var lista = this._getListaHUs();
                if (!lista) return;

                MessageBox.confirm(`Se imprimirán ${lista.length} etiqueta(s). ¿Continuar?`, {
                    title: "Confirmar impresión",
                    onClose: function (action) {
                        if (action === MessageBox.Action.OK) {
                            btn.setBusy(true);
                            this._imprimirLista(this.getModel("ZSB_STANDARD_LABELS"), lista, printer, logo, btn);
                        }
                    }.bind(this)
                });
            } else {
                var f1 = this.byId("reimpFolio").getValue().trim();
                var f2 = this.byId("reimpFolioFinal").getValue().trim();

                if (!f1 || f1.length !== 11 || isNaN(f1)) {
                    return MessageBox.warning("Folio inicial inválido");
                }
                if (f2 && (f2.length !== 11 || isNaN(f2) || parseInt(f1) >= parseInt(f2))) {
                    return MessageBox.warning("Rango inválido");
                }

                var cant = f2 ? parseInt(f2) - parseInt(f1) + 1 : 1;

                this._validateHU(f1, () => {
                    if (f2) {
                        this._validateHU(f2, () => this._confirmarImpresion(f1, f2, cant, printer, logo, btn),
                                         (msg) => MessageBox.error(msg));
                    } else {
                        this._confirmarImpresion(f1, "", cant, printer, logo, btn);
                    }
                }, (msg) => MessageBox.error(msg));
            }
        },

        _confirmarImpresion: function (f1, f2, cant, printer, logo, btn) {
            MessageBox.confirm(`Se imprimirán ${cant} etiqueta(s). ¿Continuar?`, {
                title: "Confirmar impresión",
                onClose: (a) => {
                    if (a === "OK") {
                        btn.setBusy(true);
                        var url = `/PDFStandard(handunit='${f1}',handunit2='${f2}',printer='${printer}',logo='${logo}')`;
                        this.sendRequest(this.getModel("ZSB_STANDARD_LABELS"), url);
                        btn.setBusy(false);
                        this.byId("reimpFolio").setValue("");
                        this.byId("reimpFolioFinal").setValue("");
                    }
                }
            });
        },

        _validateHU: function (sHU, fnSuccess, fnError) {
            var oModel = this.getModel("ZSB_STANDARD_LABELS");
            var sPath = `/CheckHUExists(handunit='${sHU}')`;

            oModel.read(sPath, {
                success: (oData) => {
                    if (oData?.Active === "X") fnSuccess();
                    else fnError(`HU ${sHU} no existe o no está activa`);
                },
                error: () => fnError("Error de conexión al validar HU")
            });
        },

        _imprimirLista: function (oModel, aHUs, printer, logo, btn) {
            var i = 0;
            var that = this;
            (function next() {
                if (i >= aHUs.length) {
                    btn.setBusy(false);
                    MessageToast.show(`Impresión completada: ${aHUs.length} etiquetas`);
                    return;
                }
                var url = `/PDFStandard(handunit='${aHUs[i++]}',handunit2='',printer='${printer}',logo='${logo}')`;
                oModel.read(url, {
                    success: d => that.openPdfFromBase64(d.Pdfbase64 || d.PdfBase64),
                    error: () => {}
                });
                setTimeout(next, 300);
            })();
        },

        onParticionar: function (oEvent) {
            if (this.getView().getModel("view").getProperty("/modoMasivo")) {
                MessageBox.information("Partición masiva: próximamente");
                return;
            }
            var f = this.byId("partFolio")?.getValue().trim();
            var c1 = this.byId("cant1")?.getValue();
            var c2 = this.byId("cant2")?.getValue();
            if (!f || f.length !== 11 || !c1 || !c2 || c1 <= 0 || c2 <= 0) {
                return MessageBox.warning("Complete todos los campos correctamente");
            }
            var url = `/PDFStParticion(handunit='${f}',quan1='${c1}',quan2='${c2}',printer='${this.getView().getModel("view").getProperty("/printer")}',logo='${this.getView().getModel("view").getProperty("/logo")}')`;
            oEvent.getSource().setBusy(true);
            this.sendRequest(this.getModel("ZSB_STANDARD_LABELS"), url);
            oEvent.getSource().setBusy(false);
            this.byId("partFolio").setValue("");
            this.byId("cant1").setValue("");
            this.byId("cant2").setValue("");
        },

        onUnificar: function (oEvent) {
            if (this.getView().getModel("view").getProperty("/modoMasivo")) {
                MessageBox.information("Unificación masiva: próximamente");
                return;
            }
            var f1 = this.byId("uniFolio1")?.getValue().trim();
            var f2 = this.byId("uniFolio2")?.getValue().trim();
            if (!f1 || !f2 || f1.length !== 11 || f2.length !== 11 || f1 === f2) {
                return MessageBox.warning("Folios inválidos o iguales");
            }
            var url = `/PDFStUnificacion(handunit1='${f1}',handunit2='${f2}',printer='${this.getView().getModel("view").getProperty("/printer")}',logo='${this.getView().getModel("view").getProperty("/logo")}')`;
            oEvent.getSource().setBusy(true);
            this.sendRequest(this.getModel("ZSB_STANDARD_LABELS"), url);
            oEvent.getSource().setBusy(false);
            this.byId("uniFolio1").setValue("");
            this.byId("uniFolio2").setValue("");
        }
    });
});