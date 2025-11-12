sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller) => {
    "use strict";

    return Controller.extend("logaligroup.etiquetas.controller.Main", {
        onInit() {
        },
        onReimprimir:function(){
            var oView=this.getView();
            var sFolio=oView.byId("reimpFolio").getValue().trim();

            if(!sFolio){
                MessageBox.Warning(this.getResourceBundle().getText("msgFolioInvalido"));
                return;
            }

            var oModel=this.getModel("ZSB_STANDARD_LABELS");
            if(!oModel){
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
                return;
            }

            this.sendRequest(oModel,oUrl);

        },
        onParticionar:function(){
            var oView=this.getView();
            var sFolio=oView.byId("partFolio").getValue().trim();
            var sCant1=oView.byId("cant1").getValue().trim();
            var sCant2=oView.byId("cant2").getValue().trim();

            if(!sFolio || !sCant1 || !sCant2){
                MessageBox.warning(this.getResourceBundle().getText("msgParticionar"));
                return;
            }

            var oModel= this.getModel("ZSB_STANDARD_LABELS");
            var oUrl="/PDFStParticion(handunit='"+sFolio+"',quan1='"+sCant1+"',quant2='"+sCant2+"')";

            if(!oModel){
                MessageBox.error(this.getResourceBundle().getText("msgModelNoDisponible"));
                return;
            }
            this.sendRequest(oModel,oUrl);
        },
        onUnificar:function(){
            var oView=this.getView();
            var sFolio_1=oView.byId("uniFolio1").getValue().trim();
            var sFolio_2=oView.byId("uniFolio2").getValue().trim();

            if(!sFolio_1 || !sFolio_2){
                MessageBox.warning(this.getResourceBundle().getText("msgParticionar"));
                return;
            }

            var oModel=this.getModel("ZSB_STANDARD_LABELS");
            var oUrl="/PDFStUnificacion(handunit1='"+sFolio_1+"',handunit2='"+sFolio_2+"')";

            if(!oModel){
                MessageBox.error(this.getResourceBundle().getText("msgModeloNoDisponible"));
                return;
            }
            this.sendRequest(oModel,oUrl);

        }
    });
});