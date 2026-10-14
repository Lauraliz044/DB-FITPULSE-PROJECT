## Alcance

Se cubren RF-01 a RF-15 y los roles client/admin. Para cumplirlos se recuperan reservations y personal_records: el modelo reducido de cinco tablas no permitía reservar, distinguir reservas/asistencias ni guardar marcas personales. Se conservan las conexiones directas de reviews con users y scheduled_classes.

Hay siete tablas, 49 columnas y siete FK. Se agregan capacity, starts_at, ends_at y description en scheduled_classes, description en packages e intensity en reviews, porque esos datos están en los recursos o requisitos del primer corte. Cada reseña requiere una reserva attended del usuario autenticado. La asistencia se conserva aunque se borre la reseña. La racha usa starts_at de las clases tomadas; no se duplica ese horario dentro de reservations.

La guía del segundo corte exige password en texto plano. Se implementa esa excepción académica y se documenta su diferencia con RNF-01 del primer corte. No se afirma que Argon2id esté implementado. Los controles de rol, cuenta activa y bloqueo por cinco intentos durante quince minutos sí se mantienen. Las condiciones de interfaz corresponden al tercer corte.

El SQL recibido mezclaba doce tablas antiguas/nuevas. Este proyecto usa exclusivamente el esquema inglés incluido, en una base separada. No importa el dump antiguo, no borra tus tablas ni migra automáticamente sus datos.

