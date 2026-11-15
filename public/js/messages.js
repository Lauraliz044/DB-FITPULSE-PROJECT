const translations = {
  "Invalid credentials": "Correo o contraseña inválidos.",
  "Account is inactive":
    "Esta cuenta está desactivada. Contacta al administrador.",
  "Account is temporarily locked":
    "Tu cuenta está bloqueada temporalmente por intentos fallidos. Inténtalo más tarde.",
  "Invalid or expired token": "Tu sesión venció. Inicia sesión nuevamente.",
  "Invalid session": "Tu sesión ya no es válida. Inicia sesión nuevamente.",
  "Access denied": "Tu cuenta no tiene permiso para realizar esta operación.",
  "Administrator access is required":
    "Solo el administrador puede realizar esta operación.",
  "Client access is required":
    "Solo una cuenta de cliente puede realizar esta operación.",
  "The email is already registered": "Este correo ya está registrado.",
  "The resource already exists": "Ya existe un registro con estos datos.",
  "Personal record not found": "Esta marca ya no existe. Actualiza la lista.",
  "achievedOn cannot be in the future":
    "La fecha de la marca no puede ser futura.",
  "value has an invalid value or decimal precision":
    "Escribe un resultado positivo con un máximo de tres decimales.",
  "price has an invalid value or decimal precision":
    "Escribe un precio válido, mayor o igual a cero.",
  "password must contain between 8 and 200 characters":
    "La contraseña debe tener entre 8 y 200 caracteres.",
  "Invalid email": "Escribe un correo electrónico válido.",
  "startsAt must be in the future":
    "La fecha y hora de inicio deben ser futuras.",
  "endsAt must be after startsAt":
    "La hora de fin debe ser posterior a la hora de inicio.",
  "The class is full":
    "No hay más cupos para esta clase, inténtalo con otra o inténtalo más tarde.",
  "The class is already reserved by this user":
    "Ya tienes una reserva para esta clase.",
  "The class has already started": "Esta clase ya comenzó. Elige otra.",
  "Class not found": "Esta clase ya no existe. Actualiza el catálogo.",
  "Package not found": "Este paquete ya no existe. Actualiza la lista.",
  "User not found": "Este usuario ya no existe. Actualiza la lista.",
  "The class has not ended":
    "La clase todavía no ha terminado. Registra la asistencia cuando finalice.",
  "Attendance has already been recorded":
    "La asistencia de esta reserva ya fue registrada.",
  "Reservation not found": "Esta reserva ya no existe. Actualiza la lista.",
  "Only classes attended by this user can be reviewed":
    "Solo puedes reseñar clases a las que asististe.",
  "This user already reviewed the class": "Ya reseñaste esta clase.",
  "rating must be an integer between 1 and 5":
    "Elige una calificación de 1 a 5 estrellas.",
  "tags must be an array of at most 10 strings":
    "Puedes agregar como máximo 10 etiquetas.",
  "Internal server error":
    "El servidor no pudo completar la operación. Inténtalo nuevamente.",
};

const fieldLabels = {
  name: "El nombre",
  exercise: "El ejercicio",
  recordType: "El tipo de marca",
  unit: "La unidad",
  category: "La categoría",
  instructorName: "El instructor",
  description: "La descripción",
  comment: "El comentario",
  tag: "Cada etiqueta",
};

const textFieldPattern =
  /^(\w+) must be nonempty text of at most (\d+) characters$/;
const integerFieldPattern = /^capacity must be an integer between (\d+) and/;

const unexpectedError =
  "Ocurrió un problema al mostrar la información. Recarga la página e inténtalo de nuevo.";

export function errorMessage(error) {
  if (error instanceof TypeError) return unexpectedError;
  const textField = textFieldPattern.exec(error.message);
  if (textField && fieldLabels[textField[1]])
    return `${fieldLabels[textField[1]]} no puede quedar vacío ni superar ${textField[2]} caracteres.`;
  const integerField = integerFieldPattern.exec(error.message);
  if (integerField)
    return `Los cupos deben ser un número entero desde ${integerField[1]}.`;
  return translations[error.message] || error.message;
}
