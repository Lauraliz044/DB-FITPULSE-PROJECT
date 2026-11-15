# FitPulse de siete tablas: guía desde cero en Windows

Esta guía corresponde a `DB-FITPULSE-PROJECT`, rama **`fix/laura-segundo-corte-7-tablas`**. Incluye la autenticación con Argon2id y las páginas de Laura adaptadas a las capturas de Figma. Mientras el PR #1 siga abierto, descarga esa rama: `main` puede tener una versión anterior.

## 1. Prepara los programas

Necesitas Visual Studio Code, **Node.js 22**, un servidor **MySQL 8.0.16 o superior** y MySQL Workbench para inspeccionar los datos. Workbench es el cliente; el servicio MySQL también debe estar iniciado.

Abre una terminal nueva de VS Code y comprueba:

```powershell
node --version
npm --version
```

El primer comando debe comenzar por `v22.` si vas a repetir el entorno de esta revisión. Si instalaste Node con VS Code abierto y no reconoce el comando, cierra y vuelve a abrir VS Code. Descarga Node desde [su sitio oficial](https://nodejs.org/en/download).

## 2. Descarga la versión correcta y abre la carpeta

En GitHub abre [el repositorio](https://github.com/Lauraliz044/DB-FITPULSE-PROJECT), selecciona **`fix/laura-segundo-corte-7-tablas`** en el selector de ramas y pulsa **Code → Download ZIP**. Descomprime en una carpeta nueva para conservar tu copia anterior.

En VS Code elige **Archivo → Abrir carpeta** y selecciona la carpeta que contiene `package.json`, `src`, `public`, `database` y `tests`. Abre **Terminal → Nueva terminal**. Los comandos siguientes se ejecutan en esa raíz, no dentro de `public` ni de `src`.

Si ya usas Git, puedes clonar esa rama directamente:

```powershell
git clone --branch fix/laura-segundo-corte-7-tablas --single-branch https://github.com/Lauraliz044/DB-FITPULSE-PROJECT.git FitPulse_Laura_7_Tablas
cd FitPulse_Laura_7_Tablas
code .
```

## 3. Instala dependencias y configura tu entorno

```powershell
npm ci
Copy-Item .env.example .env
```

Ejecuta la copia solo si todavía no tienes `.env`; si ya existe, conserva sus valores y compáralos con `.env.example`.

Abre `.env` en VS Code. Configura estos valores con tus datos reales:

| Variable | Qué debes poner |
| --- | --- |
| `DB_HOST` | `127.0.0.1` para MySQL en el mismo computador |
| `DB_PORT` | El puerto de tu conexión; normalmente `3306` |
| `DB_USER` | El usuario MySQL, por ejemplo `root` en tu entorno local |
| `DB_PASSWORD` | La contraseña de ese usuario MySQL |
| `DB_NAME` | Tu base compatible de **siete tablas**, o `fitpulse_project_web` para empezar en una base nueva |
| `TEST_DB_NAME` | `fitpulse_project_web_test`; debe ser distinta de `DB_NAME` y usarse únicamente para pruebas desechables |
| `PORT` | `5000` |
| `BASE_URL` | `http://localhost:5000` |
| `API_PREFIX` | `/api/v1` |
| `BUSINESS_TIME_ZONE` | `America/Bogota` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Correo y contraseña del administrador de demostración |
| `DEMO_CLIENT_EMAIL`, `DEMO_CLIENT_PASSWORD` | Correo y contraseña del cliente de demostración |
| `ADMIN_NAME`, `DEMO_CLIENT_NAME` | Nombre de cada cuenta, máximo 45 caracteres |
| `JWT_SECRET` | Un valor aleatorio privado de al menos 32 caracteres |

Las contraseñas de las cuentas deben tener entre 8 y 200 caracteres. Usa correos distintos para administrador y cliente. Puedes generar el secreto JWT en tu terminal:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado a `JWT_SECRET`. Conserva `.env` en tu computador: no lo subas a GitHub ni lo incluyas en capturas. No necesitas inventar un salt: Argon2id lo genera de forma independiente al crear cada hash.

## 4. Prepara la base: elige tu caso

### Si vas a empezar en una base nueva

Con `DB_NAME=fitpulse_project_web` y el servicio MySQL iniciado:

```powershell
npm run db:setup
npm run db:migrate-passwords
npm run db:seed
npm run db:demo
```

`db:setup` crea la base y las siete tablas si no existen. Una base vacía puede mostrar cero cuentas inspeccionadas y migradas: es correcto. Los siguientes comandos crean administrador, paquetes, cliente y una reserva de una clase ya terminada. Las cuentas nuevas se guardan directamente con hash.

### Si vas a conservar tu base de siete tablas

1. Detén la API con `Ctrl+C` en la terminal donde corre.
2. En Workbench usa **Server → Data Export**, selecciona tu base y guarda una copia privada. Comprueba que la exportación terminó correctamente.
3. En `.env`, `DB_NAME` debe señalar esa base existente.
4. Ejecuta:

```powershell
npm run db:setup
npm run db:migrate-passwords
npm run db:migrate-passwords
```

El primer comando comprueba la compatibilidad; no convierte una base de cinco tablas. La migración cambia únicamente las contraseñas almacenadas y conserva cuentas, identificadores y demás registros. Su salida incluye:

| Campo | Significado |
| --- | --- |
| `inspected` | Cuentas revisadas |
| `migrated` | Contraseñas antiguas convertidas a hash |
| `alreadyHashed` | Cuentas que ya tenían hash y se conservaron |

La segunda ejecución debe mostrar **`migrated: 0`**. Si aparece un error de esquema, resuélvelo antes de continuar; no borres tablas para forzar el arranque. Si faltan las cuentas de demostración, ejecuta `npm run db:seed` y `npm run db:demo` después de migrar.

La contraseña que escribes para entrar sigue siendo la original. Cambiar `ADMIN_PASSWORD` o `DEMO_CLIENT_PASSWORD` en `.env` no restablece una cuenta ya existente: los comandos conservan esas cuentas.

## 5. Ejecuta las pruebas automáticas

En Workbench crea la base de pruebas que configuraste. Con el ejemplo anterior:

```sql
CREATE DATABASE IF NOT EXISTS fitpulse_project_web_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Esta base es desechable. Nunca pongas el nombre de tu base de trabajo en `TEST_DB_NAME`. El usuario MySQL debe poder crear tablas y, para `test:schema`, crear y eliminar una base temporal propia.

En la terminal de VS Code ejecuta, en este orden:

```powershell
npm run test:passwords
npm run test:progress
npm run test:schema
npm test
npm run test:credential-tools
```

| Comando | Qué comprueba | Resultado de referencia de esta revisión |
| --- | --- | --- |
| `test:passwords` | Hash, salts distintos, contraseña completa, rechazo de texto plano y del hash como contraseña | 4 pruebas aprobadas |
| `test:progress` | Calendario de lunes a domingo, cambio de año, navegación y porcentajes de categorías | 3 pruebas aprobadas |
| `test:schema` | Esquemas compatibles e incompatibles | 5 casos aprobados |
| `npm test` | API, roles, propiedad, asistencia, progreso y autenticación | `passed: true`, 123 casos HTTP y 299 comprobaciones |
| `test:credential-tools` | Cuentas con hash, migración repetible y reversión si falla | 7 casos aprobados |

`test:credential-tools` se ejecuta después de `npm test` porque necesita sus tablas de prueba. No necesitas dejar `npm start` abierto: las pruebas de integración levantan su propia instancia. En el informe de cobertura, **`"error": true` significa que también se probó un caso de rechazo**, no que la prueba falló. Revisa el resultado global `passed` y que el comando termine sin fallos.

## 6. Abre las páginas

```powershell
npm start
```

Mantén esa terminal abierta y visita:

- [Mi progreso](http://localhost:5000/progress.html).
- [Mis marcas personales](http://localhost:5000/personal-records.html).
- [Swagger](http://localhost:5000/docs/).

Las páginas las sirve Express junto con la API. Ábrelas por estas direcciones; abrir el HTML con doble clic o con Live Server usa otro origen y no ejecuta correctamente esta integración.

Pulsa **Iniciar sesión** y usa `DEMO_CLIENT_EMAIL` y su contraseña original. Para crear otra cuenta, selecciona **Crear cuenta**, completa nombre, correo, contraseña y confirmación. Si las contraseñas difieren, el formulario impide enviar el registro. El icono del ojo alterna la visibilidad de la contraseña.

## 7. Prueba las dos páginas

### Marcas personales

1. Entra como cliente y abre **Mis marcas → Nueva marca**.
2. Crea `Sentadilla de prueba`, tipo `Peso máximo`, resultado `40`, unidad `kg` y fecha de hoy.
3. Debe aparecer en la tabla con un mensaje de confirmación.
4. Edita esa marca a `45` y guarda. Debe mostrar `45 kg`.
5. En **Mi progreso**, comprueba que el resumen de marcas muestra ese registro reciente.
6. Regresa a marcas y elimínalo. La aplicación pide confirmación; **Conservar marca** cancela, **Eliminar marca** la elimina.

También puedes buscar un ejercicio, filtrar por tipo y ordenar. El gráfico de evolución compara únicamente el mismo ejercicio, tipo y unidad.

### Asistencia, racha y categorías

Una cuenta nueva muestra cero asistencias hasta que un administrador confirme una clase terminada. Una compra, reserva o reseña no equivale a asistencia.

Para probar con la reserva preparada por `db:demo`:

1. En Swagger ejecuta **`POST /sessions`** con `ADMIN_EMAIL` y la contraseña original del administrador.
2. Copia solo `data.accessToken`, sin comillas. Pulsa **Authorize**, pega el token sin añadir `Bearer`, confirma y cierra el diálogo.
3. Ejecuta **`GET /users`** para localizar el ID del cliente de demostración. No supongas que siempre es `1`.
4. Consulta **`GET /users/{userId}/reservations`** con ese ID y localiza la reserva de **Past Yoga**, cuya clase ya terminó. Usa el **ID de la reserva**, no el de la clase.
5. En **`PATCH /reservations/{id}/attendance`** envía:

```json
{
  "status": "attended"
}
```

6. En el HTML, mantén la cuenta del cliente y pulsa **Actualizar**. El total y las categorías deben incorporar esa asistencia. Navega a la semana anterior con **‹** si la clase no está en la semana actual.

El calendario marca en amarillo los días asistidos y enmarca el día actual. La racha se calcula en el servidor según semanas consecutivas; una clase antigua no garantiza una racha actual de una semana. El gráfico circular muestra el porcentaje de asistencias de cada categoría. Los porcentajes visibles pueden sumar 100,1 % o 99,9 % por redondeo.

La sesión de Swagger y la del HTML son independientes: autorizar como administrador en Swagger no cambia la cuenta del HTML. Las páginas de Laura son para progreso y marcas; el catálogo, las compras y el panel de administración siguen utilizándose por sus endpoints hasta integrar las pantallas del equipo.

## 8. Comprueba el hash y el salt en Workbench

Selecciona **la base de trabajo que pusiste en `DB_NAME`** y abre **File → Open SQL Script → `database/verify-password-storage.sql`** desde esta carpeta descargada. Ejecuta el script completo.

`argon2id_format` debe valer `1` en todas las cuentas y `credentials_without_argon2id_prefix` debe ser `0`. El campo `salt_base64` contiene el salt codificado. No se necesita una columna `salt` independiente: la cadena almacenada incluye algoritmo, parámetros, salt y hash.

Para una prueba manual adicional, registra dos cuentas de prueba distintas usando la misma contraseña elegida por ti. Los salts deben diferir y ambas cuentas deben poder iniciar sesión con esa contraseña. Esta inspección del formato complementa las pruebas de verificación: el prefijo por sí solo no demuestra que el hash sea válido. Nunca copies la cadena del hash como contraseña de acceso.

## 9. Revisa los commits y prepara la evidencia

Los commits son versiones del código. **No se ejecutan**: ejecutas los comandos y las páginas de esa versión. En [el PR #1](https://github.com/Lauraliz044/DB-FITPULSE-PROJECT/pull/1) abre **Commits** para revisar cada mensaje y los archivos que cambió. **Files changed** muestra el cambio completo. Si clonaste con Git:

```powershell
git branch --show-current
git log -8 --oneline
```

Si descargaste un ZIP, revisa el historial en GitHub: el ZIP no incluye `.git`. Guarda evidencia del resumen de las pruebas, inspección de salts, login válido e inválido, calendario, gráfico y creación/edición/eliminación de una marca. Evita mostrar `.env`, contraseñas o JWT.

El fragmento `docs/third-cut/laura-authentication.tex` explica expresamente la evolución: **la versión del corte 2 almacenaba texto plano; la actualización incorpora hash con salt**. Incorpóralo con su bibliografía al informe final del equipo. Preparar ese fragmento no significa que el PDF consolidado ya esté actualizado.

## 10. Si algo falla

| Mensaje o situación | Revisa |
| --- | --- |
| `Missing script` | Carpeta raíz y rama correctas; revisa `package.json` |
| `ECONNREFUSED` hacia MySQL | Servicio MySQL iniciado, host y puerto |
| `Access denied` | `DB_USER`, `DB_PASSWORD` y permisos de MySQL |
| `Unknown database` de pruebas | Creación de `TEST_DB_NAME` en Workbench |
| Error de esquema | Que la base sea la versión compatible de siete tablas |
| Login `401` tras actualizar una cuenta antigua | Ejecutar la migración en el `DB_NAME` correcto y usar su contraseña original |
| Login `423` | Bloqueo temporal por intentos fallidos; espera el plazo configurado |
| Puerto `5000` ocupado | Detén la otra instancia con `Ctrl+C` antes de arrancar otra |
| Página con cero asistencias | Es normal sin asistencias confirmadas; sigue el paso 7 |
| Estilos anteriores | Verifica la rama descargada y recarga con `Ctrl+F5` |

Esta revisión comprobó la interfaz en Chromium de escritorio y la API sobre MySQL con datos sintéticos. La adaptación CSS a pantallas pequeñas está implementada; falta comprobarla en tu tablet física.
