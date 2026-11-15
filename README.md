# FitPulse · API de siete tablas

API REST para gestionar clientes, clases, paquetes, compras, reservas, asistencia, reseñas y marcas personales. Usa Node.js 22 o superior, Express y MySQL 8.0.16 o superior. El esquema tiene **7 tablas, 49 columnas, 7 claves foráneas y 35 operaciones HTTP**.

Guía detallada: [instalar, migrar, probar y abrir las páginas desde cero en Windows](docs/guia-desde-cero.md).

## Ejecutar en Visual Studio Code

1. Abre la raíz del repositorio, donde está `package.json`.
2. Ejecuta `npm ci`.
3. Copia `.env.example` como `.env`. En PowerShell: `Copy-Item .env.example .env`; en Linux: `cp .env.example .env`.
4. Configura la conexión MySQL, `DB_NAME`, las contraseñas de demostración y un `JWT_SECRET` aleatorio de al menos 32 caracteres. No publiques `.env`.
5. Con MySQL iniciado, ejecuta:

```sh
npm run db:setup
npm run db:migrate-passwords
npm run db:seed
npm run db:demo
npm start
```

Con la configuración de ejemplo: [Mi progreso](http://localhost:5000/progress.html), [Mis marcas](http://localhost:5000/personal-records.html), [Swagger UI](http://localhost:5000/docs) y [OpenAPI](http://localhost:5000/openapi.json). `db:setup` crea el esquema; `db:migrate-passwords` convierte las contraseñas antiguas a Argon2id; `db:seed` prepara el administrador y paquetes; `db:demo` prepara un cliente y una reserva de una clase terminada para probar asistencia. Antes de migrar una base existente, detén la API, guarda una copia privada y revisa `DB_NAME`. La migración conserva contraseñas de acceso e identificadores; no transforma esquemas incompatibles. Consulta [la autenticación](docs/third-cut/password-security.md).

Si ya tienes datos, respáldalos y compara el esquema con `database/schema.sql`. El arranque detecta tablas o columnas faltantes, identificadores sin `AUTO_INCREMENT` y columnas adicionales obligatorias sin valor predeterminado. **Esta validación no sustituye una migración ni comprueba todos los tipos, valores predeterminados o restricciones.** No importes un esquema de cinco tablas sobre esta versión. En Workbench, selecciona la base correcta y ejecuta `database/verify-schema.sql` para inspeccionarla sin cambiar registros.

## Probar cliente y administrador

En `POST /sessions`, usa el correo y contraseña configurados para el administrador o cliente. Copia únicamente `data.accessToken`, pulsa **Authorize** y pégalo sin comillas. Swagger añade `Bearer`.

- El administrador administra clases y paquetes, registra asistencia, gestiona estados de cuentas y consulta ventas.
- El cliente compra paquetes, reserva clases, consulta su historial/progreso, registra marcas personales y escribe reseñas de clases a las que asistió.
- Una reserva pasa de `reserved` a `attended` o `no_show` después de terminar la clase. El cliente no confirma su propia asistencia.
- Las compras guardan el precio que decide el servidor. Un paquete comprado queda protegido; una clase con reservas no se modifica ni se elimina.

Importa `evidence/FitPulse.postman_collection.json` en Postman, configura sus cinco variables y ejecuta las carpetas en orden. Incluye 76 solicitudes y 149 comprobaciones. Consulta [las pruebas y su alcance](docs/pruebas.md) para repetirlas.

## Verificaciones automáticas

Configura `TEST_DB_NAME` con una base desechable distinta de `DB_NAME`, terminada en `_test`. Debe existir y la cuenta MySQL debe tener permisos para crear tablas. El comprobador adicional crea y elimina únicamente una base temporal propia; necesita permisos de creación de bases.

```sh
npm run test:passwords
npm run test:progress
npm run test:schema
npm test
npm run test:credential-tools
npm run db:inspect
```

`npm test` incorpora datos ficticios en `TEST_DB_NAME`, genera respuestas con credenciales ocultas y verifica éxito/error de las 35 operaciones. No uses una base con información que quieras conservar. `db:inspect` solo lee la base indicada en `DB_NAME` y exporta sus metadatos.

## Organización

| Ruta | Contenido |
| --- | --- |
| `database/` | Esquema canónico e inspección SQL |
| `src/routes`, `controllers`, `services`, `repositories` | Rutas, HTTP, reglas de negocio y SQL |
| `src/config`, `middleware`, `utils` | Conexión, configuración y controles comunes |
| `public/` | Dos páginas HTML con acceso, progreso y CRUD de marcas, CSS y JavaScript compartidos |
| `docs/third-cut/` | Autenticación, interfaz y fragmentos LaTeX de la evolución actual |
| `docs/openapi.json` | Contrato navegable de las 35 operaciones |
| `docs/informe/` | Cinco bloques LaTeX de Laura, diagramas y PDF compilado |
| `docs/trazabilidad.csv` | RF → historia → tabla → endpoint → petición Postman exacta |
| `docs/entrega-laura.md` | Cobertura de la asignación y pendientes de integración |
| `evidence/` | Colección ejecutable y resultados reales de las pruebas |
| `tests/` | Integración HTTP y detección de esquemas incompatibles |

## Alcance verificado y límites

Las reservas y las marcas personales tienen tablas propias. La asistencia se mantiene al eliminar una reseña; el progreso se calcula sobre asistencia, no sobre compras o reseñas. Los cupos se controlan en una transacción. No existe cancelación de reservas ni consumo automático de créditos de paquetes.

La versión actual incorpora Argon2id con salt independiente, migración de contraseñas y las dos páginas de Laura: progreso y marcas personales. Se conservan las siete tablas y las 35 operaciones de negocio. Las páginas usan datos reales de la API y permiten registro e inicio de sesión mediante un diálogo compartido. El catálogo, las compras, las reservas y el panel administrativo no tienen todavía sus propias pantallas web en este repositorio. RF-11 conserva sus permisos de backend.

La interfaz se adaptó a las capturas del prototipo aportadas por la usuaria: encabezado amarillo, menú negro, tarjetas claras, calendario semanal, gráfico circular y resumen de marcas. El acceso tiene fondo de gimnasio, tarjeta blanca y confirmación de contraseña. Se comparó visualmente con esas capturas; no se pudo inspeccionar directamente el archivo editable de Figma. Los archivos en `docs/informe/` corresponden a la revisión histórica del segundo corte; la etapa actual está documentada en `docs/third-cut/`. La migración debe ejecutarse en cada instalación existente: el código publicado no modifica por sí solo tu base local.

Para usar las páginas, inicia sesión con la cuenta de cliente preparada por `db:demo`, o crea una cuenta nueva. Una cuenta sin asistencia confirmada muestra cero clases; esto es correcto. Sigue [el recorrido de la interfaz](docs/third-cut/web-pages.md) para probar las pantallas y preparar una asistencia de demostración.
