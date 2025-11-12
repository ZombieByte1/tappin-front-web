import { useState, useEffect, useRef } from 'react'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { useAuth } from '../../context/AuthContext'
import { getData, getAllTransactions, postData } from '../../services/api'
import { validateForm, isRequired, isValidEmail } from '../../utils/validation'
import logger from '../../utils/logger'

const SuperAdminDashboard = () => {
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const { user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const containerRef = useRef(null)
  const scrollKey = '/super-admin'

  // Estados para datos del backend
  const [stats, setStats] = useState({
    clients: 0,
    branches: 0,
    parents: 0,
    staff: 0,
    students: 0
  })
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Estados para el formulario de cliente
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tier: 'custom',
    max_students: ''
  })
  const [errors, setErrors] = useState({})

  // Función para mostrar notificación
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Función para cerrar notificación
  const closeToast = () => {
    setToast(null)
  }

  // Funciones para manejar el modal
  const handleAddClient = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      email: '',
      password: '',
      tier: 'custom',
      max_students: ''
    })
    setErrors({})
  }

  // Manejo de cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Si cambia el tier, actualizar max_students automáticamente
    if (name === 'tier') {
      let maxStudents = ''
      switch(value) {
        case 'Basico':
          maxStudents = '100'
          break
        case 'oro':
          maxStudents = '500'
          break
        case 'platino':
          maxStudents = '1000'
          break
        case 'custom':
          maxStudents = ''
          break
        default:
          maxStudents = ''
      }
      
      setFormData(prev => ({
        ...prev,
        tier: value,
        max_students: maxStudents
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validación del formulario
  const validateFormData = () => {
    const rules = {
      name: [
        { validator: isRequired, message: 'El nombre es requerido' }
      ],
      email: [
        { validator: isRequired, message: 'El email es requerido' },
        { validator: isValidEmail, message: 'El email no es válido' }
      ],
      password: [
        { validator: isRequired, message: 'La contraseña es requerida' },
        { 
          validator: (value) => value.length >= 6, 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        }
      ]
    }
    
    // Solo validar max_students si el tier es custom
    if (formData.tier === 'custom') {
      rules.max_students = [
        { validator: isRequired, message: 'El máximo de estudiantes es requerido' },
        { 
          validator: (value) => !isNaN(value) && parseInt(value) >= 0, 
          message: 'Debe ser un número válido mayor o igual a 0' 
        }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateFormData()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // Obtener super_admin_id del usuario en sesión
      const superAdminId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id
      
      if (!superAdminId) {
        throw new Error('ID de Super Admin no disponible')
      }
      
      // Determinar max_students según el tier
      let maxStudents = parseInt(formData.max_students)
      if (formData.tier === 'Basico') {
        maxStudents = 100
      } else if (formData.tier === 'oro') {
        maxStudents = 500
      } else if (formData.tier === 'platino') {
        maxStudents = 1000
      }
      
      // Preparar datos para el endpoint
      const clientData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        super_admin_id: superAdminId,
        tier: formData.tier,
        max_students: maxStudents
      }
      
      logger.info('Datos a enviar:', clientData)
      
      // Crear cliente
      const response = await postData('/client/', clientData)
      logger.info('Cliente creado exitosamente:', response)
      
      logger.event('CLIENT_ADDED', { name: formData.name, email: formData.email })
      
      // Recargar estadísticas
      const dashboardData = await getData('/dashboard/')
      setStats({
        clients: dashboardData.clients || 0,
        branches: dashboardData.branches || 0,
        parents: dashboardData.parents || 0,
        staff: dashboardData.staff || 0,
        students: dashboardData.students || 0
      })
      
      handleCloseModal()
      showToast('Cliente agregado exitosamente', 'success')
    } catch (error) {
      logger.error('Error al agregar cliente:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Error al agregar el cliente'
      showToast(errorMessage, 'error')
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar datos del backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener estadísticas del dashboard
        const dashboardData = await getData('/dashboard/')
        logger.info('Datos del dashboard cargados:', dashboardData)
        
        setStats({
          clients: dashboardData.clients || 0,
          branches: dashboardData.branches || 0,
          parents: dashboardData.parents || 0,
          staff: dashboardData.staff || 0,
          students: dashboardData.students || 0
        })

        // Obtener transacciones (limitar a 50 más recientes)
        const transactionsData = await getAllTransactions(50)
        logger.info('Transacciones cargadas:', transactionsData)
        setTransactions(transactionsData.data || [])

        logger.info('Datos de Super Admin cargados exitosamente')
      } catch (err) {
        logger.error('Error al cargar datos de Super Admin:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Restaurar scroll cuando el componente se monta
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const savedPosition = getScroll(scrollKey)
      container.scrollTop = savedPosition
    }
  }, [])

  // Detectar scroll para el efecto blur
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      saveScroll(scrollKey, container.scrollTop)
      setIsScrolled(container.scrollTop > 10)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="page-container min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Header con efecto blur */}
      <header 
        className={`sticky top-0 z-10 transition-all duration-300 ${
          isScrolled 
            ? 'bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-2xl shadow-lg border-b border-gray-200/50 dark:border-[#3a3a3c]/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img src={logoTappin} alt="Tappin Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" />
              <h1 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold truncate">
                Tappin - Super Admin
              </h1>
            </div>
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={openLogoutModal}
                className="bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-semibold px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-[13px] sm:text-sm md:text-[15px] shadow-sm hover:shadow-md flex items-center gap-2 group"
              >
                <span>Cerrar sesión</span>
                <svg 
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200 group-hover:translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 md:py-8 animate-slideIn">
        {/* Título y subtítulo */}
        <div className="mb-5 sm:mb-6 md:mb-8">
          <h2 className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm md:text-base">Información sobre todos los clientes y recursos</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 sm:mb-8 md:mb-10">
          {/* Clientes totales */}
          <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">Clientes totales</p>
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.clients}</p>
              </div>
            </div>
          </div>

          {/* Sucursales Totales */}
          <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">Sucursales Totales</p>
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.branches}</p>
              </div>
            </div>
          </div>

          {/* Padres y Staff registrados */}
          <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">Usuarios registrados</p>
              </div>
            </div>
            
            {/* Subdivisión de Padres y Staff */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Padres */}
              <div className="border-l-2 border-orange-500 pl-3">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Padres</p>
                <p className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-bold">{stats.parents.toLocaleString()}</p>
              </div>
              
              {/* Staff */}
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Staff</p>
                <p className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-bold">{stats.staff.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Estudiantes activos */}
          <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" 
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">Estudiantes activos</p>
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.students.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Transacciones */}
        <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#3a3a3c] overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-[#3a3a3c]">
            <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-bold">Transacciones Recientes</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">Últimas 50 transacciones del sistema</p>
          </div>

          {/* Tabla para desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#3a3a3c]">
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">ID</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">RFID</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Producto</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Monto</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No hay transacciones registradas
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-200 dark:border-[#3a3a3c] hover:bg-gray-50 dark:hover:bg-[#1b1c1e] transition-colors">
                      <td className="p-4 text-light-text dark:text-dark-text text-sm font-medium">#{transaction.id}</td>
                      <td className="p-4 text-light-text dark:text-dark-text text-sm">{transaction.rfid_used || 'N/A'}</td>
                      <td className="p-4 text-light-text dark:text-dark-text text-sm">{transaction.product || 'N/A'}</td>
                      <td className="p-4 text-primary font-semibold text-sm">${parseFloat(transaction.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                        {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cards para móvil/tablet */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-[#3a3a3c]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No hay transacciones registradas
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-[#1b1c1e] transition-colors">
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">ID Transacción</p>
                        <p className="text-light-text dark:text-dark-text text-sm font-medium">#{transaction.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Monto</p>
                        <p className="text-primary font-semibold text-base">${parseFloat(transaction.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">RFID</p>
                      <p className="text-light-text dark:text-dark-text text-sm">{transaction.rfid_used || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Producto</p>
                      <p className="text-light-text dark:text-dark-text text-sm">{transaction.product || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Fecha</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}

        {/* Botón flotante para agregar cliente */}
        <button
          onClick={handleAddClient}
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8 w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] rounded-full flex items-center justify-center transition-[transform,box-shadow,background-color,rotate] duration-300 hover:scale-110 active:scale-105 hover:rotate-90 z-50 shadow-lg hover:shadow-xl"
          aria-label="Agregar cliente"
        >
          <svg 
            className="w-7 h-7 sm:w-[30px] sm:h-[30px] md:w-8 md:h-8 text-black" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round"
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
      </main>

      {/* Modal para agregar cliente */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title="Crear Cliente"
      >
        <div className="space-y-5 sm:space-y-5 md:space-y-6">
          <p className="text-light-text-secondary dark:text-gray-400 text-[13px] sm:text-sm leading-relaxed">
            Rellene los campos para registrar un nuevo cliente
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo Nombre */}
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.name 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="name" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.name 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Nombre del Cliente
              </label>
              {errors.name && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.name}</p>
              )}
            </div>

            {/* Campo Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.email 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="email" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.email 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Email
              </label>
              {errors.email && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.password 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="password" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.password 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Contraseña
              </label>
              {errors.password && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Campo Tier */}
            <div className="relative">
              <select
                id="tier"
                name="tier"
                value={formData.tier}
                onChange={handleInputChange}
                className="peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="Basico">Básico</option>
                <option value="oro">Oro</option>
                <option value="platino">Platino</option>
                <option value="custom">Custom</option>
              </select>
              <label 
                htmlFor="tier" 
                className="absolute left-4 top-2 text-xs text-gray-400 transition-all duration-200 pointer-events-none"
              >
                Plan
              </label>
              {/* Icono de flecha para select */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Campo Máximo de Estudiantes */}
            <div className="relative">
              <input
                type="number"
                id="max_students"
                name="max_students"
                value={formData.max_students}
                onChange={handleInputChange}
                min="0"
                readOnly={formData.tier !== 'custom'}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  formData.tier !== 'custom' 
                    ? 'cursor-not-allowed opacity-60' 
                    : ''
                } ${
                  errors.max_students 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="max_students" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.max_students 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Máximo de Estudiantes
              </label>
              {formData.tier !== 'custom' && (
                <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs mt-1.5 ml-1">
                  Este valor se establece automáticamente según el plan seleccionado
                </p>
              )}
              {errors.max_students && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.max_students}</p>
              )}
            </div>

            {/* Error general */}
            {errors.submit && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2 sm:pt-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-100 dark:bg-[#2a2b2e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] text-light-text dark:text-dark-text font-medium rounded-lg transition-colors text-[13px] sm:text-sm md:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-semibold rounded-lg transition-colors text-[13px] sm:text-sm md:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creando...</span>
                  </>
                ) : (
                  'Crear Cliente'
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Modal Cerrar Sesión */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={confirmLogout}
      />
    </div>
  )
}

export default SuperAdminDashboard
