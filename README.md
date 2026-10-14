# FitPulse - puntos 1 y 2

Versión completa del primer corte con funciones de JavaScript, Express y MySQL. Se mantienen las capas exigidas: rutas, controladores, servicios y repositorios. Los identificadores del código, tablas, columnas, rutas y mensajes internos están en inglés. La explicación está en español.

## Alcance

Se cubren RF-01 a RF-15 y los roles client/admin. Para cumplirlos se recuperan reservations y personal_records: el modelo reducido de cinco tablas no permitía reservar, distinguir reservas/asistencias ni guardar marcas personales. Se conservan las conexiones directas de reviews con users y scheduled_classes.

Hay siete tablas, 49 columnas y siete FK. Se agregan capacity, starts_at, ends_at y description en scheduled_classes, description en packages e intensity en reviews, porque esos datos están en los recursos o requisitos del primer corte. Cada reseña requiere una reserva attended del usuario autenticado. La asistencia se conserva aunque se borre la reseña. La racha usa starts_at de las clases tomadas; no se duplica ese horario dentro de reservations.

La guía del segundo corte exige password en texto plano. Se implementa esa excepción académica y se documenta su diferencia con RNF-01 del primer corte. No se afirma que Argon2id esté implementado. Los controles de rol, cuenta activa y bloqueo por cinco intentos durante quince minutos sí se mantienen. Las condiciones de interfaz corresponden al tercer corte.

El SQL recibido mezclaba doce tablas antiguas/nuevas. Este proyecto usa exclusivamente el esquema inglés incluido, en una base separada. No importa el dump antiguo, no borra tus tablas ni migra automáticamente sus datos.

## Instalación en Windows

Requisitos: Node.js 22 o superior y MySQL 8.0.16 o superior iniciado. Extrae el ZIP en una carpeta nueva y abre su raíz en VS Code, donde está package.json.

```powershell
npm ci
Copy-Item .env.example .env
```

Edita .env: DB_HOST, DB_PORT, DB_USER y DB_PASSWORD según tu MySQL. Completa JWT_SECRET con al menos 32 caracteres y ADMIN_PASSWORD con al menos ocho. Puedes reutilizar tus valores locales anteriores. Conserva estos nombres de base separados:

```dotenv
DB_NAME=fitpulse_project
TEST_DB_NAME=fitpulse_project_test
```

Si una contraseña contiene caracteres especiales, escríbela entre comillas dobles. El ZIP contiene solo .env.example con marcadores, no tus credenciales reales.

```powershell
npm run db:setup
npm run db:seed
npm start
```

API: http://localhost:5000/api/v1. Swagger: http://localhost:5000/docs. db:setup crea la base y el esquema; si encuentra tablas o columnas incompatibles, se detiene. db:seed crea el administrador y dos paquetes de ejemplo sin reemplazar una cuenta existente.

## Demostración sin esperar que termine una clase

Completa DEMO_CLIENT_NAME, DEMO_CLIENT_EMAIL y DEMO_CLIENT_PASSWORD en .env. Después ejecuta:

```powershell
npm run db:demo
```

Este script agrega un cliente, una clase ficticia pasada y una reserva reserved. Imprime los IDs reales. Son datos de demostración creados por SQL: no existe una ruta pública para reservar clases pasadas o inventar asistencia.

En Swagger:

1. Usa POST /sessions con ADMIN_EMAIL y ADMIN_PASSWORD; copia data.accessToken y pégalo en Authorize.
2. Marca la reserva de demostración mediante PATCH /reservations/{id}/attendance con {"status":"attended"}.
3. Inicia sesión como DEMO_CLIENT_EMAIL con su contraseña y sustituye el token de Authorize.
4. Crea POST /reviews con {"classId":ID_REAL_DE_LA_CLASE,"rating":5}. comment, intensity y tags son opcionales.
5. Consulta GET /users/{userId}/progress y las reservas con status=reserved o status=attended.
6. Crea una marca personal con POST /users/{userId}/personal-records.

Para mostrar ventas, consulta GET /packages, compra con POST /purchases y luego usa el token del administrador en GET /reports/sales y GET /purchases. Para mostrar control de cupo, crea una clase futura de capacity=1; registra dos clientes y comprueba que la segunda reserva recibe 409.

Los cuerpos de clase usan name, instructorName, category, startsAt, endsAt, capacity, price y description. Las fechas incluyen segundos y zona, por ejemplo 2030-10-14T10:00:00-05:00. Usa fechas futuras reales al presentar el proyecto. Las entradas JSON usan camelCase; las respuestas de recursos usan id y otros alias en snake_case.

## Modelo para Workbench

El diagrama nuevo está en docs/FitPulse_EER_complete.png y .svg. Para obtener un modelo .mwb actualizado: File → Import → Reverse Engineer MySQL Create Script, selecciona database/schema.sql y coloca las siete tablas en el EER. No reutilices el .mwb antiguo, que todavía representaba el modelo español.

## Verificación

Crea la base de pruebas separada en Workbench:

```sql
CREATE DATABASE IF NOT EXISTS fitpulse_project_test
  CHARACTER SET utf8mb4;
```

Concede acceso al DB_USER configurado y ejecuta npm test. TEST_DB_NAME debe terminar en _test. Se agregan datos ficticios; no se borra ni se reinicia la base principal.

La ejecución entregada pasó 274 comprobaciones y 115 casos HTTP en MySQL 8.0.46. Cada una de las 35 operaciones tiene un éxito y un error registrados. Los resultados están en evidence/test-results.json. Las pruebas incluyen roles, propiedad, bloqueo, reservas simultáneas, fechas, reseñas, progreso, ventas y restricciones SQL. Los tiempos corresponden al entorno local y datos ficticios; no demuestran capacidad de producción.

La colección docs/FitPulse.postman_collection.json se genera a partir de solicitudes HTTP reales de npm test. No se afirma que las pruebas se ejecutaron desde la interfaz de Postman. Sus IDs pertenecen a la base de pruebas; para demostrar manualmente se deben usar recursos y tokens creados en la base de demostración.

## Archivos para entregar y copiar

- docs/FitPulse_points_1_2_student.pdf: explicación seleccionable de los puntos 1 y 2.
- docs/FitPulse_points_1_2_student.txt: la misma explicación en texto.
- docs/FitPulse_complete_code.txt: código completo para copiar, organizado por archivo.
- docs/report_ieee/: informe del primer corte ampliado, fuente LaTeX y PDF compilado.
- database/schema.sql: esquema completo.
- docs/openapi.json: Swagger de las 35 operaciones, como apoyo al punto 3.
- evidence/test-results.json: evidencia automatizada real, como apoyo al punto 4.

GitHub público/accesible, documentación publicada y video son pasos externos de la entrega general. No se publicaron ni se inventaron enlaces. Para GitHub, sube el contenido de esta carpeta a la raíz del repositorio, sin .env ni node_modules, y usa commits descriptivos. Los puntos 3, 4 y 5 anotados para otros integrantes siguen requiriendo su revisión y presentación.
