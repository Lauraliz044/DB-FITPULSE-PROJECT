# FitPulse

Plataforma web para un gimnasio: los clientes compran paquetes, reservan clases, califican las clases a las que asistieron y consultan su progreso; el administrador gestiona clases, cuentas, asistencia y ventas.

La aplicación tiene dos partes que se ejecutan juntas desde el mismo servidor:

- **API REST** en Node.js 22 y Express, conectada a MySQL 8. El esquema tiene **7 tablas, 49 columnas, 7 claves foráneas y 35 operaciones HTTP**.
- **Interfaz web** en HTML, CSS y JavaScript sin frameworks (`public/`), con 12 pantallas que consumen la API.

Las contraseñas se almacenan con **Argon2id** y un salt aleatorio por cuenta. Consulta [contraseñas y sesiones](docs/password-security.md).

## Instalar y ejecutar

Requisitos: Node.js 22 o superior y MySQL 8.0.16 o superior en ejecución.

1. Abre la raíz del repositorio, donde está `package.json`, en Visual Studio Code.
2. Ejecuta `npm ci`.
3. Copia `.env.example` como `.env`. En PowerShell: `Copy-Item .env.example .env`; en Linux: `cp .env.example .env`.
4. En `.env`, configura la conexión MySQL (`DB_USER`, `DB_PASSWORD`, `DB_NAME`), las contraseñas de las cuentas de demostración y un `JWT_SECRET` aleatorio de al menos 32 caracteres. Si una contraseña contiene `#` o espacios, escríbela entre comillas dobles. **No publiques `.env`.**
5. Ejecuta:

```sh
npm run db:setup
npm run db:migrate-passwords
npm run db:seed
npm run db:demo
npm start
```

6. Abre la dirección `FitPulse web` que muestra la consola. Con la configuración de ejemplo es <http://localhost:5000>.

| Comando | Qué hace |
| --- | --- |
| `db:setup` | Crea la base y las siete tablas |
| `db:migrate-passwords` | Convierte a Argon2id las contraseñas que aún estén en texto plano; en una base nueva informa `migrated: 0` |
| `db:seed` | Crea el administrador y paquetes de ejemplo |
| `db:demo` | Crea un cliente de demostración y una clase terminada con su reserva, para probar asistencia y reseñas |

La documentación de la API está en <http://localhost:5000/docs> (Swagger UI) y en <http://localhost:5000/openapi.json>.

### Migrar una base existente

Si ya tienes una base con contraseñas en texto plano, detén la API, guarda una copia y revisa `DB_NAME`. Después ejecuta `npm run db:migrate-passwords`. El comando trabaja en una transacción, conserva identificadores y datos, y solo reemplaza la contraseña almacenada; una segunda ejecución informa `migrated: 0`. Para inspeccionar el resultado en MySQL Workbench, ejecuta `database/verify-password-storage.sql` sobre la base correcta.

El arranque comprueba que el esquema tenga las tablas y columnas esperadas. Para inspeccionar una base sin modificarla, ejecuta `database/verify-schema.sql` en Workbench.

## Recorrer la interfaz web

Cuentas de demostración: `ADMIN_EMAIL` / `ADMIN_PASSWORD` y `DEMO_CLIENT_EMAIL` / `DEMO_CLIENT_PASSWORD` del archivo `.env`.

| Actor | Pantalla | Archivo |
| --- | --- | --- |
| Público | Inicio de sesión y registro | `login.html`, `register.html` |
| Cliente | Inicio, catálogo de clases, reservas, reseñas, paquetes, progreso y marcas personales | `home.html`, `catalog.html`, `reservations.html`, `reviews.html`, `packages.html`, `progress.html`, `personal-records.html` |
| Administrador | Ventas, gestión de clases y gestión de usuarios con registro de asistencia | `admin-sales.html`, `admin-classes.html`, `admin-users.html` |

Recorrido sugerido:

1. Como administrador, crea una clase futura en **Gestión de clases**. En **Gestión de usuarios**, abre **Ver asistencia** del cliente de demostración y marca **Asistió** en la clase terminada.
2. Como cliente, reserva la clase nueva en el **Catálogo**, compra un paquete, revisa **Reservas**, escribe una reseña de la clase a la que asististe y consulta **Mi progreso** y **Mis marcas**.
3. Como administrador, revisa la compra en **Ventas**.

Cada pantalla muestra un estado de carga mientras consulta la API, un mensaje de error cuando la API rechaza la operación y una confirmación cuando la operación se completa.

## Roles y reglas principales

- El administrador gestiona clases y paquetes, registra la asistencia, activa o desactiva cuentas y consulta ventas.
- El cliente compra paquetes, reserva clases, consulta su historial y progreso, registra marcas personales y reseña las clases a las que asistió.
- Una reserva pasa de `reserved` a `attended` o `no_show` cuando la clase ya terminó. El cliente no confirma su propia asistencia.
- Las compras guardan el precio que decide el servidor. Un paquete comprado y una clase con reservas no se modifican ni se eliminan.
- Tras cinco intentos fallidos de inicio de sesión, la cuenta se bloquea quince minutos.

## Verificaciones automáticas

Configura `TEST_DB_NAME` con una base desechable distinta de `DB_NAME`, cuyo nombre termine en `_test`, y créala antes de ejecutar las pruebas.

```sh
npm run test:passwords
npm run test:progress
npm run test:schema
npm test
npm run test:credential-tools
```

`npm test` crea datos ficticios en `TEST_DB_NAME`, prueba un caso de éxito y uno de error para las 35 operaciones y guarda el resultado en `evidence/test-results.json`. Para la colección de Postman, importa `evidence/FitPulse.postman_collection.json`, configura sus cinco variables y ejecuta las carpetas en orden: incluye 76 solicitudes y 149 comprobaciones. El detalle está en [pruebas](docs/pruebas.md).

## Organización

| Ruta | Contenido |
| --- | --- |
| `src/routes`, `src/controllers`, `src/services`, `src/repositories` | Rutas, manejo HTTP, reglas de negocio y consultas SQL |
| `src/config`, `src/middleware`, `src/utils` | Configuración, autenticación, validación y utilidades comunes |
| `public/` | Pantallas HTML, estilos (`css/`), módulos JavaScript (`js/`) y recursos (`assets/`) |
| `database/` | Esquema y consultas de inspección |
| `scripts/` | Creación del esquema, datos de demostración y migración de contraseñas |
| `tests/` | Pruebas de integración, contraseñas, progreso y compatibilidad del esquema |
| `docs/` | Contrato OpenAPI, contraseñas y sesiones, pruebas y trazabilidad de requerimientos |
| `evidence/` | Colección de Postman y resultados de las pruebas |
