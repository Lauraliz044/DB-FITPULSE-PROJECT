# Pruebas de la API de siete tablas

## Entorno y resultados de esta revisión

Ejecución del 14 de noviembre de 2026, con **Node.js 22.23.5** y **MySQL 8.4.13**. Se usaron bases locales desechables y cuentas ficticias. Los resultados no certifican el rendimiento de un servidor público.

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| Integración HTTP | 123 casos y 299 comprobaciones; sin fallos | `evidence/test-results.json` |
| Contrato completo | Éxito y error para las 35 operaciones OpenAPI | `summary.coverage` en el mismo archivo |
| Contraseñas y salt | 4 pruebas aprobadas | `tests/passwords.test.js` y salida de `npm run test:passwords` |
| Calendario y categorías | 3 pruebas aprobadas | `tests/progress-data.test.js` y `npm run test:progress` |
| Cuentas y migración | 7 casos aprobados | `evidence/credential-tools-results.json` |
| Compatibilidad del esquema | 5 casos aprobados con cambios reales en una base temporal | `evidence/schema-results.json` |
| Colección Postman, ejecutada con Newman 6.2.1 | 76 solicitudes y 149 comprobaciones; sin fallos | `evidence/newman-results.json` |
| Modelo físico | 7 tablas, 49 columnas y 7 FK | `evidence/model-metadata.json` |
| Catálogo, lote de 50 peticiones concurrentes | p95: 111,955 ms | `summary.catalogLoad` |
| Historial personal, lote de 50 peticiones concurrentes | p95: 72,275 ms | `summary.personalLoad` |
| Una consulta de progreso con la muestra de prueba | 2,604 ms; umbral de 10 s superado favorablemente | Caso `Weekly streak and category totals` |

Los dos lotes usan el mismo token de cliente. Son 50 solicitudes simultáneas, no 50 usuarios diferentes ni una prueba sostenida; por ello no se declara validado RNF-04. La medición de progreso usa un historial pequeño y no permite extrapolar a volúmenes grandes. Las cifras anteriores se deben actualizar desde el JSON si se repite la ejecución.

La revisión anterior tenía 120 casos/279 comprobaciones. La evolución actual añade migración, hash, salts, rechazo del hash utilizado como contraseña y comprobaciones de servicio de las páginas y su configuración. También conserva los cinco rechazos de administración de clases y paquetes con token de cliente. El número de operaciones HTTP permanece en 35. Los indicadores `success: true` y `error: true` significan que se probó correctamente un caso de éxito y uno de rechazo para esa operación.

## Repetir en Visual Studio Code

Instala Node.js 22 y MySQL, ejecuta `npm ci` y configura `.env` como indica el README. Usa una base de pruebas vacía, distinta de tu base habitual; por ejemplo, crea en Workbench `fitpulse_project_test`. Configura ese nombre en `TEST_DB_NAME`. La cuenta de pruebas debe poder crear tablas; `test:schema` necesita además crear y eliminar su propia base temporal.

```sh
npm run test:passwords
npm run test:progress
npm run test:schema
npm test
npm run test:credential-tools
```

`npm test` añade únicamente datos ficticios a `TEST_DB_NAME`; no borra la base de trabajo. Oculta contraseñas y tokens en el reporte y en `docs/FitPulse.postman_collection.json`. Este último archivo es una captura de integración con respuestas: **no es la colección automatizada de Postman**.

## Ejecutar la colección Postman

En una base de demostración limpia, ejecuta `db:setup`, `db:seed`, `db:demo` y `npm start`. Importa **`evidence/FitPulse.postman_collection.json`**. Configura:

| Variable | Valor |
| --- | --- |
| `baseUrl` | `http://localhost:5000/api/v1`, o el servidor que configuraste |
| `adminEmail` | Tu `ADMIN_EMAIL` |
| `adminPassword` | Tu `ADMIN_PASSWORD` |
| `clientEmail` | Tu `DEMO_CLIENT_EMAIL` |
| `clientPassword` | Tu `DEMO_CLIENT_PASSWORD` |

Ejecuta todas las carpetas en orden. La colección inicia sesiones y conserva identificadores y tokens automáticamente. Sus carpetas siguen el orden de uso del gimnasio; por eso no coinciden exactamente con la agrupación de recursos del informe. Usa datos de demostración: la colección crea y modifica registros. Si la repites, los datos previos pueden cambiar los casos esperados; prepara una base desechable nueva para comparar una corrida completa.

La verificación guardada se ejecutó con Newman, la herramienta CLI de Postman, contra la API real.

## Recorrido manual para explicar el funcionamiento

1. Registra un cliente y comprueba `201`; intenta repetir su correo y comprueba `409`. Inicia sesión y utiliza `data.accessToken` en **Authorize**.
2. Inicia sesión como administrador. Crea una clase futura y un paquete (`201`), consulta y modifica sus datos (`200`). Guarda los IDs. Crea otros dos registros desechables, elimínalos (`204`) y vuelve a consultarlos (`404`).
3. Autoriza el cliente. Comprueba que crear, modificar o eliminar clases y paquetes devuelve `403`. Compra el paquete usando solo `packageId`; comprueba el precio devuelto. El servidor rechaza un precio enviado por el comprador (`400`).
4. Reserva la clase futura (`201`); una segunda reserva devuelve `409`. La asistencia antes de terminar devuelve `409`; una reseña sin asistencia también devuelve `409`.
5. Consulta el historial del cliente de demostración preparado por `db:demo`; identifica una reserva con `ends_at` pasado. Como administrador, marca su asistencia con `{"status":"attended"}` (`200`). El cliente no puede ejecutar esta operación (`403`).
6. Como cliente, crea una reseña para esa clase (`201`), repítela (`409`), modifícala (`200`) y elimínala (`204`). Consulta progreso: la asistencia permanece. Puedes omitir comentario, etiquetas e intensidad al crear una reseña.
7. Registra una marca personal propia con ejercicio, tipo, valor positivo, unidad y fecha no futura; consulta, modifica y elimina. Intenta leer el progreso o historial de otro usuario: debe responder `403`.
8. Como administrador, consulta compras y ventas del día (`200`), desactiva una cuenta (`200`) y comprueba que su token existente se rechaza (`403`). Reactívala con el administrador para continuar.
9. Comprueba `409` al modificar o eliminar un paquete comprado, y al modificar o eliminar una clase con reservas. Para comprobar eliminación de clases usa una clase futura sin reservas, no una clase histórica asistida.

La prueba de concurrencia de `npm test` envía dos reservas de clientes distintos al último cupo: exactamente una debe devolver `201` y la otra `409`, quedando una sola fila. El bloqueo tras cinco intentos erróneos devuelve cuatro veces `401` y luego `423`; la suite verifica el contador, la duración y el desbloqueo. Estos casos respaldan RNF-02 y RNF-03. El almacenamiento de RNF-01 ahora tiene pruebas de Argon2id y migración; cada base existente debe ejecutar esa migración localmente.


La interfaz web se verifica con el recorrido de la sección «Recorrer la interfaz web» del README: registro, inicio de sesión, catálogo, reservas, paquetes, reseñas, progreso, marcas personales y las tres pantallas del administrador, incluido el registro de asistencia.
