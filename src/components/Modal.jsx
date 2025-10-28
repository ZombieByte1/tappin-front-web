import { useEffect, useState } from 'react'

const Modal = ({ isOpen, onClose, children, title, showIcon = true, showCloseButton = true, blockInteractions = false }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Manejar animaciones de apertura y cierre
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setShouldRender(false), 300)
    }
  }, [isOpen])

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!shouldRender) return null

  return (
    <>
      {/* Backdrop oscuro con blur */}
      <div 
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => {
          // Si blockInteractions está activo, no cerramos el modal al hacer click en el backdrop
          if (blockInteractions) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          onClose()
        }}
      />
      
      {/* Modal contenedor centrado */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Contenedor del modal con scroll */}
        <div className="relative w-full max-w-[540px] max-h-[90vh] overflow-y-auto pointer-events-auto">
        {/* Modal con fondo sólido */}
        <div 
          className={`relative w-full rounded-2xl sm:rounded-[20px] px-6 sm:px-8 md:px-10 py-6 sm:py-7 md:py-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 ease-out ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{ 
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1b1c1e' : '#fffefe'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            // Si blockInteractions está activo, evitar que clicks dentro del modal
            // provoquen blur/focus en inputs. Permitimos clicks en elementos marcados con data-scan-allow
            if (blockInteractions) {
              const allow = e.target && e.target.closest && e.target.closest('[data-scan-allow]')
              if (!allow) {
                e.preventDefault()
                e.stopPropagation()
                return false
              }
            }
          }}
          // Cuando blockInteractions es true, desactivar interacciones dentro del modal (evita que clicks internos desenfoquen inputs)
          data-block-interactions={blockInteractions}
          aria-hidden={blockInteractions}
        >
        {/* Header - solo se muestra si hay icono, título o botón de cerrar */}
        {(showIcon || title || showCloseButton) && (
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            {/* Icono - solo si showIcon es true */}
            {showIcon && (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center border border-gray-300 dark:border-[#3a3a3c]">
                <svg 
                  className="w-6 h-6 text-light-text dark:text-dark-text" 
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
            )}
            
            {/* Título */}
            {title && (
              <h2 className="flex-1 text-light-text dark:text-dark-text text-[19px] sm:text-[21px] md:text-2xl font-semibold transition-colors duration-200">
                {title}
              </h2>
            )}
            
            {/* Botón cerrar - solo si showCloseButton es true */}
            {showCloseButton && (
              <button
                onClick={onClose}
                data-scan-allow="true"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md group ${blockInteractions ? 'pointer-events-auto' : ''}`}
                aria-label="Cerrar modal"
              >
                <svg 
                  className="w-5 h-5 text-black transition-transform duration-200 group-hover:rotate-90" 
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
        )}

        {/* Contenido */}
        <div className={`${blockInteractions ? 'pointer-events-none select-none' : ''}`}>
          {children}
        </div>
      </div>
        </div>
      </div>
    </>
  )
}

export default Modal
