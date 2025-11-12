sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller,MessageToast,MessageBox){
    "use strict";

    return Controller.extend("logaligroup.etiquetas.controller.BaseController",{
        getRouter:function(){
            return sap.ui.core.UiComponent.getRouterFor(this);

        },
        getModel:function(sName){
            return this.getView().setModel(oModel,sName);
        },
        setModel:function(oModel,sName){
            return this.getView().setModel(oModel,sName);
        },
        getResourceBundle:function(){
            var oModel=this.getModel("i18n");
            return oModel ? oModel.getResourceBundle(): null;
        },
        openPdfFromBase64:function(sBase64,sSuccessMessageKey){
            var oBundle=this.getResourceBundle();

            if(!sBase64){
                sap.m.MessageBox.warning(oBundle.getText("msgContenidoPdfNoEncontrado"));
                return;
            }

            try{
                var byteCharacters=atob(sBase64);
                var byteNumbers=new Array(byteCharacters.length);

                for (var i=0; i< byteCharacters.length; i++){
                    byteNumbers[i]=byteCharacters.charCodeAt(i);
                }

                var byteArray=new Uint8Array(byteNumbers);
                var blob=new Blob([byteArray],{type: "application/pdf"});
                var blobUrl=URL.createObjectURL(blob);

                window.open(blobUrl,"_blank");

                if(sSuccessMessageKey){
                    sap.m.MessageToast.show(oBundle.getText(sSuccessMessageKey));

                }
            }catch(e){
                console.error("Error al convertir Base64 a pdf",e);
                sap.m.MessageBox.error(oBundle.getText("msgErrorMostrarPdf"));
            }
        },

        sendRequest:function(oModel,oUrl){
            console.log(oUrl);
            oModel.read(oUrl,{
                success:function(oData){
                    this.openPdfFromBase64(oData.Pdfbase64,"msgReimpresionExitosa");
                    MessageToast.show(this.getResourceBundle().getText("msgReimpresionExitosa"));
                    console.log("respuesta del servicio", oData);
                }.bind(this),
                error:function(oError){
                    MessageBox.error(this.getResourceBundle().getText("msgErrorReimpresion"));
                    console.log("Error:",oError);
                }.bind(this)
            });
        }
    });
});