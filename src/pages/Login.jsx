import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/api'
import { validateForm, isRequired, isValidEmail, isValidPassword } from '../utils/validation'
import { ERROR_MESSAGES } from '../constants'
import logger from '../utils/logger'
import logoTappin from '../assets/logoTappin.png'

const Login = () => {
  const navigate = useNavigate()
  const { login: setAuthUser } = useAuth()
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar solo el error del campo específico, NO el error general
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleValidation = () => {
    const rules = {
      correo: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD },
        { validator: isValidEmail, message: ERROR_MESSAGES.INVALID_EMAIL }
      ],
      contrasena: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Evitar propagación del evento
    
    if (!handleValidation()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    // Solo limpiar el error general al intentar login de nuevo
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.general
      return newErrors
    })

    try {
      // Llamada real al backend
      const response = await login({
        email: formData.correo,
        password: formData.contrasena
      })

      logger.event('LOGIN_SUCCESS', { 
        email: formData.correo, 
        rol: response.rol,
        id: response.id 
      })

      // El token ya se guarda automáticamente en la función login() del servicio
      // Normalizar y guardar información adicional del usuario en localStorage
      const userData = {
        id: response.id,
        // Backend devuelve 'rol' en español; crear also 'role' para compatibilidad
        rol: response.rol || response.role,
        role: response.rol || response.role,
        email: formData.correo,
        // Si el backend devuelve nombre, úsalo, sino vacío
        name: response.name || response.user?.name || ''
      }

      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      // Guardar usuario en contexto de autenticación
      setAuthUser(userData)

      // Redirigir según el rol del usuario
      const dashboardRoutes = {
        super_admin: '/super-admin',
        client_admin: '/client-admin',
        branch: '/branch',
        parent: '/parent'
      }

      const route = dashboardRoutes[response.rol] || '/parent'
      navigate(route)
      
    } catch (error) {
      logger.error('Login failed:', error)
      
      // Mostrar error al usuario
      let errorMessage = ''
      if (error.response?.status === 401) {
        errorMessage = 'Credenciales incorrectas'
      } else if (error.response?.status === 404) {
        errorMessage = 'Usuario no encontrado'
      } else {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR || 'Error al conectar con el servidor'
      }

      setErrors({ general: errorMessage })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center px-5 sm:px-6 md:px-8 transition-colors duration-200">
      <div className="w-full max-w-[360px] sm:max-w-[400px] md:max-w-[440px] bg-light-bg dark:bg-dark-bg rounded-2xl sm:rounded-[20px] px-5 sm:px-7 md:px-8 py-7 sm:py-9 md:py-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-200">
        {/* Logo y Título */}
        <div className="text-center mb-7 sm:mb-8 md:mb-10">
          <div className="flex justify-center items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6 md:mb-8">
            <img 
              src={logoTappin} 
              alt="Tappin Logo" 
              className="w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 object-contain"
            />
            <h1 className="text-light-text dark:text-dark-text text-2xl sm:text-[28px] md:text-3xl font-bold transition-colors duration-200">Tappin</h1>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-5 sm:space-y-5 md:space-y-6">
          <h2 className="text-light-text dark:text-dark-text text-[19px] sm:text-[21px] md:text-2xl font-semibold text-center mb-5 sm:mb-6 md:mb-8 transition-colors duration-200">
            Inicia Sesión
          </h2>

          {/* Error general */}
          {errors.general && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo Correo */}
            <div className="relative">
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all peer ${
                  errors.correo 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="correo" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.correo 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Correo
              </label>
              {errors.correo && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.correo}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                className={`w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all peer ${
                  errors.contrasena 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="contrasena" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.contrasena
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[18px] text-gray-400 hover:text-white transition-colors z-10 p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg className="w-[22px] h-[22px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-[22px] h-[22px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.23 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {errors.contrasena && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.contrasena}</p>
              )}
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-3.5 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-5 sm:mt-6 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </>
              ) : (
                'Ingresa'
              )}
            </button>

            {/* Recuperar contraseña */}
            <div className="text-center mt-4 sm:mt-5">
              <p className="text-light-text-secondary dark:text-gray-400 text-[13px] sm:text-sm transition-colors duration-200 leading-relaxed">
                Olvidaste tu contraseña?{' '}
                <button
                  type="button"
                  onClick={() => logger.info('Recuperar contraseña - funcionalidad pendiente')}
                  className="text-[#FDB913] hover:text-[#fcc000] font-semibold transition-colors"
                >
                  Recupérala aquí
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
