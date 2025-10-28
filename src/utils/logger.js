/**
 * Sistema de logging para desarrollo y producción
 * En producción, NO se muestra nada en consola para máxima seguridad
 */

const isDevelopment = import.meta.env.MODE === 'development'
const isProduction = import.meta.env.MODE === 'production'

/**
 * Log de información general
 */
export const logInfo = (...args) => {
  if (isDevelopment) {
    console.log('[INFO]', ...args)
  }
}

/**
 * Log de advertencias
 */
export const logWarning = (...args) => {
  if (isDevelopment) {
    console.warn('[WARNING]', ...args)
  }
}

/**
 * Log de errores
 * En producción NO se muestran para evitar exponer información
 */
export const logError = (...args) => {
  if (isDevelopment) {
    console.error('[ERROR]', ...args)
  }
  
  // En producción, los errores se pueden enviar a un servicio de monitoreo
  // sin mostrarlos en consola (Sentry, LogRocket, etc.)
  if (isProduction) {
    // TODO: Enviar a servicio de monitoreo
  }
}

/**
 * Log de debug (solo en desarrollo)
 */
export const logDebug = (...args) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args)
  }
}

/**
 * Log de eventos de la aplicación
 */
export const logEvent = (eventName, eventData = {}) => {
  if (isDevelopment) {
    console.log(`[EVENT: ${eventName}]`, eventData)
  }
  
  // En producción, enviar eventos a analytics sin mostrar en consola
  if (isProduction) {
    // TODO: Enviar a analytics (Google Analytics, Mixpanel, etc.)
  }
}

/**
 * Log de llamadas API
 */
export const logApiCall = (method, endpoint, data = null) => {
  if (isDevelopment) {
    console.log(`[API ${method}]`, endpoint, data)
  }
}

/**
 * Log de respuestas API
 */
export const logApiResponse = (endpoint, response) => {
  if (isDevelopment) {
    console.log(`[API RESPONSE]`, endpoint, response)
  }
}

export default {
  info: logInfo,
  warning: logWarning,
  error: logError,
  debug: logDebug,
  event: logEvent,
  apiCall: logApiCall,
  apiResponse: logApiResponse
}
