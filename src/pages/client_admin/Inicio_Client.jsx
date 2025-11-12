import { useState, useEffect, useRef } from 'react'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { getData, postData, patchData, updateData, deleteData, getClientBranches } from '../../services/api'
import { normalizeBranchList, denormalizeBranchCreate, denormalizeBranchUpdate } from '../../services/normalizers'
import { validateForm, isRequired, isValidEmail, isValidPassword } from '../../utils/validation'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants'
import logger from '../../utils/logger'

const ClientAdminDashboard = () => {
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    location: ''
  })
  const [errors, setErrors] = useState({})
  const [sucursales, setSucursales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const scrollKey = '/client-admin'

  // Función para mostrar notificación
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Función para cerrar notificación
  const closeToast = () => {
    setToast(null)
  }

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

  // Cargar sucursales del backend
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setIsLoading(true)
        
        // Obtener client_id del usuario autenticado
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const clientId = user.id
        
        if (!clientId) {
          throw new Error('Client ID no disponible')
        }
        
        // Llamar al endpoint GET /client/{client_id}/branches
        const data = await getClientBranches(clientId)
        logger.info('Cargando sucursales para client:', clientId)
        
        // Normalizar respuesta usando normalizeBranchList
        const sucursalesArray = normalizeBranchList(data).map(sucursal => ({
          id: sucursal.id,
          nombre: sucursal.name,
          email: sucursal.email,
          location: sucursal.location
        }))
        
        setSucursales(sucursalesArray)
        logger.info('Sucursales cargadas exitosamente:', sucursalesArray.length)
      } catch (error) {
        logger.error('Error al cargar sucursales:', error)
        setSucursales([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSucursales()
  }, [])

  const handleAddBranch = () => {
    setFormData({ nombre: '', email: '', password: '', location: '' })
    setErrors({})
    setIsAddModalOpen(true)
  }

  const handleEditBranch = (sucursal) => {
    setSelectedBranch(sucursal)
    setFormData({
      nombre: sucursal.nombre,
      email: sucursal.email,
      password: '',
      location: sucursal.location || ''
    })
    setErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteBranch = (sucursal) => {
    setSelectedBranch(sucursal)
    setIsDeleteModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setFormData({ nombre: '', email: '', password: '', location: '' })
    setErrors({})
    setShowPassword(false)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedBranch(null)
    setFormData({ nombre: '', email: '', password: '', location: '' })
    setErrors({})
    setShowPassword(false)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedBranch(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleValidation = () => {
    const rules = {
      nombre: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD }
      ],
      email: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD },
        { validator: isValidEmail, message: ERROR_MESSAGES.INVALID_EMAIL }
      ],
      password: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD },
        { validator: (val) => isValidPassword(val, 6), message: ERROR_MESSAGES.INVALID_PASSWORD }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    
    if (!handleValidation()) return

    try {
      setIsSubmitting(true)
      
      // Obtener client_admin_id del usuario en sesión
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const clientAdminId = user.id
      
      if (!clientAdminId) {
        throw new Error('Client Admin ID no disponible')
      }
      
      // Usar denormalizer para preparar datos
      const branchData = denormalizeBranchCreate({
        name: formData.nombre,
        email: formData.email,
        password: formData.password,
        clientAdminId: clientAdminId,
        location: formData.location || undefined // Opcional
      })
      
      
      // Llamar al endpoint POST /branch/
      await postData('/branch/', branchData)
      logger.event('BRANCH_CREATED', { nombre: formData.nombre })
      
      // Recargar lista de sucursales
      const data = await getClientBranches(clientAdminId)
      
      // Normalizar usando normalizeBranchList
      const sucursalesArray = normalizeBranchList(data).map(sucursal => ({
        id: sucursal.id,
        nombre: sucursal.name,
        email: sucursal.email,
        location: sucursal.location
      }))
      
      setSucursales(sucursalesArray)
      handleCloseAddModal()
      showToast('Sucursal creada exitosamente', 'success')
    } catch (error) {
      logger.error('Error al crear sucursal:', error)
      showToast(error.response?.data?.message || 'Error al crear la sucursal', 'error')
      setErrors({ general: ERROR_MESSAGES.SERVER_ERROR })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    if (!handleValidation()) return

    try {
      setIsSubmitting(true)
      
      // Obtener client_admin_id del usuario en sesión
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const clientAdminId = user.id
      
      if (!clientAdminId) {
        throw new Error('Client Admin ID no disponible')
      }
      
      // Usar denormalizer para preparar datos de actualización
      const updateBranchData = denormalizeBranchUpdate({
        name: formData.nombre,
        email: formData.email,
        password: formData.password && formData.password.trim() !== '' ? formData.password : undefined,
        location: formData.location || undefined // Opcional
      })
      
      // Llamar al endpoint PATCH /branch/{id}
      await patchData(`/branch/${selectedBranch.id}`, updateBranchData)
      logger.event('BRANCH_UPDATED', { id: selectedBranch.id })
      
      // Recargar lista de sucursales
      const data = await getClientBranches(clientAdminId)
      
      // Normalizar usando normalizeBranchList
      const sucursalesArray = normalizeBranchList(data).map(sucursal => ({
        id: sucursal.id,
        nombre: sucursal.name,
        email: sucursal.email,
        location: sucursal.location
      }))
      
      setSucursales(sucursalesArray)
      handleCloseEditModal()
      showToast('Sucursal actualizada exitosamente', 'success')
    } catch (error) {
      logger.error('Error al actualizar sucursal:', error)
      showToast(error.response?.data?.message || 'Error al actualizar la sucursal', 'error')
      setErrors({ general: ERROR_MESSAGES.SERVER_ERROR })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true)
      await deleteData(`/branch/${selectedBranch.id}`)
      logger.event('BRANCH_DELETED', { id: selectedBranch.id })
      
      // Recargar lista de sucursales
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const clientAdminId = user.id
      const data = await getClientBranches(clientAdminId)
      
      // Normalizar usando normalizeBranchList
      const sucursalesArray = normalizeBranchList(data).map(sucursal => ({
        id: sucursal.id,
        nombre: sucursal.name,
        email: sucursal.email,
        location: sucursal.location
      }))
      
      setSucursales(sucursalesArray)
      handleCloseDeleteModal()
      showToast('Sucursal eliminada exitosamente', 'success')
    } catch (error) {
      logger.error('Error al eliminar sucursal:', error)
      showToast(error.response?.data?.message || 'Error al eliminar la sucursal', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={containerRef} className="page-container bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <header 
        className={`${
          isScrolled 
            ? 'bg-light-card/70 dark:bg-dark-card/70 backdrop-blur-2xl shadow-md' 
            : 'bg-light-card dark:bg-dark-card shadow-sm'
        } border-b border-gray-200 dark:border-[#3a3a3c] transition-[backdrop-filter,box-shadow] duration-300 sticky top-0 z-40`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[68px] md:h-[72px]">
            {/* Logo y título */}
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={logoTappin} 
                alt="Tappin Logo" 
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
              />
              <div>
                <h1 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold">
                  Tappin
                </h1>
                <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px]">
                  Panel administrativo
                </p>
              </div>
            </div>

            {/* Botón Cerrar sesión */}
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
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 md:py-7 lg:py-8">
        {/* Sección Usuarios registrados */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          <h2 className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-bold text-center mb-4 sm:mb-5">
            Usuarios registrados
          </h2>
        </div>

        {/* Sección Mis Sucursales */}
        <div>
          <h3 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-5">
            Mis Sucursales
          </h3>

          {/* Lista de sucursales */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {sucursales.map((sucursal, index) => (
              <div
                key={sucursal.id}
                className="bg-light-card dark:bg-dark-card rounded-xl sm:rounded-[18px] md:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-[#FDB913] dark:hover:border-[#FDB913] transition-all duration-300 shadow-sm hover:shadow-md"
                style={{
                  animation: `slideIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  {/* Información de la sucursal */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-light-text dark:text-dark-text text-[15px] sm:text-base md:text-lg font-bold mb-1 sm:mb-1.5 truncate">
                      {sucursal.nombre}
                    </h4>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px]">
                        ID: <span className="font-medium">{sucursal.id}</span>
                      </p>
                      <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] break-all">
                        Correo: <span className="font-medium">{sucursal.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Botón Editar */}
                    <button
                      onClick={() => handleEditBranch(sucursal)}
                      className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md group"
                      aria-label="Editar sucursal"
                    >
                      <svg 
                        className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] text-black transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                        />
                      </svg>
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => handleDeleteBranch(sucursal)}
                      className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md group"
                      aria-label="Eliminar sucursal"
                    >
                      <svg 
                        className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] text-black transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Botón flotante para agregar sucursal */}
      <button
        onClick={handleAddBranch}
        className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8 w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] rounded-full flex items-center justify-center transition-[transform,box-shadow,background-color,rotate] duration-300 hover:scale-110 active:scale-105 hover:rotate-90 z-50 shadow-lg hover:shadow-xl"
        aria-label="Agregar sucursal"
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

      {/* Modal Agregar Sucursal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal}
        title="Agregar sucursal"
        showIcon={false}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 sm:space-y-5">
          {/* Campo Nombre */}
          <div className="relative">
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                errors.nombre 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
              }`}
            />
            <label 
              htmlFor="nombre" 
              className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                formData.nombre 
                  ? 'top-2 text-xs' 
                  : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
              }`}
            >
              Nombre
            </label>
            {errors.nombre && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Correo */}
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
              Correo
            </label>
            {errors.email && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="relative">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 pr-12 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-light-text dark:hover:text-dark-text transition-colors duration-200"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Campo Ubicación */}
          <div className="relative">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                errors.location 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
              }`}
            />
            <label 
              htmlFor="location" 
              className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                formData.location 
                  ? 'top-2 text-xs' 
                  : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
              }`}
            >
              Ubicación
            </label>
            {errors.location && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.location}</p>
            )}
          </div>

          {/* Botón Crear */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-5 sm:mt-6 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Creando...</span>
              </>
            ) : (
              'Crear'
            )}
          </button>
        </form>
      </Modal>

      {/* Modal Editar Sucursal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal}
        title="Editar sucursal"
        showIcon={false}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-5">
          {/* Campo Nombre */}
          <div className="relative">
            <input
              type="text"
              id="edit-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                errors.nombre 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
              }`}
            />
            <label 
              htmlFor="edit-nombre" 
              className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                formData.nombre 
                  ? 'top-2 text-xs' 
                  : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
              }`}
            >
              Nombre
            </label>
            {errors.nombre && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Correo */}
          <div className="relative">
            <input
              type="email"
              id="edit-email"
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
              htmlFor="edit-email" 
              className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                formData.email 
                  ? 'top-2 text-xs' 
                  : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
              }`}
            >
              Correo
            </label>
            {errors.email && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="relative">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="edit-password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 pr-12 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.password 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="edit-password" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.password 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-light-text dark:hover:text-dark-text transition-colors duration-200"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Campo Ubicación */}
          <div className="relative">
            <input
              type="text"
              id="edit-location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                errors.location 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
              }`}
            />
            <label 
              htmlFor="edit-location" 
              className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                formData.location 
                  ? 'top-2 text-xs' 
                  : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
              }`}
            >
              Ubicación
            </label>
            {errors.location && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.location}</p>
            )}
          </div>

          {/* Botón Actualizar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-5 sm:mt-6 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Actualizando...</span>
              </>
            ) : (
              'Actualizar'
            )}
          </button>
        </form>
      </Modal>

      {/* Modal Eliminar Sucursal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={handleCloseDeleteModal}
        showIcon={false}
        showCloseButton={false}
      >
        <div className="text-center py-4 sm:py-6">
          {/* Icono de advertencia */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center" style={{ animation: 'scaleIn 0.4s ease-out' }}>
              <svg 
                className="w-12 h-12 sm:w-14 sm:h-14 text-red-600 dark:text-red-500" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{ animation: 'pulse 2s ease-in-out infinite' }}
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>

          {/* Título */}
          <h3 className="text-light-text dark:text-dark-text text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            ¿Eliminar sucursal?
          </h3>

          {/* Descripción */}
          <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-[15px] mb-6 sm:mb-7 leading-relaxed">
            Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal{' '}
            <span className="font-semibold text-light-text dark:text-dark-text">
              {selectedBranch?.nombre}
            </span>
            .
          </p>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleCloseDeleteModal}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-[#3a3a3c] dark:hover:bg-[#4a4a4c] text-light-text dark:text-dark-text font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Eliminando...</span>
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Cerrar Sesión */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={confirmLogout}
      />

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  )
}

export default ClientAdminDashboard
