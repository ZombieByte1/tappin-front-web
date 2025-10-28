import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Inicializar desde localStorage si existe
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {
      return null
    }
  })()

  // Normalizar user shape
  const normalizeUser = (u) => {
    if (!u) return null
    return {
      id: u.id || u._id || null,
      role: u.role || u.rol || null,
      rol: u.rol || u.role || null,
      name: u.name || u.nombre || '',
      email: u.email || ''
    }
  }

  const token = localStorage.getItem('token')
  const [user, setUser] = useState(normalizeUser(storedUser))
  // Consider authenticated if there is a valid token in storage
  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

  // Roles disponibles
  const ROLES = {
    SUPER_ADMIN: 'super_admin',
    BRANCH: 'branch',
    CLIENT_ADMIN: 'client_admin',
    PARENT: 'parent'
  }

  const login = (userData) => {
    const normalized = normalizeUser(userData)
    setUser(normalized)
    setIsAuthenticated(true)
    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(normalized))
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('token')
  }

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role
  }

  // Verificar si el usuario tiene uno de varios roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    ROLES
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
