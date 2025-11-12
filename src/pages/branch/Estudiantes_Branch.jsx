import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { getData, postData, patchData, searchStudents, activateStudent, addCredits, deleteStudent } from '../../services/api'
import { normalizeStudentList } from '../../services/normalizers'
import api from '../../services/api'
import { RFID_SCAN_DELAY } from '../../constants'
import logger from '../../utils/logger'

const EstudiantesBranch = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false)
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyPending, setShowOnlyPending] = useState(false)
  const [rfidInput, setRfidInput] = useState('')
  const [rfidError, setRfidError] = useState('')
  const rfidInputRef = useRef(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditError, setCreditError] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const scrollKey = '/branch/estudiantes'

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

  // Cargar estudiantes del backend
  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        setIsLoading(true)
        
        // Obtener branch_id del usuario en sesión
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const branchId = user.id
        
        logger.info('Usuario branch:', { user, branchId })
        
        if (!branchId) {
          throw new Error('Branch ID no disponible')
        }
        
        // Llamar al endpoint GET /students/search
        logger.info('Llamando a searchStudents con branchId:', branchId)
        const data = await searchStudents(branchId)
        logger.info('Respuesta del servidor:', data)
        
        // Normalizar respuesta usando normalizeStudentList
        const estudiantesArray = normalizeStudentList(data).map(estudiante => ({
          id: estudiante.id,
          nombre: estudiante.name,
          rfid: estudiante.rfid,
          creditos: estudiante.credits,
          state: estudiante.state,
          parent_id: estudiante.parentId,
          school: estudiante.school,
          course: estudiante.course,
          tope: estudiante.limit
        }))
        
        logger.info('Estudiantes normalizados:', estudiantesArray)
        setEstudiantes(estudiantesArray)
        logger.info('Estudiantes cargados exitosamente:', estudiantesArray.length)
      } catch (error) {
        logger.error('Error al cargar estudiantes:', error)
        setEstudiantes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEstudiantes()
  }, [])

  const handleActivateAccount = (estudiante) => {
    setSelectedEstudiante(estudiante)
    setRfidInput('')
    setRfidError('')
    setIsActivateModalOpen(true)
  }

  const handleCloseActivateModal = () => {
    setIsActivateModalOpen(false)
    setSelectedEstudiante(null)
    setRfidInput('')
    setRfidError('')
    // Si se cierra el modal mientras estaba escaneando, reiniciar el estado de scanning
    if (isScanning) setIsScanning(false)
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleRfidInputChange = (e) => {
    setRfidInput(e.target.value)
    if (rfidError) {
      setRfidError('')
    }
  }
  const handleScanRfid = () => {
    // Cuando el usuario pulse Scanear, enfocamos el input para que pueda pegar/escanear
    logger.info('Iniciando escaneo RFID (esperando input del usuario)...')
    setIsScanning(true)
    // Enfocar y seleccionar el input si está disponible
    requestAnimationFrame(() => {
      if (rfidInputRef.current) {
        try {
          rfidInputRef.current.focus()
          rfidInputRef.current.select()
        } catch (err) {
          // ignore
        }
      }
    })
  }

  // Cuando el input se rellene, detener el estado de scanning
  useEffect(() => {
    if (isScanning && rfidInput && rfidInput.trim() !== '') {
      setIsScanning(false)
      logger.info('RFID detectado en input, deteniendo spinner')
    }
  }, [rfidInput, isScanning])

  const handleActivateSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      
      // Validar que existan los datos requeridos
      if (!selectedEstudiante?.id) {
        setRfidError('Falta el ID del estudiante')
        setIsSubmitting(false)
        return
      }
      
      // Validar que se haya ingresado un RFID
      if (!rfidInput || rfidInput.trim() === '') {
        setRfidError('Debe ingresar un RFID')
        setIsSubmitting(false)
        return
      }
      
      // Endpoint POST /students/activate
      // Los parámetros student_id y rfid_id van en el body (cambio crítico del backend)
      logger.info('Activando estudiante con student_id:', selectedEstudiante.id, 'rfid_id:', rfidInput)
      
      // Usar la función activateStudent del API
      const response = await activateStudent(selectedEstudiante.id, rfidInput)
      
      logger.event('STUDENT_ACTIVATED', { 
        student_id: selectedEstudiante.id,
        rfid_id: rfidInput
      })
      
      // Esperar un momento para que el backend actualice
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recargar lista de estudiantes
      const branchId = JSON.parse(localStorage.getItem('user') || '{}')?.id
      if (branchId) {
        const data = await searchStudents(branchId)
        logger.info('Datos recargados después de activación:', data)
        
        // Normalizar usando normalizeStudentList
        const estudiantesArray = normalizeStudentList(data).map(estudiante => ({
          id: estudiante.id,
          nombre: estudiante.name,
          rfid: estudiante.rfid,
          creditos: estudiante.credits,
          state: estudiante.state,
          parent_id: estudiante.parentId,
          school: estudiante.school,
          course: estudiante.course,
          tope: estudiante.limit
        }))
        
        setEstudiantes(estudiantesArray)
        logger.info('Total estudiantes actualizados:', estudiantesArray.length)
      }
      
      // Mostrar toast de éxito
      setToast({
        message: 'Cuenta activada exitosamente',
        type: 'success'
      })
      
      handleCloseActivateModal()
    } catch (error) {
      logger.error('Error al activar cuenta:', error)
      setToast({
        message: 'Error al activar la cuenta. Intenta nuevamente.',
        type: 'error'
      })
      setRfidError('Error al activar la cuenta. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRechargeAccount = (estudiante) => {
    setSelectedEstudiante(estudiante)
    setCreditAmount('')
    setCreditError('')
    setIsRechargeModalOpen(true)
  }

  const handleCloseRechargeModal = () => {
    setIsRechargeModalOpen(false)
    setSelectedEstudiante(null)
    setCreditAmount('')
    setCreditError('')
    // Asegurar que el scanner quede detenido al cerrar el modal
    if (isScanning) setIsScanning(false)
  }

  const handleCreditAmountChange = (e) => {
    const value = e.target.value
    // Solo permitir números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCreditAmount(value)
      if (creditError) {
        setCreditError('')
      }
    }
  }

  const handleRechargeSubmit = async (e) => {
    e.preventDefault()
    
    if (!creditAmount.trim()) {
      setCreditError('El monto es requerido')
      return
    }

    const amount = parseFloat(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      setCreditError('Ingrese un monto válido mayor a 0')
      return
    }

    // Validar que el estudiante tenga RFID
    if (!selectedEstudiante?.rfid || selectedEstudiante.rfid === 'Pendiente') {
      setCreditError('Este estudiante no tiene RFID asignado')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Endpoint: PATCH /students/{rfid}/add_credits
      // Convertir rfid a string para asegurar el formato correcto
      const rfid = String(selectedEstudiante.rfid)
      logger.info('Recargando cuenta del estudiante:', selectedEstudiante.nombre, 'RFID:', rfid, 'Monto:', amount)
      
      // Usar la función addCredits del API
      await addCredits(rfid, amount)
      
      logger.event('STUDENT_RECHARGED', { rfid, amount })
      
      // Mostrar toast de éxito
      setToast({
        message: `Recarga exitosa: $${amount} créditos agregados`,
        type: 'success'
      })
      
      // Esperar un momento para que el backend actualice
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recargar lista de estudiantes
      const branchId = JSON.parse(localStorage.getItem('user') || '{}')?.id
      if (branchId) {
        const data = await searchStudents(branchId)
        logger.info('Datos recargados después de recarga:', data)
        
        // Normalizar usando normalizeStudentList
        const estudiantesFormateados = normalizeStudentList(data).map(estudiante => ({
          id: estudiante.id,
          nombre: estudiante.name,
          rfid: estudiante.rfid,
          creditos: estudiante.credits,
          state: estudiante.state,
          parent_id: estudiante.parentId,
          school: estudiante.school,
          course: estudiante.course,
          tope: estudiante.limit
        }))
        
        setEstudiantes(estudiantesFormateados)
        logger.info('Total estudiantes actualizados:', estudiantesFormateados.length)
      }
      
      handleCloseRechargeModal()
    } catch (error) {
      logger.error('Error al recargar cuenta:', error)
      setCreditError('Error al recargar la cuenta. Intenta nuevamente.')
      setToast({
        message: 'Error al recargar la cuenta',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funciones para eliminar estudiante
  const handleDeleteClick = (estudiante) => {
    setSelectedEstudiante(estudiante)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (isSubmitting) return
    setIsDeleteModalOpen(false)
    setSelectedEstudiante(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedEstudiante?.id) return

    try {
      setIsSubmitting(true)
      logger.info('Eliminando estudiante:', selectedEstudiante.id)

      await deleteStudent(selectedEstudiante.id)

      // Actualizar la lista eliminando el estudiante
      setEstudiantes(prev => prev.filter(e => e.id !== selectedEstudiante.id))

      setToast({
        message: 'Estudiante eliminado exitosamente',
        type: 'success'
      })

      handleCloseDeleteModal()
    } catch (error) {
      logger.error('Error al eliminar estudiante:', error)
      setToast({
        message: 'Error al eliminar el estudiante',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate('/branch')
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Filtrar estudiantes en tiempo real
  const filteredEstudiantes = estudiantes.filter((estudiante) => {
    // Si está activo el filtro de pendientes, solo mostrar los que NO tienen RFID asignado
    if (showOnlyPending) {
      const sinRfid = !estudiante.rfid || 
                      estudiante.rfid === 'Pendiente' || 
                      estudiante.rfid === 'No asignado' || 
                      estudiante.rfid === '' || 
                      estudiante.rfid === 'N/A'
      if (!sinRfid) return false
    }

    const searchLower = searchTerm.toLowerCase()
    const nombreMatch = estudiante.nombre.toLowerCase().includes(searchLower)
    const rfidMatch = (estudiante.rfid || '').toLowerCase().includes(searchLower)
    const escuelaMatch = (estudiante.school || '').toLowerCase().includes(searchLower)
    const cursoMatch = (estudiante.course || '').toLowerCase().includes(searchLower)
    return nombreMatch || rfidMatch || escuelaMatch || cursoMatch
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
            Lista de estudiantes
          </h3>

          {/* Buscador */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, escuela o curso..."
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
            {/* Filtro: mostrar solo IDs pendientes */}
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showOnlyPending}
                  onChange={(e) => setShowOnlyPending(e.target.checked)}
                  className="w-4 h-4"
                />
                Por activar (RFID pendiente)
              </label>
            </div>
            {/* Contador de resultados */}
            {searchTerm && (
              <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm mt-2 ml-1">
                {filteredEstudiantes.length} {filteredEstudiantes.length === 1 ? 'resultado' : 'resultados'} encontrado{filteredEstudiantes.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {/* Lista de estudiantes */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#FDB913] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredEstudiantes.length > 0 ? (
              filteredEstudiantes.map((estudiante) => (
                <div
                  key={estudiante.id}
                  className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] transition-all duration-200 animate-slideIn"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-light-text dark:text-dark-text text-[15px] sm:text-base md:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 truncate">
                        {estudiante.nombre}
                      </h4>
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm">
                          Créditos: <span className="font-semibold text-[#FDB913]">$ {estudiante.creditos.toFixed(1)}</span>
                        </p>
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm">
                          ID: <span className="font-mono">{estudiante.rfid}</span>
                        </p>
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm">
                          Escuela: <span className="font-medium">{estudiante.school || 'No especificada'}</span>
                        </p>
                        <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm">
                          Curso: <span className="font-medium">{estudiante.course || 'No especificado'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                      {/* Botón Activar RFID - solo mostrar si el RFID no está asignado (sin RFID real) */}
                      {(!estudiante.rfid || estudiante.rfid === 'Pendiente' || estudiante.rfid === 'No asignado' || estudiante.rfid === '' || estudiante.rfid === 'N/A') && (
                        <button
                          onClick={() => handleActivateAccount(estudiante)}
                          className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 hover:rotate-12 hover:scale-110"
                          aria-label="Activar RFID"
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
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                            />
                          </svg>
                        </button>
                      )}

                      {/* Botón Recargar */}
                      <button
                        onClick={() => handleRechargeAccount(estudiante)}
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                        aria-label="Recargar cuenta"
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => handleDeleteClick(estudiante)}
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                        aria-label="Eliminar estudiante"
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
                  No se encontraron estudiantes
                </p>
                <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-base mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Activar cuenta */}
      <Modal 
        isOpen={isActivateModalOpen} 
        onClose={handleCloseActivateModal}
        title="Activar cuenta"
        showCloseButton={true}
        showIcon={false}
        blockInteractions={isScanning}
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Nombre del estudiante */}
          <div className="flex items-center gap-2 px-1">
            <svg 
              className="w-5 h-5 sm:w-6 sm:h-6 text-light-text dark:text-dark-text flex-shrink-0" 
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
            <p className="text-light-text dark:text-dark-text text-sm sm:text-base font-medium truncate">
              {selectedEstudiante?.nombre || ''}
            </p>
          </div>

          {/* Título */}
          <div>
            <h3 className="text-light-text dark:text-dark-text text-sm sm:text-base font-semibold">
              Digite el rfid manual (opcional)
            </h3>
          </div>

          <form onSubmit={handleActivateSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo RFID con floating label */}
            <div className="relative">
              <input
                type="text"
                id="rfid-input"
                name="rfid"
                ref={rfidInputRef}
                value={rfidInput}
                onChange={handleRfidInputChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  rfidError 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="rfid-input" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  rfidInput 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                RFID
              </label>
              {rfidError && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{rfidError}</p>
              )}
            </div>

            {/* Botón Escanear */}
            <button
              type="button"
              onClick={handleScanRfid}
              disabled={isScanning}
              aria-disabled={isScanning}
              className={`w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${isScanning ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Escaneando...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
                    />
                  </svg>
                  <span>Scanear</span>
                </>
              )}
            </button>

            {/* Botón Activar */}
            <button
              type="submit"
              className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md"
            >
              Activar
            </button>
          </form>
        </div>
      </Modal>

      {/* Modal Recargar cuenta */}
      <Modal 
        isOpen={isRechargeModalOpen} 
        onClose={handleCloseRechargeModal}
        title="Recargar cuenta"
        showCloseButton={true}
        showIcon={false}
        blockInteractions={isScanning}
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Nombre del estudiante */}
          <div className="flex items-center gap-2 px-1">
            <svg 
              className="w-5 h-5 sm:w-6 sm:h-6 text-light-text dark:text-dark-text flex-shrink-0" 
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
            <p className="text-light-text dark:text-dark-text text-sm sm:text-base font-medium truncate">
              {selectedEstudiante?.nombre || ''}
            </p>
          </div>

          {/* Información del RFID */}
          <div className="text-center bg-gray-100 dark:bg-[#1a1a1a] py-2 sm:py-3 rounded-lg">
            <p className="text-light-text dark:text-dark-text text-sm sm:text-base font-semibold">
              RFID: <span className="text-[#FDB913]">{selectedEstudiante?.rfid || '12345'}</span>
            </p>
          </div>

          {/* Título */}
          <div>
            <h3 className="text-light-text dark:text-dark-text text-sm sm:text-base font-semibold">
              Digite el valor a recargar
            </h3>
          </div>

          <form onSubmit={handleRechargeSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo Número de créditos con floating label */}
            <div className="relative">
              <input
                type="text"
                id="credit-input"
                name="creditos"
                value={creditAmount}
                onChange={handleCreditAmountChange}
                className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                  creditError 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                }`}
              />
              <label 
                htmlFor="credit-input" 
                className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                  creditAmount 
                    ? 'top-2 text-xs' 
                    : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                }`}
              >
                Numero de creditos
              </label>
              {creditError && (
                <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{creditError}</p>
              )}
            </div>

            {/* Botón Recargar */}
            <button
              type="submit"
              className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md"
            >
              Recargar
            </button>
          </form>
        </div>
      </Modal>

      {/* Modal Eliminar Estudiante */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={handleCloseDeleteModal}
        title="Eliminar estudiante"
        showCloseButton={true}
        showIcon={false}
        blockInteractions={isSubmitting}
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Advertencia */}
          <div className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <svg 
              className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <div>
              <p className="text-red-800 dark:text-red-300 text-sm sm:text-base font-semibold">
                ¿Estás seguro de eliminar este estudiante?
              </p>
              <p className="text-red-700 dark:text-red-400 text-xs sm:text-sm mt-1">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Información del estudiante */}
          <div className="space-y-2 p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center gap-2">
              <svg 
                className="w-5 h-5 text-light-text-secondary dark:text-gray-400 flex-shrink-0" 
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
              <p className="text-light-text dark:text-dark-text text-sm sm:text-base font-medium">
                {selectedEstudiante?.nombre || ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg 
                className="w-5 h-5 text-light-text-secondary dark:text-gray-400 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                />
              </svg>
              <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm">
                RFID: <span className="font-mono">{selectedEstudiante?.rfid || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 dark:bg-[#3a3a3c] hover:bg-gray-300 dark:hover:bg-[#4a4a4c] text-light-text dark:text-dark-text font-semibold py-3 sm:py-3.5 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 sm:py-3.5 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

export default EstudiantesBranch
