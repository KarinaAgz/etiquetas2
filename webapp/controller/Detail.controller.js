sap.ui.define([
    "logaligroup/etiquetas/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
],(BaseController,JSONModel,Filter,FilterOperator,MessageBox)=>{
    /**
     * @param {typeof logaligroup.bascula.controller.BaseController}BaseController
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     * @param {typeof sap.m.MessageBox}MessageBox
     */

    return BaseController.extend("logaligroup.etiquetas.controller.Detail",{
        onInit(){
            console.log("Detail");
            var oRouter=this.getRouter();

            oRouter.getRoute("RouteDetail").attachMatched(this._onObjectMatched,this);
        
        },
        _onObjectMatched(oEvent) {

            /* Opcion 1
            this.getView().bindElement({
                path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").pathBascula),
                model: "zbasc"
            }); */
            
            
            /* Recibir parámetro folio y llamar el detalle al backend
             *Fue opcion 2 */

            var oArgs = oEvent.getParameter("arguments");
            var _folio = oArgs.folio;
            var _that = this;

            var _oModel = this.getView().getModel("zbasc");

            var _url = "/Z_ALTA_Set('" + _folio + "')";

            _oModel.read(_url, {
                success: function (oData, Result) {
                    console.log(oData);
                    //MessageBox.error(oData.Folio);
                    let _oModel = new JSONModel();
                    _oModel.setData(oData);
                    _that.getView().setModel(_oModel, "basculaDetails");
                }, error: function (oError) {
                    MessageBox.error(oError);
                }
            });
            console.log(oArgs);
            
        },

        goBackBtn() {
            this.goBack();
        }
    })
})