/**
 * Constantes globales de la aplicación
 */

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'El correo no es válido',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',
  NETWORK_ERROR: 'Error de conexión. Intenta nuevamente',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde'
}

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  SAVED: 'Guardado exitosamente'
}

// Tiempo de simulación para RFID scan (desarrollo)
export const RFID_SCAN_DELAY = 1500

