import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook personalizado para manejar la lógica de logout
 * @returns {Object} - Objeto con estado y funciones para manejar logout
 */
export const useLogout = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const navigate = useNavigate()

  /**
   * Abre el modal de confirmación de logout
   */
  const openLogoutModal = () => {
    setIsLogoutModalOpen(true)
  }

  /**
   * Cierra el modal de confirmación de logout
   */
  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  /**
   * Confirma el logout, limpia localStorage y redirige al login
   */
  const confirmLogout = () => {
    closeLogoutModal()
    
    // Limpiar datos de sesión
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    
    // Redirigir al login
    navigate('/')
  }

  return {
    isLogoutModalOpen,
    openLogoutModal,
    closeLogoutModal,
    confirmLogout
  }
}
