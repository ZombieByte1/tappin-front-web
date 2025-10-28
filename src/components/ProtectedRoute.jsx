import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logger from '../utils/logger'

/**
 * Componente para proteger rutas que requieren autenticación
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth()

  logger.debug('ProtectedRoute - isAuthenticated:', isAuthenticated)
  logger.debug('ProtectedRoute - user:', user)
  logger.debug('ProtectedRoute - allowedRoles:', allowedRoles)
  logger.debug('ProtectedRoute - user?.role:', user?.role)

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    logger.warn('No autenticado - redirigiendo a login')
    return <Navigate to="/" replace />
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      logger.warn('Rol no permitido - redirigiendo a /unauthorized')
      // Redirigir a página no autorizada o al dashboard por defecto
      return <Navigate to="/unauthorized" replace />
    }
  }

  logger.debug('Acceso permitido')
  return children
}

export default ProtectedRoute
