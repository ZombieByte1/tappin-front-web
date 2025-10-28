import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { getData, postData, patchData, updateData, deleteData } from '../../services/api'
import { validateForm, isRequired, isValidEmail, isValidPassword } from '../../utils/validation'
import logger from '../../utils/logger'

const PadresBranch = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPadre, setSelectedPadre] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [padres, setPadres] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const scrollKey = '/branch/padres'

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

  // Cargar padres del backend
  useEffect(() => {
    const fetchPadres = async () => {
      try {
        setIsLoading(true)
        
        // Obtener sucursal_id del usuario en sesión
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const sucursalId = user.id
        
        if (!sucursalId) {
          throw new Error('Sucursal ID no disponible')
        }
        
        // Llamar al endpoint GET /branch/{sucursal_id}/list
        const data = await getData(`/branch/${sucursalId}/list`)
        logger.info('Cargando padres para sucursal:', sucursalId)
        
        // Normalizar respuesta
        let padresArray = []
        if (Array.isArray(data)) {
          padresArray = data
        } else if (data && Array.isArray(data.data)) {
          padresArray = data.data
        } else if (data && Array.isArray(data.parents)) {
          padresArray = data.parents
        } else if (data && Array.isArray(data.parent)) {
          padresArray = data.parent
        }
        
        // Normalizar campos de cada padre
        padresArray = padresArray.map((padre, index) => ({
          id: padre.id || padre._id || index.toString(),
          nombre: padre.name || padre.nombre || '',
          email: padre.email || '',
          // Agregar otros campos que el backend devuelva
          ...padre
        }))
        
        setPadres(padresArray)
        logger.info('Padres cargados exitosamente:', padresArray.length)
      } catch (error) {
        logger.error('Error al cargar padres:', error)
        setPadres([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPadres()
  }, [])

  const handleAddPadre = () => {
    setFormData({ nombre: '', email: '', password: '' })
    setErrors({})
    setShowPassword(false)
    setIsAddModalOpen(true)
  }

  const handleEditPadre = (padre) => {
    setSelectedPadre(padre)
    setFormData({
      nombre: padre.nombre,
      email: padre.email,
      password: ''
    })
    setErrors({})
    setShowPassword(false)
    setIsEditModalOpen(true)
  }

  const handleDeletePadre = (padre) => {
    setSelectedPadre(padre)
    setIsDeleteModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setFormData({ nombre: '', email: '', password: '' })
    setErrors({})
    setShowPassword(false)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPadre(null)
    setFormData({ nombre: '', email: '', password: '' })
    setErrors({})
    setShowPassword(false)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedPadre(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateFormData = () => {
    const rules = {
      nombre: [
        { validator: isRequired, message: 'El nombre es requerido' }
      ],
      email: [
        { validator: isRequired, message: 'El correo es requerido' },
        { validator: isValidEmail, message: 'El correo no es válido' }
      ],
      password: [
        { validator: isRequired, message: 'La contraseña es requerida' },
        { validator: (val) => isValidPassword(val, 6), message: 'La contraseña debe tener al menos 6 caracteres' }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateFormData()) return

    try {
      setIsSubmitting(true)
      
      // Obtener branch_id del usuario en sesión
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const branchId = user.id
      
      if (!branchId) {
        throw new Error('Branch ID no disponible')
      }
      
      // Preparar datos para el backend
      const parentData = {
        name: formData.nombre,
        email: formData.email,
        password: formData.password,
        branch_id: branchId
      }
      
      // Llamar al endpoint POST /parent/
      await postData('/parent/', parentData)
      
      logger.event('PARENT_CREATED', { email: formData.email })
      
      // Recargar lista de padres
      const data = await getData(`/branch/${branchId}/list`)
      
      // Normalizar respuesta
      let padresArray = []
      if (Array.isArray(data)) {
        padresArray = data
      } else if (data && Array.isArray(data.data)) {
        padresArray = data.data
      } else if (data && Array.isArray(data.parents)) {
        padresArray = data.parents
      } else if (data && Array.isArray(data.parent)) {
        padresArray = data.parent
      }
      
      // Normalizar campos
      padresArray = padresArray.map((padre, index) => ({
        id: padre.id || padre._id || index.toString(),
        nombre: padre.name || padre.nombre || '',
        email: padre.email || '',
        ...padre
      }))
      
      setPadres(padresArray)
      handleCloseAddModal()
      showToast('Padre creado exitosamente', 'success')
    } catch (error) {
      logger.error('Error al crear padre:', error)
      showToast(error.response?.data?.message || 'Error al crear el padre', 'error')
      setErrors({ submit: 'Error al crear el padre. Intenta nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateFormData()) return

    try {
      setIsSubmitting(true)
      
      // Obtener branch_id del usuario en sesión
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const branchId = user.id
      
      if (!branchId) {
        throw new Error('Branch ID no disponible')
      }
      
      // Preparar datos para actualizar - el backend requiere todos los campos
      const updateParentData = {
        name: formData.nombre,
        email: formData.email,
        password: formData.password || selectedPadre.password || '' // Usar la nueva contraseña o mantener la actual
      }
      
      
      // Llamar al endpoint PATCH /parent/{id}
      await patchData(`/parent/${selectedPadre.id}`, updateParentData)
      
      logger.event('PARENT_UPDATED', { id: selectedPadre.id })
      
      // Recargar lista de padres
      const data = await getData(`/branch/${branchId}/list`)
      
      // Normalizar respuesta
      let padresArray = []
      if (Array.isArray(data)) {
        padresArray = data
      } else if (data && Array.isArray(data.data)) {
        padresArray = data.data
      } else if (data && Array.isArray(data.parents)) {
        padresArray = data.parents
      } else if (data && Array.isArray(data.parent)) {
        padresArray = data.parent
      }
      
      // Normalizar campos
      padresArray = padresArray.map((padre, index) => ({
        id: padre.id || padre._id || index.toString(),
        nombre: padre.name || padre.nombre || '',
        email: padre.email || '',
        ...padre
      }))
      
      setPadres(padresArray)
      handleCloseEditModal()
      showToast('Padre actualizado exitosamente', 'success')
    } catch (error) {
      logger.error('Error al actualizar padre:', error)
      showToast(error.response?.data?.message || 'Error al actualizar el padre', 'error')
      setErrors({ submit: 'Error al actualizar el padre. Intenta nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true)
      
      // Obtener branch_id del usuario en sesión
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const branchId = user.id
      
      if (!branchId) {
        throw new Error('Branch ID no disponible')
      }
      
      
      // Llamar al endpoint DELETE /parent/{id}
      await deleteData(`/parent/${selectedPadre.id}`)
      
      logger.event('PARENT_DELETED', { id: selectedPadre.id })
      
      // Recargar lista de padres
      const data = await getData(`/branch/${branchId}/list`)
      
      // Normalizar respuesta
      let padresArray = []
      if (Array.isArray(data)) {
        padresArray = data
      } else if (data && Array.isArray(data.data)) {
        padresArray = data.data
      } else if (data && Array.isArray(data.parents)) {
        padresArray = data.parents
      } else if (data && Array.isArray(data.parent)) {
        padresArray = data.parent
      }
      
      // Normalizar campos
      padresArray = padresArray.map((padre, index) => ({
        id: padre.id || padre._id || index.toString(),
        nombre: padre.name || padre.nombre || '',
        email: padre.email || '',
        ...padre
      }))
      
      setPadres(padresArray)
      handleCloseDeleteModal()
      showToast('Padre eliminado exitosamente', 'success')
    } catch (error) {
      logger.error('Error al eliminar padre:', error)
      showToast(error.response?.data?.message || 'Error al eliminar el padre', 'error')
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleGoBack = () => {
    navigate('/branch')
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Filtrar padres en tiempo real
  const filteredPadres = padres.filter((padre) => {
    const searchLower = searchTerm.toLowerCase()
    const nombreMatch = padre.nombre.toLowerCase().includes(searchLower)
    const emailMatch = padre.email.toLowerCase().includes(searchLower)
    return nombreMatch || emailMatch
  })

  return (
    <>
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
              {/* Logo y título */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={handleGoBack}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                  aria-label="Regresar"
                >
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-black" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                    />
                  </svg>
                </button>
                <img src={logoTappin} alt="Tappin Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold truncate">
                    Tappin - Sucursal
                  </h1>
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
        <main 
          className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
          style={{
            animation: 'slideInRight 0.4s ease-out both'
          }}
        >
          {/* Título */}
          <h2 className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6">
            Usuarios registrados
          </h2>

          {/* Subtítulo */}
          <h3 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-5 md:mb-6">
            Lista de padres
          </h3>

          {/* Buscador */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 pl-11 sm:pl-12 py-3 sm:py-3.5 text-[15px] sm:text-base bg-white dark:bg-[#2a2b2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl sm:rounded-2xl text-light-text dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent transition-all duration-200"
              />
              <svg 
                className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Contador de resultados */}
            {searchTerm && (
              <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm mt-2 ml-1">
                {filteredPadres.length} {filteredPadres.length === 1 ? 'resultado' : 'resultados'} encontrado{filteredPadres.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {/* Lista de padres */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPadres.length > 0 ? (
              filteredPadres.map((padre) => (
                <div
                  key={padre.id}
                  className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] transition-all duration-200 animate-slideIn"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-light-text dark:text-dark-text text-[15px] sm:text-base md:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 truncate">
                        {padre.nombre}
                      </h4>
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm">
                          ID: <span className="font-mono">{padre.id}</span>
                        </p>
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm break-all">
                          Correo: {padre.email}
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                      {/* Botón Editar */}
                      <button
                        onClick={() => handleEditPadre(padre)}
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 hover:rotate-12 hover:scale-110"
                        aria-label="Editar padre"
                      >
                        <svg 
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] text-black" 
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
                        onClick={() => handleDeletePadre(padre)}
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-110"
                        aria-label="Eliminar padre"
                      >
                        <svg 
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] text-white" 
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
              ))
            ) : (
              <div className="text-center py-12 sm:py-16">
                <svg 
                  className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                <p className="text-light-text-secondary dark:text-gray-400 text-base sm:text-lg">
                  No se encontraron padres
                </p>
                <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-base mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Botón flotante para agregar */}
        <button
          onClick={handleAddPadre}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:rotate-90 z-10"
          aria-label="Agregar padre"
        >
          <svg 
            className="w-7 h-7 sm:w-8 sm:h-8 text-black" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round"
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
      </div>

      {/* Modal Agregar Padre */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal}
        title="Agregar padre"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 sm:space-y-5">
          {/* Campo Nombre */}
          <div className="relative">
            <input
              type="text"
              id="add-nombre"
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
              htmlFor="add-nombre" 
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
              id="add-email"
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
              htmlFor="add-email" 
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
                type={showPassword ? 'text' : 'password'}
                id="add-password"
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
                htmlFor="add-password" 
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
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Botón Agregar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Agregando...</span>
              </>
            ) : (
              'Agregar'
            )}
          </button>
        </form>
      </Modal>

      {/* Modal Editar Padre */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal}
        title="Editar padre"
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
                type={showPassword ? 'text' : 'password'}
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
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Botón Actualizar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Modal Eliminar Padre */}
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
            ¿Eliminar padre?
          </h3>

          {/* Descripción */}
          <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-[15px] mb-6 sm:mb-7 leading-relaxed">
            Esta acción no se puede deshacer. Se eliminará permanentemente el padre{' '}
            <span className="font-semibold text-light-text dark:text-dark-text">
              {selectedPadre?.nombre}
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
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </>
  )
}

export default PadresBranch