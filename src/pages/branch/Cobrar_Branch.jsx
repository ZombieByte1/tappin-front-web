import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import Toast from '../../components/Toast'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { postData, patchData } from '../../services/api'
import { validateForm, isRequired } from '../../utils/validation'
import { RFID_SCAN_DELAY } from '../../constants'
import logger from '../../utils/logger'

const CobrarBranch = () => {
  const navigate = useNavigate()
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const [rfidInput, setRfidInput] = useState('')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [toast, setToast] = useState(null)
  const containerRef = useRef(null)
  const rfidInputRef = useRef(null)
  // overlayRef removed in favor of a body-level pointer-events gating approach
  const scrollKey = '/branch/cobrar'

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

  const handleRfidInputChange = (e) => {
    setRfidInput(e.target.value)
    if (errors.rfid) {
      setErrors(prev => ({ ...prev, rfid: '' }))
    }
  }

  const handleProductNameChange = (e) => {
    setProductName(e.target.value)
    if (errors.productName) {
      setErrors(prev => ({ ...prev, productName: '' }))
    }
  }

  const handlePriceChange = (e) => {
    const value = e.target.value
    // Solo permitir números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value)
      if (errors.price) {
        setErrors(prev => ({ ...prev, price: '' }))
      }
    }
  }

  const handleScanRfid = () => {
    // Focus y seleccionar el input para que el scanner/paste lo complete
    logger.info('Iniciando escaneo RFID (focus en input)...')
    setIsScanning(true)
    if (rfidInputRef.current) {
      try {
        rfidInputRef.current.focus()
        rfidInputRef.current.select()
      } catch (err) {
        // ignore
      }
    }
  }

  const handleCancelScan = () => {
    logger.info('Cancelando escaneo RFID')
    setIsScanning(false)
    // quitar foco del input para evitar que el scanner siga escribiendo ahí accidentalmente
    try {
      if (rfidInputRef.current) {
        rfidInputRef.current.blur()
      }
    } catch (err) {
      // ignore
    }
  }

  // Cuando el input se llena, detener el spinner de escaneo
  useEffect(() => {
    if (isScanning && rfidInput) {
      setIsScanning(false)
    }
  }, [rfidInput, isScanning])

  // Enfoque alternativo: al activar el escaneo desactivamos pointer-events en el body
  // y solo activamos pointer-events en elementos marcados con data-scan-allow="true".
  // Esto evita problemas con stacking contexts y asegura que esos botones NUNCA queden bloqueados.
  useEffect(() => {
    if (!isScanning) return

    const prevBodyPointer = document.body.style.pointerEvents
    const modified = []

    try {
      // Desactivar interacciones globales
      document.body.style.pointerEvents = 'none'

      // Habilitar solo los elementos permitidos
      const allowed = document.querySelectorAll('[data-scan-allow]')
      allowed.forEach((el) => {
        // Guardar estilos previos
        modified.push({ el, prevPointer: el.style.pointerEvents, prevZ: el.style.zIndex })
        el.style.pointerEvents = 'auto'
        // Asegurar que estén encima visualmente
        el.style.zIndex = (parseInt(el.style.zIndex || '0', 10) < 99999) ? '99999' : el.style.zIndex
      })
    } catch (err) {
      // ignore
    }

    // Restaurar cuando se desactiva el mode de escaneo
    return () => {
      try {
        document.body.style.pointerEvents = prevBodyPointer || ''
        modified.forEach(({ el, prevPointer, prevZ }) => {
          el.style.pointerEvents = prevPointer || ''
          el.style.zIndex = prevZ || ''
        })
      } catch (err) {
        // ignore
      }
    }
  }, [isScanning])

  const validateFormData = () => {
    const rules = {
      rfid: [
        { validator: isRequired, message: 'El RFID es requerido' }
      ],
      productName: [
        { validator: isRequired, message: 'El nombre del producto es requerido' }
      ],
      price: [
        { 
          validator: isRequired, 
          message: 'El precio es requerido' 
        },
        { 
          validator: (value) => {
            const priceValue = parseFloat(value)
            return !isNaN(priceValue) && priceValue > 0
          },
          message: 'Ingrese un precio válido mayor a 0'
        }
      ]
    }

    const formData = {
      rfid: rfidInput,
      productName,
      price
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleChargeSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateFormData()) return

    try {
      setIsSubmitting(true)
      
      const priceValue = parseFloat(price)
      
      // Convertir rfid a string para asegurar el formato correcto
      const rfid = String(rfidInput)
      
      logger.info('=== INICIANDO COBRO ===')
      logger.info('RFID:', rfid)
      logger.info('Producto:', productName)
      logger.info('Precio:', priceValue)
      
      // Registrar la transacción en el historial
      // Este endpoint se encarga de descontar los créditos Y registrar la transacción
      const now = new Date()
      const transactionPayload = {
        product: productName,
        price: priceValue,
        fecha: now.toLocaleDateString('es-ES'),
        timestamp: now.toISOString()
      }
      logger.info('Payload para /transactions/{rfid}:', JSON.stringify(transactionPayload))
      
      const response = await postData(`/transactions/${rfid}`, transactionPayload)
      logger.info('Respuesta del cobro:', response)
      
      logger.event('CHARGE_COMPLETED', { 
        rfid,
        productName, 
        price: priceValue 
      })
      logger.info('=== COBRO COMPLETADO ===')
      
      // Mostrar toast de éxito
      showToast(`Cobro exitoso: $${priceValue} por ${productName}`, 'success')
      
      // Limpiar formulario después de enviar
      setRfidInput('')
      setProductName('')
      setPrice('')
      setErrors({})
    } catch (error) {
      logger.error('=== ERROR EN COBRO ===')
      logger.error('Error completo:', error)
      logger.error('Response data:', error.response?.data)
      logger.error('Response status:', error.response?.status)
      
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Error al realizar el cobro'
      showToast(errorMessage, 'error')
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    // Asegurar que el scanner quede detenido si el usuario se va de la página
    if (isScanning) setIsScanning(false)
    navigate('/branch')
  }

  return (
    <>
      <div ref={containerRef} className="page-container min-h-screen bg-light-bg dark:bg-dark-bg">
        {/* Global overlay that blocks clicks everywhere except on elements marked with data-scan-allow (only when scanning) */}
        {isScanning && (
          <div className="fixed inset-0 z-40" />
        )}
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
                  data-scan-allow="true"
                  className="relative z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
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
                data-scan-allow="true"
                className="relative z-50 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-semibold px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-[13px] sm:text-sm md:text-[15px] shadow-sm hover:shadow-md flex items-center gap-2 group"
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
            Punto de venta
          </h2>

          {/* Subtítulo */}
          <h3 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-5 md:mb-6">
            Realizar cobro
          </h3>

          {/* Formulario */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-200 dark:border-[#3a3a3c] shadow-sm animate-slideIn">
              {/* Subtítulo del formulario */}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-light-text dark:text-dark-text text-base sm:text-lg font-semibold">
                  Rellene los datos para realizar cobro
                </h3>
              </div>

              <div className="relative">
                <form onSubmit={handleChargeSubmit} className="space-y-4 sm:space-y-5">
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
                      errors.rfid 
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
                    RFID (Manual)
                  </label>
                  {errors.rfid && (
                    <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.rfid}</p>
                  )}
                </div>

                {/* Campo Nombre del producto con floating label */}
                <div className="relative">
                  <input
                    type="text"
                    id="product-name-input"
                    name="productName"
                    value={productName}
                    onChange={handleProductNameChange}
                    className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                      errors.productName 
                        ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                    }`}
                  />
                  <label 
                    htmlFor="product-name-input" 
                    className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                      productName 
                        ? 'top-2 text-xs' 
                        : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                    }`}
                  >
                    Nombre del producto
                  </label>
                  {errors.productName && (
                    <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.productName}</p>
                  )}
                </div>

                {/* Campo Precio con floating label */}
                <div className="relative">
                  <input
                    type="text"
                    id="price-input"
                    name="price"
                    value={price}
                    onChange={handlePriceChange}
                    className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                      errors.price 
                        ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                    }`}
                  />
                  <label 
                    htmlFor="price-input" 
                    className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                      price 
                        ? 'top-2 text-xs' 
                        : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                    }`}
                  >
                    Precio
                  </label>
                  {errors.price && (
                    <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.price}</p>
                  )}
                </div>

                {/* Botón Scan RFID */}
                <button
                  type="button"
                  data-scan-allow="true"
                  onClick={isScanning ? handleCancelScan : handleScanRfid}
                  className={`relative z-50 w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2`}
                >
                  {isScanning ? (
                    <>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Cancelar escaneo</span>
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

                {/* overlay removed: global overlay handles blocking while scanning */}

                {/* Botón Realizar cobro */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base md:text-[17px] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Cobrando...</span>
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
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>Realizar cobro</span>
                    </>
                  )}
                </button>
              </form>
              </div>
            </div>
          </div>
        </main>
      </div>

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

export default CobrarBranch
