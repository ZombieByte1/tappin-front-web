import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { getStudentById, updateStudentById, getTransactionHistory } from '../../services/api'
import { normalizeStudent, denormalizeStudentUpdate, normalizeTransactionList } from '../../services/normalizers'
import { validateForm, isRequired } from '../../utils/validation'
import { useAuth } from '../../context/AuthContext'
import logger from '../../utils/logger'

const ChildDetails = () => {
  const navigate = useNavigate()
  const { childId } = useParams()
  const { user } = useAuth()
  // Convertir childId a número para comparar con el ID del hijo
  const numericChildId = childId ? Number(childId) : null
  const [isScrolled, setIsScrolled] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    tope: '',
    school: '',
    course: ''
  })
  const [editErrors, setEditErrors] = useState({})
  const [childData, setChildData] = useState(null)
  const [historial, setHistorial] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef(null)

  // Resetear scroll al inicio cuando se monta o cambia el childId
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.scrollTop = 0
    }
  }, [childId])

  // Detectar scroll para el efecto blur
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 10)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Obtener datos del hijo usando el endpoint directo
  useEffect(() => {
    const loadChildData = async () => {
      setIsLoading(true)
      setIsLoadingHistory(true)

      try {
        // Convertir childId a número
        const numericChildId = parseInt(childId, 10)
        
        if (isNaN(numericChildId)) {
          throw new Error('ID de estudiante inválido')
        }

        logger.info('=== CARGANDO DATOS DEL ESTUDIANTE ===')
        logger.info('Student ID:', numericChildId)

        // Obtener datos del estudiante directamente por ID
        const studentData = await getStudentById(numericChildId)
        logger.info('Datos del estudiante recibidos:', studentData)

        // Normalizar los datos usando normalizeStudent
        const normalizedStudent = normalizeStudent(studentData)

        // Convertir al formato esperado por el componente
        const childData = {
          id: normalizedStudent.id,
          name: normalizedStudent.name,
          rfid: normalizedStudent.rfid,
          creditos: normalizedStudent.credits,
          tope: normalizedStudent.tope,
          state: normalizedStudent.state,
          parent_id: normalizedStudent.parentId,
          staff_id: normalizedStudent.staffId,
          school: normalizedStudent.school,
          course: normalizedStudent.course
        }

        setChildData(childData)
        logger.info('Datos del hijo cargados exitosamente')

        // Cargar historial si tiene rfid válido
        if (childData.rfid && childData.rfid !== 'Pendiente') {
          fetchHistorial(childData.rfid)
        } else {
          setIsLoadingHistory(false)
          logger.info('RFID pendiente, no se puede cargar historial')
        }

      } catch (error) {
        logger.error('=== ERROR AL CARGAR DATOS DEL ESTUDIANTE ===')
        logger.error('Error completo:', error)
        logger.error('Response data:', error.response?.data)
        logger.error('Response status:', error.response?.status)
        
        setChildData(null)
        setIsLoadingHistory(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (childId) {
      loadChildData()
    }
  }, [childId])

  // Función para cargar historial de transacciones por RFID
  const fetchHistorial = async (rfid) => {
    try {
      setIsLoadingHistory(true)
      
      const transactions = await getTransactionHistory(rfid, 50)
      logger.info('Cargando historial de transacciones para RFID:', rfid)
      
      // Normalizar historial
      const historialArray = normalizeTransactionList(transactions)
      
      setHistorial(historialArray)
      logger.info('Historial cargado exitosamente:', historialArray.length)
    } catch (error) {
      logger.error('Error al cargar historial:', error)
      setHistorial([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleGoBack = () => {
    const backRoute = user?.role === 'staff' ? '/staff' : '/parent'
    navigate(backRoute)
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleOpenEditModal = () => {
    if (!childData) return
    
    // Pre-llenar el formulario con los datos actuales
    setEditFormData({
      nombre: childData.name,
      tope: childData.tope?.toString() || '',
      school: childData.school || '',
      course: childData.course || ''
    })
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditFormData({
      nombre: '',
      tope: '',
      school: '',
      course: ''
    })
    setEditErrors({})
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo al escribir
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateEditFormData = () => {
    // No forzamos que los campos estén llenos: solo validamos 'tope' si fue proporcionado
    const errors = {}
    if (editFormData.tope && editFormData.tope.trim() !== '') {
      const num = Number(editFormData.tope)
      // Permitimos 0 como valor válido (padre puede dejar tope en 0)
      if (isNaN(num) || num < 0) {
        errors.tope = 'El tope debe ser un número mayor o igual a 0'
      }
    }

    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateEditFormData()) return

    try {
      setIsSubmitting(true)
      
      // Usar el ID numérico del estudiante
      const studentId = childData.id

      logger.info('=== ACTUALIZANDO DATOS DEL HIJO ===')
      logger.info('Student ID:', studentId)
      logger.info('RFID:', childData.rfid)

      // Construir objeto con los datos del formulario
      const formUpdates = {
        name: editFormData.nombre && editFormData.nombre.trim() !== '' ? editFormData.nombre : undefined,
        limit: editFormData.tope && editFormData.tope.trim() !== '' ? Number(editFormData.tope) : undefined,
        school: editFormData.school && editFormData.school.trim() !== '' ? editFormData.school : undefined,
        course: editFormData.course && editFormData.course.trim() !== '' ? editFormData.course : undefined
      }

      // Usar denormalizer para convertir al formato del backend
      const updatePayload = denormalizeStudentUpdate(formUpdates)

      logger.info('Payload para /students/{id}:', JSON.stringify(updatePayload))

      if (Object.keys(updatePayload).length === 0) {
        // Nada que actualizar
        setToast({ message: 'No hay cambios para guardar', type: 'info' })
        setIsSubmitting(false)
        return
      }

      // Actualizar usando ID en lugar de RFID
      const response = await updateStudentById(studentId, updatePayload)
      logger.info('Respuesta de actualización:', response)
      
      // Actualizar datos localmente después de la respuesta exitosa
      const updatedChild = {
        ...childData,
        // Solo sobreescribir los campos que fueron enviados
        name: formUpdates.name ?? childData.name,
        tope: formUpdates.limit ?? childData.tope,
        school: formUpdates.school ?? childData.school,
        course: formUpdates.course ?? childData.course
      }
      
      setChildData(updatedChild)
      
      logger.event('CHILD_UPDATED', { 
        id: studentId, 
        rfid: childData.rfid, 
        name: editFormData.nombre, 
        tope: editFormData.tope 
      })
      logger.info('=== ACTUALIZACIÓN COMPLETADA ===')
      
      // Mostrar toast de éxito
      setToast({
        message: 'Datos actualizados correctamente',
        type: 'success'
      })
      
      handleCloseEditModal()
    } catch (error) {
      logger.error('=== ERROR EN ACTUALIZACIÓN ===')
      logger.error('Error completo:', error)
      logger.error('Response data:', error.response?.data)
      logger.error('Response status:', error.response?.status)
      
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Error al actualizar los datos'
      setEditErrors({ submit: errorMessage })
      
      // Mostrar toast de error
      setToast({
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDevModal = () => {
    setIsDevModalOpen(true)
  }

  const handleCloseDevModal = () => {
    setIsDevModalOpen(false)
  }

  // Mostrar loading mientras cargan los datos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FDB913]"></div>
          <p className="text-light-text dark:text-dark-text text-sm">Cargando información del hijo, por favor espera...</p>
        </div>
      </div>
    )
  }

  // Si no hay datos del hijo (error de carga)
  if (!childData) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-light-text dark:text-dark-text text-lg mb-4">
            No se pudieron cargar los datos del hijo
          </p>
          <button
            onClick={handleGoBack}
            className="bg-[#FDB913] hover:bg-[#fcc000] text-black font-semibold px-6 py-2 rounded-lg"
          >
            Regresar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="page-container bg-light-bg dark:bg-dark-bg">
      {/* Header con botón de regreso */}
      <header 
        className={`${
          isScrolled 
            ? 'bg-light-card/70 dark:bg-dark-card/70 backdrop-blur-2xl shadow-md' 
            : 'bg-light-card dark:bg-dark-card shadow-sm'
        } border-b border-gray-200 dark:border-[#3a3a3c] transition-[backdrop-filter,box-shadow] duration-300 sticky top-0 z-40`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="flex items-center h-16 sm:h-[68px] md:h-[72px]">
            {/* Botón de regreso */}
            <button
              onClick={handleGoBack}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md mr-3 sm:mr-4"
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

            {/* Nombre del hijo */}
            <h1 className="text-light-text dark:text-dark-text text-[17px] sm:text-lg md:text-xl font-bold transition-colors duration-200">
              {childData.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main 
        className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 md:py-7 lg:py-8"
        style={{
          animation: 'slideInRight 0.4s ease-out both'
        }}
      >
        {/* Tarjeta de créditos */}
        <div className="bg-gradient-to-br from-[#FDB913] to-[#fcc000] rounded-2xl sm:rounded-[20px] md:rounded-[24px] p-5 sm:p-6 md:p-7 lg:p-8 mb-6 sm:mb-7 md:mb-8 shadow-[0_10px_40px_-10px_rgba(253,185,19,0.3)]">
          {/* Header - Créditos */}
          <div className="flex items-start justify-between mb-6 sm:mb-8 md:mb-10">
            <div className="flex-1">
              <p className="text-black/60 text-xs sm:text-sm mb-2 sm:mb-3 font-medium">
                Créditos
              </p>
              <h2 className="text-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
                ${childData.creditos}
              </h2>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0 ml-3">
              <svg 
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>

          {/* Información del hijo */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div>
              <p className="text-black/60 text-xs sm:text-sm mb-1 sm:mb-1.5 font-medium">
                Nombre
              </p>
              <p className="text-black text-base sm:text-lg md:text-xl font-bold">
                {childData.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-black/60 text-xs sm:text-sm mb-1 sm:mb-1.5 font-medium">
                  RFID
                </p>
                <p className="text-black text-sm sm:text-base md:text-lg font-mono font-bold">
                  {childData.rfid}
                </p>
              </div>
              <div>
                <p className="text-black/60 text-xs sm:text-sm mb-1 sm:mb-1.5 font-medium">
                  Tope diario
                </p>
                <p className="text-black text-sm sm:text-base md:text-lg font-bold">
                  ${childData.tope}
                </p>
              </div>
            </div>
          </div>

          {/* Logo Tappin */}
          <div className="text-right">
            <p className="text-black/30 text-base sm:text-lg md:text-xl font-bold">
              Tappin
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-7 md:mb-8">
          {/* Botón Recibido */}
          <button 
            onClick={handleOpenDevModal}
            className="flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-xl sm:rounded-[14px] bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200">
              <svg 
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-black" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                />
              </svg>
            </div>
            <p className="text-light-text dark:text-dark-text text-xs sm:text-[13px] md:text-sm font-semibold text-center">
              Recibido
            </p>
          </button>

          {/* Botón Editar */}
          <button 
            onClick={handleOpenEditModal}
            className="flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-xl sm:rounded-[14px] bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200">
              <svg 
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-black" 
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
            <p className="text-light-text dark:text-dark-text text-xs sm:text-[13px] md:text-sm font-semibold text-center">
              Editar
            </p>
          </button>

          {/* Botón Agregar fondos */}
          <button 
            onClick={handleOpenDevModal}
            className="flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-xl sm:rounded-[14px] bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200">
              <svg 
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-black" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
            </div>
            <p className="text-light-text dark:text-dark-text text-xs sm:text-[13px] md:text-sm font-semibold text-center">
              Agregar fondos
            </p>
          </button>
        </div>

        {/* Historial de compras */}
        <div className="bg-light-card dark:bg-dark-card rounded-xl sm:rounded-[18px] md:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c]">
          <h3 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold mb-1">
            Historial de compras
          </h3>
          <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5">
            Todas las compras
          </p>

          {/* Lista de compras */}
          <div className="space-y-3 sm:space-y-3.5">
            {historial.map((compra) => (
              <div
                key={compra.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-light-bg dark:bg-dark-bg rounded-lg sm:rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icono */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 dark:bg-[#3a3a3c] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl">$</span>
                  </div>
                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <p className="text-light-text dark:text-dark-text text-sm sm:text-[15px] font-semibold truncate">
                      {compra.product}
                    </p>
                    <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px]">
                      {compra.timestamp}
                    </p>
                  </div>
                </div>
                {/* Precio */}
                <p className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold ml-2">
                  $ {compra.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de edición */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal}
        title="Editar datos"
        showIcon={false}
      >
        <div className="space-y-5 sm:space-y-5 md:space-y-6">
          <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo Nombre */}
            <div className="relative">
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={editFormData.nombre}
                onChange={handleEditInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  editErrors.nombre 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="nombre" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  editFormData.nombre 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Nombre
              </label>
              {editErrors.nombre && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{editErrors.nombre}</p>
              )}
            </div>

            {/* Campo Tope */}
            <div className="relative">
              <input
                type="text"
                id="tope"
                name="tope"
                value={editFormData.tope}
                onChange={handleEditInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  editErrors.tope 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="tope" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  editFormData.tope 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Tope
              </label>
              {editErrors.tope && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{editErrors.tope}</p>
              )}
            </div>

            {/* Campo Escuela */}
            <div className="relative">
              <input
                type="text"
                id="school"
                name="school"
                value={editFormData.school}
                onChange={handleEditInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  editErrors.school 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="school" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  editFormData.school 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Escuela
              </label>
              {editErrors.school && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{editErrors.school}</p>
              )}
            </div>

            {/* Campo Curso */}
            <div className="relative">
              <input
                type="text"
                id="course"
                name="course"
                value={editFormData.course}
                onChange={handleEditInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  editErrors.course 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="course" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  editFormData.course 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Curso
              </label>
              {editErrors.course && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{editErrors.course}</p>
              )}
            </div>

            {/* Botón Actualizar */}
            <button
              type="submit"
              className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-5 sm:mt-6 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md"
            >
              Actualizar
            </button>
          </form>
        </div>
      </Modal>

      {/* Modal de característica en desarrollo */}
      <Modal 
        isOpen={isDevModalOpen} 
        onClose={handleCloseDevModal}
        showIcon={false}
        showCloseButton={false}
      >
        <div className="text-center py-4 sm:py-6">
          {/* Icono de mantenimiento con animación */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FDB913] flex items-center justify-center">
              <svg 
                className="w-12 h-12 sm:w-14 sm:h-14 text-black animate-wrench" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                {/* Llave inglesa */}
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
          </div>

          {/* Título */}
          <h3 className="text-light-text dark:text-dark-text text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Característica en desarrollo
          </h3>

          {/* Descripción */}
          <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-[15px] mb-6 sm:mb-7 leading-relaxed">
            Esta característica aún no está disponible. Estamos trabajando arduamente para que esté lista pronto.
          </p>

          {/* Botón Entendido */}
          <button
            onClick={handleCloseDevModal}
            className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md"
          >
            Entendido
          </button>
        </div>
      </Modal>

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

export default ChildDetails
