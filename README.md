## Requisitos

- Node.js 22 o superior y npm.
- MySQL 8.0.16 o superior, o MySQL 8.4. Se usan CHECK, JSON e InnoDB.
- Una cuenta MySQL con permisos sobre `fitpulse` y `fitpulse_test`; debe poder crear las tablas. Para `db:setup`, también debe poder crear la base de datos o esta debe existir previamente.

## Instalación

Extraer el ZIP y abrir una terminal en su raíz, donde está `package.json`.

```bash
npm ci
```

Copiar `.env.example` como `.env`. En Windows puede usarse el explorador de archivos; en macOS/Linux:

```bash
cp .env.example .env
```

Editar DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD y JWT_SECRET. JWT_SECRET debe contener al menos 32 caracteres. ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD definen el administrador de demostración. No subir `.env` al repositorio.

```bash
npm run db:setup
npm run db:seed
npm start
```

La base de datos debe estar encendida antes de iniciar Node. `db:setup` crea tablas ausentes; no es una migración de un esquema anterior. Para el modelo nuevo se recomienda una base vacía. `db:seed` crea un administrador si su correo no existe y paquetes si el catálogo está vacío; no cambia el rol ni la contraseña de una cuenta existente. Los precios de muestra están expresados en COP.

API predeterminada: http://localhost:3000/api/v1. Swagger: http://localhost:3000/docs/. Especificación: http://localhost:3000/openapi.json. Los valores pueden cambiarse en `.env`.

## Primer recorrido

1. POST `/api/v1/sessions` con el correo y la contraseña ADMIN_EMAIL/ADMIN_PASSWORD.
2. Copiar `data.accessToken`; en Swagger, abrir Authorize y pegar solo el token.
3. Crear una clase futura con POST `/classes`; el horario debe incluir segundos y zona horaria.
4. Registrar un cliente con POST `/users`; iniciar su sesión con POST `/sessions` y usar su token.
5. Consultar paquetes, comprar con POST `/purchases` y reservar con POST `/reservations`.
6. Después de finalizar la clase, el administrador registra `attended` en PATCH `/reservations/{id}/attendance`. Solo entonces su propietario puede crear una reseña.

La consulta del catálogo devuelve clases programadas, incluidas las pasadas para consultar el historial; `starts_at` y `available_spots` permiten identificar cuáles se pueden reservar. El servidor impide reservar una clase que ya comenzó.

## Pruebas reproducibles

TEST_DB_NAME debe existir, terminar en `_test` y ser accesible por DB_USER. La prueba crea tablas ausentes y datos ficticios nuevos; no borra la base principal ni reinicia bases de datos. Crea un servidor temporal en un puerto libre y lo cierra al terminar.

```bash
npm test
```

`evidence/test-results.json` contiene el resultado real, solicitudes/respuestas y cobertura de éxito/error de las 35 operaciones. Se regenera en cada ejecución. La colección `docs/FitPulse.postman_collection.json` conserva estas solicitudes y respuestas como ejemplos importables en Postman. Fue exportada desde pruebas HTTP automatizadas de Node, no ejecutada originalmente en la interfaz de Postman. Sus IDs pertenecen a datos temporales de pruebas; no debe ejecutarse como una secuencia sobre la base principal. Para un recorrido reproducible completo usar `npm test`; para explorar manualmente configurar `baseUrl`, `accessToken` y `password`, crear los recursos y actualizar los IDs según sus respuestas. La colección preserva los ejemplos recibidos para inspección.

Los escenarios de asistencia pasada se preparan mediante SQL solo dentro de las pruebas. No existe un endpoint que permita a un cliente inventar una asistencia o reservar clases pasadas.

## Organización

`src/routes` define métodos, rutas y permisos. `src/controllers` conecta HTTP con servicios. `src/services` valida datos y reglas de negocio. `src/repositories` contiene SQL parametrizado. `src/config` administra configuración y conexiones. `src/middleware` centraliza autenticación y errores. `src/utils` contiene validaciones, fechas y controles compartidos. `database/schema.sql` define las siete tablas.

## Decisiones del corte

La guía del segundo corte exige contraseña en texto plano; se implementa esa excepción respecto a RNF-01 del primer informe. El registro público crea únicamente clientes. Se comprueban el rol y el estado actual de la cuenta en cada solicitud protegida. Cinco fallos de inicio de sesión bloquean la cuenta 15 minutos; los valores están en `.env`.

`reviews.reservation_id` es PK y FK, sin AUTO_INCREMENT. Rating se propone en escala 1 a 5 e intensidad opcional como low/moderate/high. Tags admite hasta diez textos de 40 caracteres, se normaliza a minúsculas y rechaza duplicados. Estos límites son decisiones de diseño explícitas. Los horarios se guardan en UTC; las semanas y los días comerciales usan America/Bogota. La racha cuenta semanas lunes-domingo y permite completar la semana actual antes de considerar rota la racha.

Las compras conservan `paid_price`; comprador, precio y fecha se asignan en el servidor. No se definieron pagos bancarios ni consumo/vencimiento de créditos en los RF originales. No se impone una regla de saldo inexistente. Compras y reservas mantienen su historial: no se exponen DELETE ni cambios de comprador/clase. El administrador registra asistencia. Los catálogos tienen CRUD; clases con reservas y paquetes comprados no pueden modificarse ni eliminarse. Usuarios se desactivan; no se borran. Reseñas y marcas personales sí admiten edición y eliminación por su autor.
