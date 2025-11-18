## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Fri Nov 07 2025 00:57:30 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.19.3|
|**Generation Platform**<br>SAP Business Application Studio|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>etiquetas|
|**Application Title**<br>Etiquetas |
|**Namespace**<br>logaligroup|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.142.0|
|**Enable Code Assist Libraries**<br>False|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

# Etiquetas - Gestión de Etiquetas Estándar (SAPUI5 App)
## Descripción
**Etiquetas** es una aplicación web responsive desarrollada con **SAPUI5** para la gestión rápida y eficiente de etiquetas estándar en entornos logísticos o de producción. Permite operaciones clave como reimpresión, partición y unificación de etiquetas  mediante integración con un servicio OData.

Cada acción genera un PDF en base64 que se abre automáticamente en una nueva pestaña, facilitando el flujo de trabajo para operadores de almacén. La app es single-page, con interfaz intuitiva (pestañas y formularios simples) y validaciones en tiempo real.

### Funcionalidades Principales
- **Reimpresión**: Imprime una etiqueta existente por folio.
- **Partición**: Divide una etiqueta en dos por cantidades específicas (mín. 1 cada una).
- **Unificación**: Une dos etiquetas en una sola.

### Tecnologías
- **Frontend**: SAPUI5 (XML Views, Controllers JS, i18n para multilingüe).
- **Backend**: Servicio OData v2 
- **Despliegue**: Preparada para SAP BTP (Fiori Launchpad) o on-premise.
- **Pruebas**: Mock local con JSON para desarrollo offline.




