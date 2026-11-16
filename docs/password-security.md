# Contraseñas y sesiones

El registro, el login y los comandos de cuentas usan Argon2id en el servidor. La tabla `users` conserva su estructura: `password` almacena la cadena codificada, que incluye versión, parámetros, salt y hash. No se añade una octava tabla ni se guarda un salt fijo en configuración.

| Parámetro | Valor implementado |
| --- | --- |
| Algoritmo | Argon2id |
| Memoria | 19 456 KiB, equivalentes a 19 MiB |
| Iteraciones | 2 |
| Paralelismo | 1 |
| Resultado del hash | 32 bytes |
| Salt | Aleatorio de 16 bytes, generado por `node-argon2` para cada operación |

La política vive en `src/config/password-policy.js`. El módulo `src/utils/passwords.js` delega el hash y su verificación a la biblioteca; no utiliza SHA-256 directo, cifrado reversible ni comparación de contraseñas en texto plano. La configuración sigue la recomendación mínima de [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); la API de la biblioteca está documentada en [node-argon2](https://github.com/ranisalt/node-argon2).

## Registro y login

`POST /users` valida los datos, calcula el hash y después lo inserta. El rol público sigue siendo `client`. Las respuestas de registro, perfil y sesión no incluyen la contraseña ni su hash. `POST /sessions` verifica la contraseña completa contra la cadena almacenada. Se mantienen el estado activo de la cuenta y el bloqueo tras cinco intentos fallidos durante quince minutos.

Las cuentas cuyo valor aún sea texto plano no pueden iniciar sesión con el código actualizado; requieren migración. No se agregó una comparación alternativa de texto plano. Las cuatro pruebas unitarias comprueban salts diferentes para la misma contraseña, verificación completa de caracteres Unicode, rechazo de cadenas inválidas y rechazo del hash utilizado como contraseña.

## Migrar una instalación existente

1. Detén la API y guarda una copia privada de la base.
2. Revisa `DB_NAME` en `.env`: debe señalar tu base de **siete tablas**.
3. Ejecuta `npm ci` y `npm run db:setup` para comprobar la conexión y el esquema.
4. Ejecuta `npm run db:migrate-passwords`.
5. Revisa el resumen: `inspected`, `migrated`, `alreadyHashed`. Nunca imprime contraseñas ni hashes.
6. Ejecuta `npm start` y prueba el login con la contraseña original.

La migración recorre las cuentas dentro de una transacción y bloquea las filas que va a actualizar. Conserva los identificadores, roles, estados y demás datos; cambia únicamente la contraseña almacenada. Reconoce los hashes Argon2id existentes y los conserva, por lo que una segunda ejecución debe reportar `migrated: 0`. Un fallo revierte la transacción completa. La prueba de comandos simula ese fallo y comprueba la reversión en MySQL.

Una base nueva recibe hashes desde el registro, `db:seed` y `db:demo`. En esa base, ejecutar la migración antes de crear las cuentas es válido y no convierte ningún registro.

## Verificar en tu computador

```sh
npm run test:passwords
npm run test:schema
npm test
npm run test:credential-tools
```

Las pruebas con MySQL requieren una base exclusiva cuyo nombre termine en `_test`, configurada en `TEST_DB_NAME`. `test:credential-tools` necesita las tablas ya preparadas por `npm test` y valores válidos de las cuentas de demostración en el entorno.

Para una revisión visual, selecciona la base correcta en Workbench y ejecuta `database/verify-password-storage.sql`. La consulta muestra el prefijo esperado y el salt codificado sin mostrar contraseñas en texto plano. Es una ayuda de inspección: el prefijo por sí solo no demuestra que un hash sea válido. La prueba decisiva es la verificación de contraseña que realizan el login y las pruebas automatizadas. Dos cuentas de prueba con la misma contraseña deben tener salts diferentes.

La ejecución del código aquí no migra la base que tienes en tu computador. Ese paso debe repetirse en cada instalación existente.

## Sesión web

Las páginas obtienen un JWT mediante `POST /sessions` y lo conservan en `sessionStorage` durante la sesión de la pestaña. No almacenan la contraseña. Al cargar cada página se consulta el perfil actual; una sesión inválida o una cuenta desactivada retiran el acceso y devuelven al inicio de sesión.

`sessionStorage` es accesible para JavaScript del mismo origen: una vulnerabilidad XSS podría exponer el token. Por eso los datos de usuarios se insertan como texto y no como HTML, y la API sirve las páginas con una política de seguridad de contenido que solo admite scripts, estilos, fuentes e imágenes del mismo origen. El JWT no se revoca individualmente al cerrar sesión: el cierre elimina la copia local y el token vence según `JWT_EXPIRES_IN`. Un despliegue público necesita HTTPS.

## Mejora propuesta

El hash protege las contraseñas almacenadas, pero no impide que alguien use una contraseña obtenida fuera del sistema. Como siguiente paso se propone un segundo factor de autenticación con WebAuthn para la cuenta de administrador, siguiendo [OWASP Multifactor Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html). Requiere definir el registro del autenticador, la recuperación de la cuenta y pruebas propias, por lo que queda fuera del alcance de esta versión.
