# Entrega de Laura · siete tablas

> Esta matriz conserva el estado de la revisión del segundo corte. La evolución posterior con Argon2id y las dos páginas HTML está implementada y documentada en `docs/third-cut/`; sustituye el estado pendiente de autenticación indicado en esta revisión histórica.

## Qué se preparó

Los cinco archivos de `docs/informe/secciones/` sustituyen únicamente los bloques asignados a Laura. `docs/informe/main.tex` es un documento independiente de revisión; no reemplaza el informe conjunto ni sus portadas, objetivos, requerimientos, normalización, prototipo, documentación o pruebas.

| Solicitud del plan de corrección | Resultado | Archivo o evidencia |
| --- | --- | --- |
| Reescribir las 18 historias sin cambiar sus códigos | 13 CO y 5 AO con rol, acción y beneficio | `03-historias.tex` |
| Explicar la decisión de siete tablas | Alternativa de cinco tablas descartada por RF-05, RF-06, RF-08, RF-09 y RF-10 | `07-modelo-er.tex` |
| Eliminar el diagrama reducido | Solo se presenta el modelo de siete tablas | `figuras/modelo/` |
| Corregir nombres y atributos del diagrama | Inglés, 49 columnas; `reviews.iduser`, `idclass`, `intensity`; bloqueo en `users` | `modelo-fisico.svg`, `evidence/model-metadata.json` |
| Relacionar recursos conceptuales y físicos | Tabla puente con categoría y etiquetas | `07-modelo-er.tex` |
| Revisar cardinalidades | Siete relaciones 1:0..N, FK obligatoria en cada hija | `07-modelo-er.tex` y metadatos |
| Completar trazabilidad | Los 15 RF enlazan historias, tablas, endpoints y nombres Postman exactos | `09-recursos-rest.tex`, `docs/trazabilidad.csv` |
| Justificar la arquitectura por diseño | Capas, controles comunes y transacciones | `10-arquitectura.tex` |
| Separar implementación y pruebas | Implementación muestra reglas y fragmentos; resultados en documento de pruebas | `11-implementacion.tex`, `docs/pruebas.md` |
| Entregar limitaciones a Gabi | Lista concreta con impacto | Sección siguiente |
| Commits descriptivos y raíz correcta | Cambios separados por esquema, documentación y pruebas, sin reescribir el historial | Rama `fix/laura-segundo-corte-7-tablas` |

El modelo físico fue generado con Graphviz desde los metadatos de una instancia MySQL real. **No es una captura de MySQL Workbench.** El plan pide regenerarlo con esa aplicación: para cumplir literalmente ese paso, abre Workbench, conecta la base creada con `schema.sql`, elige **Database → Reverse Engineer**, selecciona solo las siete tablas, ordena el diagrama y exporta la imagen. Comprueba que no agregue tablas antiguas. Conserva el mismo `\label{fig:modelo-laura}` al sustituir la figura. El diagrama entregado ya corrige los nombres y relaciones; no se atribuye a una herramienta que no se ejecutó.

## Limitaciones para integrar en el informe de Gabi

| Limitación | Motivo y efecto |
| --- | --- |
| RNF-01 pendiente | Las contraseñas siguen en texto plano en esta versión histórica; no se afirma almacenamiento seguro. |
| Nombres de FK no uniformes | Se conservan identificadores existentes (`idusers`, `user_id`, `iduser`); el diagrama y el SQL los muestran tal como están para evitar documentación falsa. |
| Etiquetas como JSON | No hay catálogo central ni FK por etiqueta; se valida su contenido en el servicio. Es una decisión deliberada, sin afirmar 3FN estricta de ese atributo multivaluado. |
| Pruebas de carga locales | Cada medición usa 50 peticiones simultáneas con un mismo token y datos ficticios; no demuestra 50 usuarios distintos ni carga sostenida. RNF-04 requiere otra validación. |
| Panel visual no implementado | RF-11 tiene permisos de backend comprobados, pero no una pantalla funcional en este repositorio. |
| Compras y reservas independientes | La reserva controla cupo y horario; no descuenta créditos de una compra. No hay cancelación de reservas. |
| Marcas personales registradas | Se conserva el historial; no se calcula el mejor valor entre unidades o tipos diferentes. |
| Comprobador de esquema acotado | Detecta tablas/columnas ausentes, IDs sin autoincremento y columnas extra obligatorias; no compara todos los tipos, defaults, índices o restricciones. No migra datos. |

## Integración en el LaTeX conjunto

1. Copia los cinco archivos de `secciones/` y `figuras/modelo/` manteniendo las rutas relativas.
2. Integra sus `\input` en las posiciones III, VIII, X, XI y XII del documento general; la numeración independiente I–V de este PDF cambiará automáticamente.
3. Añade las cuatro entradas de `referencias-laura.bib` a la bibliografía común, resolviendo claves duplicadas. Usa `\bibliographystyle{IEEEtran}` y ejecuta BibTeX. Las fuentes sin fecha de publicación indican `s. f.` y su fecha de consulta.
4. El preámbulo necesita `array`, `booktabs`, `graphicx`, `listings`, `url` e `hyperref`; los ejemplos de configuración están en `main.tex`. Conserva “Tabla” y las referencias con `\label`/`\ref`.
5. Sofía debe incorporar la sección de normalización, resultados de pruebas, objetivos y datos verificados de afiliación. Gabi integra prototipo, Swagger y limitaciones. No se inventó la facultad ni se redactó su trabajo como si ya estuviera integrado.

Para compilar el documento independiente en Overleaf: sube la carpeta `docs/informe`, selecciona `main.tex`, usa pdfLaTeX y recompila. También puede compilarse con `pdflatex main.tex`, `bibtex main`, `pdflatex main.tex` dos veces en una instalación completa de TeX Live. El PDF de revisión se entrega como `main.pdf`.

## Revisión de rúbrica y penalizaciones

Se usaron el PDF de entrega del segundo corte y el plan `Correccionescortes1y2(1).pdf`. El plan registra una penalización previa de −4 por commits genéricos. La calculadora adjunta se titula **3er Corte** y asigna −6 a control de versiones: no se trasladó esa cifra al segundo corte ni se calculó una nota sin la rúbrica de puntuación completa.

Se revisaron los riesgos señalados: identificadores del backend en inglés, rutas basadas en recursos, código organizado por capas, validación de entradas, errores centralizados, dependencias usadas, configuración en entorno y ausencia de credenciales reales en los archivos nuevos. El repositorio conserva su raíz, sin una carpeta de proyecto anidada, y sigue público. Los commits históricos genéricos se conservan; los nuevos describen problema, cambio y validación. Esto aporta evidencia revisable, **no garantiza una calificación ni la ausencia de penalizaciones**.

No se presenta como realizada la integración final de las otras integrantes, la captura EER de Workbench, un video de demostración ni una publicación en YouTube. Esas evidencias no se inventan. El guion de pruebas de `docs/pruebas.md` permite preparar la demostración.
