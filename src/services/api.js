import axios from 'axios'
import { logApiCall, logApiResponse, logError } from '../utils/logger'

// Configuración base de Axios con variables de entorno
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Interceptor para agregar headers de autenticación y logging
api.interceptors.request.use(
  (config) => {
    const apiKey = import.meta.env.VITE_API_KEY
    const headerName = import.meta.env.VITE_HEADER_NAME
    const authorization = import.meta.env.VITE_AUTHORIZATION

    // Agregar headers personalizados desde las variables de entorno
    if (apiKey && headerName) {
      config.headers[headerName] = apiKey
    }

    if (authorization) {
      config.headers['Authorization'] = authorization
    }

    // Obtener token del localStorage si existe
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // Si la API configurada es un túnel ngrok, pedirle que omita la advertencia del navegador
    // Esto ayuda a que peticiones programáticas reciban el proxied response en lugar de la página HTML de ngrok
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      if (apiUrl.includes('ngrok')) {
        config.headers['ngrok-skip-browser-warning'] = '1'
      }
    } catch (err) {
      // ignore import.meta issues in certain environments
    }

    // Log de la petición
    logApiCall(config.method.toUpperCase(), config.url, config.data)

    return config
  },
  (error) => {
    logError('Error en la configuración de la petición:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Detectar respuestas HTML (p. ej. página de ngrok) y rechazarlas con un mensaje claro
    const contentType = (response.headers && response.headers['content-type']) || ''
    const bodyIsString = typeof response.data === 'string'
    const bodyStartsWithHtml = bodyIsString && response.data.trim().startsWith('<')

    if (bodyStartsWithHtml || (contentType && contentType.includes('text/html'))) {
      // Registrar un snippet para depuración
      const snippet = bodyIsString ? response.data.slice(0, 1024) : '[non-string body]'
      logError(`[API HTML RESPONSE] ${response.config?.url} - status: ${response.status}`)
      logError('Content-Type:', contentType)
      logError('Body snippet:', snippet)

      const err = new Error('La API devolvió una página HTML en lugar de JSON. Esto suele ocurrir cuando el túnel (ngrok) muestra una página interstitial o la petición no llegó al backend. Revisa ngrok inspector http://127.0.0.1:4040 y la configuración del túnel (host-header).')
      // Attach original response for downstream handlers
      err.response = response
      return Promise.reject(err)
    }

    // Log de la respuesta exitosa normal
    logApiResponse(response.config.url, response.data)
    return response
  },
  (error) => {
    // Manejo centralizado de errores
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response
      const requestUrl = error.config?.url || ''

      logError(`Error ${status}:`, data?.message || 'Error desconocido')

      // Si la respuesta viene como HTML, registrar snippet útil
      const respContentType = (error.response.headers && error.response.headers['content-type']) || ''
      const respIsHtml = typeof data === 'string' && data.trim().startsWith('<')
      if (respContentType.includes('text/html') || respIsHtml) {
        const snippet = (typeof data === 'string') ? data.slice(0, 1024) : JSON.stringify(data).slice(0, 1024)
        logError('[API HTML ERROR RESPONSE] URL:', requestUrl, 'status:', status)
        logError('Content-Type:', respContentType)
        logError('Body snippet:', snippet)
      }

      // Si la petición es el login y devuelve 401, no forzamos redirect ni limpiamos
      // para que el componente `Login` pueda manejar y mostrar el mensaje apropiado.
      if (status === 401 && requestUrl.includes('/auth/login')) {
        logError('401 en /auth/login - dejando que Login maneje el error')
        return Promise.reject(error)
      }

      switch (status) {
        case 401:
          // No autorizado - limpiar sesión y redirigir al login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
          window.location.href = '/'
          break
        case 403:
          logError('Acceso prohibido')
          break
        case 404:
          logError('Recurso no encontrado')
          break
        case 500:
          logError('Error del servidor')
          break
        default:
          logError('Error:', data?.message || 'Error desconocido')
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      logError('No se recibió respuesta del servidor')
    } else {
      // Algo pasó al configurar la petición
      logError('Error al configurar la petición:', error.message)
    }

    return Promise.reject(error)
  }
)

// Funciones de API específicas

/**
 * Login de usuario
 * @param {Object} credentials - Objeto con email y password
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    
    // Guardar token si viene en la respuesta
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Logout de usuario
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout')
    
    // Limpiar datos locales
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    
    return response.data
  } catch (error) {
    // Limpiar datos locales incluso si falla la petición
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    throw error
  }
}

/**
 * Obtener perfil de usuario
 * @returns {Promise} - Promesa con los datos del usuario
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Obtener lista de recursos
 * @param {string} endpoint - Endpoint a consultar
 * @param {Object} params - Parámetros de query
 * @returns {Promise} - Promesa con los datos
 */
export const getData = async (endpoint, params = {}) => {
  try {
    const response = await api.get(endpoint, { params })
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Crear un nuevo recurso
 * @param {string} endpoint - Endpoint a consultar
 * @param {Object} data - Datos a enviar
 * @returns {Promise} - Promesa con la respuesta
 */
export const postData = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar un recurso
 * @param {string} endpoint - Endpoint a consultar
 * @param {Object} data - Datos a actualizar
 * @returns {Promise} - Promesa con la respuesta
 */
export const updateData = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Actualizar parcialmente un recurso
 * @param {string} endpoint - Endpoint a consultar
 * @param {Object} data - Datos a actualizar
 * @returns {Promise} - Promesa con la respuesta
 */
export const patchData = async (endpoint, data) => {
  try {
    const response = await api.patch(endpoint, data)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Eliminar un recurso
 * @param {string} endpoint - Endpoint a consultar
 * @returns {Promise} - Promesa con la respuesta
 */
export const deleteData = async (endpoint) => {
  try {
    const response = await api.delete(endpoint)
    return response.data
  } catch (error) {
    throw error
  }
}

export default api