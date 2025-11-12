import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { getParentStudents, getStaffStudents, postData, deleteStudent } from '../../services/api'
import { normalizeStudentList, denormalizeStudentCreate } from '../../services/normalizers'
import { validateForm, isRequired } from '../../utils/validation'
import logger from '../../utils/logger'
import { useAuth } from '../../context/AuthContext'

const ParentDashboard = () => {
  const location = useLocation()
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const { user } = useAuth()
  const [userName] = useState(user?.name || 'Usuario')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    escuela: '',
    curso: ''
  })
  const [errors, setErrors] = useState({})
  const [hijos, setHijos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const scrollKey = '/parent'

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

  // Detectar scroll para el efecto blur del header
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Guardar la posición actual
      saveScroll(scrollKey, container.scrollTop)
      setIsScrolled(container.scrollTop > 10)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Cargar hijos del backend
  useEffect(() => {
    const fetchHijos = async () => {
      try {
        setIsLoading(true)
        // Obtener user id y rol del contexto o localStorage
        const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id
        const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role
        
        if (!userId) {
          throw new Error('User ID no disponible')
        }

        let data
        // Usar endpoint correcto según el rol
        if (userRole === 'staff') {
          logger.info('Cargando lista de estudiantes para staff:', userId)
          data = await getStaffStudents(userId)
        } else {
          logger.info('Cargando lista de hijos para parent:', userId)
          data = await getParentStudents(userId)
        }
        
        // El backend devuelve array directo de estudiantes
        // Normalizar usando normalizers
        const hijosArray = normalizeStudentList(data).map(hijo => ({
          id: hijo.id,
          name: hijo.name,
          rfid: hijo.rfid,
          creditos: hijo.credits,
          tope: hijo.tope,
          state: hijo.state,
          parent_id: hijo.parentId,
          school: hijo.school,
          course: hijo.course
        }))
        
        setHijos(hijosArray)
        logger.info('Estudiantes cargados exitosamente:', hijosArray.length)
      } catch (error) {
        logger.error('Error al cargar estudiantes:', error)
        setHijos([]) // Asegurar que sea array vacío en caso de error
      } finally {
        setIsLoading(false)
      }
    }

    fetchHijos()
  }, [])

  const handleAddChild = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Resetear formulario
    setFormData({
      nombre: '',
      escuela: '',
      curso: ''
    })
    // Limpiar errores
    setErrors({})
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
      escuela: [
        { validator: isRequired, message: 'La escuela es requerida' }
      ],
      curso: [
        { validator: isRequired, message: 'El curso es requerido' }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateFormData()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // Obtener user id y rol del contexto o localStorage
      const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id
      const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role
      
      if (!userId) {
        throw new Error('User ID no disponible')
      }
      
      // Preparar datos usando denormalizer
      // Para staff, se usa staff_id en lugar de parent_id
      const studentData = userRole === 'staff' 
        ? denormalizeStudentCreate({
            name: formData.nombre,
            credits: 0,
            staffId: userId,
            school: formData.escuela,
            course: formData.curso
          })
        : denormalizeStudentCreate({
            name: formData.nombre,
            credits: 0,
            parentId: userId,
            school: formData.escuela,
            course: formData.curso
          })
      
      logger.info('Datos a enviar:', { userRole, userId, studentData })
      
      // Agregar owner_type como query parameter
      const ownerType = userRole === 'staff' ? 'staff' : 'parent'
      const response = await postData(`/students?owner_type=${ownerType}`, studentData)
      logger.info('Estudiante creado exitosamente:', response)
      
      logger.event('STUDENT_ADDED', { nombre: formData.nombre, role: userRole })
      
      // Recargar lista de estudiantes usando endpoint correcto según rol
      let data
      if (userRole === 'staff') {
        data = await getStaffStudents(userId)
      } else {
        data = await getParentStudents(userId)
      }
      
      // Normalizar usando normalizers
      const hijosArray = normalizeStudentList(data).map(hijo => ({
        id: hijo.id,
        name: hijo.name,
        rfid: hijo.rfid,
        creditos: hijo.credits,
        tope: hijo.tope,
        state: hijo.state,
        parent_id: hijo.parentId,
        school: hijo.school,
        course: hijo.course
      }))
      
      setHijos(hijosArray)
      
      handleCloseModal()
      showToast(userRole === 'staff' ? 'Estudiante agregado exitosamente' : 'Hijo agregado exitosamente', 'success')
    } catch (error) {
      logger.error('Error al agregar estudiante:', error)
      showToast(error.response?.data?.message || 'Error al agregar el estudiante', 'error')
      setErrors({ submit: 'Error al agregar el estudiante. Intenta nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funciones para modal de eliminación
  const openDeleteModal = (student) => {
    setStudentToDelete(student)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setStudentToDelete(null)
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      setIsDeleting(true)
      
      logger.info('=== ELIMINANDO ESTUDIANTE ===')
      logger.info('ID:', studentToDelete.id)
      logger.info('RFID:', studentToDelete.rfid)
      logger.info('Nombre:', studentToDelete.name)

      // Eliminar por ID numérico, no por RFID
      await deleteStudent(studentToDelete.id)
      
      logger.event('STUDENT_DELETED', { 
        id: studentToDelete.id,
        rfid: studentToDelete.rfid, 
        name: studentToDelete.name 
      })
      logger.info('=== ELIMINACIÓN COMPLETADA ===')

      // Recargar lista de hijos
      const parentId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id
      if (parentId) {
        const data = await getParentStudents(parentId)
        const hijosArray = normalizeStudentList(data).map(hijo => ({
          id: hijo.id,
          name: hijo.name,
          rfid: hijo.rfid,
          creditos: hijo.credits,
          tope: hijo.tope,
          state: hijo.state,
          parent_id: hijo.parentId,
          school: hijo.school,
          course: hijo.course
        }))
        setHijos(hijosArray)
      }

      showToast('Hijo eliminado exitosamente', 'success')
      closeDeleteModal()
    } catch (error) {
      logger.error('=== ERROR EN ELIMINACIÓN ===')
      logger.error('Error completo:', error)
      logger.error('Response data:', error.response?.data)
      logger.error('Response status:', error.response?.status)
      
      showToast(
        error.response?.data?.message || 'Error al eliminar el hijo',
        'error'
      )
    } finally {
      setIsDeleting(false)
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
          <div className="flex justify-between items-center h-16 sm:h-[68px] md:h-[72px]">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <img 
                src={logoTappin} 
                alt="Tappin Logo" 
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain"
              />
              <h1 className="text-light-text dark:text-dark-text text-[17px] sm:text-lg md:text-xl font-bold">
                Tappin
              </h1>
            </div>

            {/* Bienvenida y Salir */}
            <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 md:py-7 lg:py-8">
        {/* Título */}
        <div className="mb-5 sm:mb-6 md:mb-7 lg:mb-8">
          <h2 className="text-light-text dark:text-dark-text text-[22px] sm:text-2xl md:text-[28px] lg:text-3xl font-bold mb-2 sm:mb-2.5">
            Hijos registrados
          </h2>
          <div className="h-1 w-20 sm:w-22 md:w-24 bg-[#FDB913] rounded-full"></div>
        </div>

        {/* Lista de Hijos */}
        <div className="space-y-3 sm:space-y-3.5 md:space-y-4 pb-24 sm:pb-26 md:pb-28">
          {hijos.map((hijo, index) => (
            <div
              key={hijo.id}
              className="bg-light-card dark:bg-dark-card rounded-xl sm:rounded-[18px] md:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-[#FDB913] group overflow-hidden"
              style={{
                animation: 'slideIn 0.4s ease-out both'
              }}
            >
              {/* Header con nombre y badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#FDB913] to-[#fcc000] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-black font-bold text-lg sm:text-xl">
                      {hijo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Nombre y ID */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-light-text dark:text-white font-semibold text-[15px] sm:text-base md:text-[17px] truncate mb-0.5">
                      {hijo.name}
                    </h3>
                    <p className="text-light-text-secondary dark:text-gray-400 text-[12px] sm:text-[13px] font-mono truncate">
                      ID: {hijo.rfid}
                    </p>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  {/* Botón de configuración */}
                  <Link 
                    to={user?.role === 'staff' ? `/staff/student/${hijo.id}` : `/parent/child/${hijo.id}`}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 group/btn flex-shrink-0 shadow-sm hover:shadow-md"
                    aria-label={user?.role === 'staff' ? 'Configurar estudiante' : 'Configurar hijo'}
                  >
                    <svg 
                      className="w-5 h-5 text-black group-hover/btn:rotate-90 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  </Link>

                  {/* Botón de eliminar */}
                  <button
                    onClick={() => openDeleteModal(hijo)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-all duration-200 group/btn flex-shrink-0 shadow-sm hover:shadow-md"
                    aria-label="Eliminar hijo"
                  >
                    <svg 
                      className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-200" 
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

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Créditos */}
                <div className="rounded-lg sm:rounded-xl p-3 sm:p-3.5">
                  <p className="text-light-text-secondary dark:text-gray-400 text-[11px] sm:text-xs mb-1 font-medium">
                    Créditos disponibles
                  </p>
                  <p className="text-[#FDB913] font-bold text-xl sm:text-2xl">
                    ${hijo.creditos}
                  </p>
                </div>
                {/* Tope */}
                <div className="rounded-lg sm:rounded-xl p-3 sm:p-3.5">
                  <p className="text-light-text-secondary dark:text-gray-400 text-[11px] sm:text-xs mb-1 font-medium">
                    Tope diario
                  </p>
                  <p className="text-light-text dark:text-white font-bold text-xl sm:text-2xl">
                    ${hijo.tope}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón flotante para agregar hijo/estudiante */}
        <button
          onClick={handleAddChild}
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8 w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] rounded-full flex items-center justify-center transition-[transform,box-shadow,background-color,rotate] duration-300 hover:scale-110 active:scale-105 hover:rotate-90 z-50 shadow-lg hover:shadow-xl"
          aria-label={user?.role === 'staff' ? 'Agregar estudiante' : 'Agregar hijo'}
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

      {/* Modal para agregar hijo/estudiante */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title="Crear cuenta"
      >
        <div className="space-y-5 sm:space-y-5 md:space-y-6">
          <p className="text-light-text-secondary dark:text-gray-400 text-[13px] sm:text-sm leading-relaxed">
            {user?.role === 'staff' 
              ? 'Rellene los campos para registrar un estudiante' 
              : 'Rellene los campos para registrar a su hijo'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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

            {/* Campo Escuela */}
            <div className="relative">
              <input
                type="text"
                id="escuela"
                name="escuela"
                value={formData.escuela}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.escuela 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="escuela" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.escuela 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Escuela
              </label>
              {errors.escuela && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.escuela}</p>
              )}
            </div>

            {/* Campo Curso */}
            <div className="relative">
              <input
                type="text"
                id="curso"
                name="curso"
                value={formData.curso}
                onChange={handleInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  errors.curso 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="curso" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  formData.curso 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Curso
              </label>
              {errors.curso && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.curso}</p>
              )}
            </div>

            {/* Botón Enviar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-3.5 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-5 sm:mt-6 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </form>
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar hijo */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar eliminación"
      >
        <div className="p-2 sm:p-3">
          {studentToDelete && (
            <>
              <p className="text-light-text dark:text-dark-text text-[15px] sm:text-base mb-4">
                ¿Estás seguro de que deseas eliminar a <span className="font-bold">{studentToDelete.name}</span>?
              </p>
              <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-6">
                Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-[#2a2a2c] hover:bg-gray-300 dark:hover:bg-[#3a3a3c] text-light-text dark:text-dark-text rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

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

export default ParentDashboard
