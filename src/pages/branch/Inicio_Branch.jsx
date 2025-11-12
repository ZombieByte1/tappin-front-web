import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logoTappin from '../../assets/logoTappin.png'
import Modal from '../../components/Modal'
import LogoutModal from '../../components/LogoutModal'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'

const BranchDashboard = () => {
  const navigate = useNavigate()
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const containerRef = useRef(null)
  const scrollKey = '/branch'

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

  const handleEstudiantesClick = () => {
    navigate('/branch/estudiantes')
  }

  const handlePadresClick = () => {
    navigate('/branch/padres')
  }

  const handleTransaccionesClick = () => {
    setIsDevModalOpen(true)
  }

  const handleCobrarClick = () => {
    navigate('/branch/cobrar')
  }

  const handleCloseDevModal = () => {
    setIsDevModalOpen(false)
  }

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
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <img src={logoTappin} alt="Tappin Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" />
                <h1 className="text-light-text dark:text-dark-text text-base sm:text-lg md:text-xl font-bold truncate">
                  Tappin - Sucursal
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

        <main 
          className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
          style={{
            animation: 'slideIn 0.4s ease-out both'
          }}
        >
          <h2 className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">
            Panel Sucursal
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Card de Estudiantes */}
            <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-primary dark:hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg animate-slideIn">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">
                    Estudiantes
                  </h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs sm:text-sm leading-relaxed">
                    Gestionar estudiantes de la sucursal
                  </p>
                </div>
              </div>
              <button 
                onClick={handleEstudiantesClick}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-black font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm hover:scale-105 active:scale-95"
              >
                Ver estudiantes
              </button>
            </div>

            {/* Card de Transacciones */}
            <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-primary dark:hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg animate-slideIn" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">
                    Transacciones
                  </h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs sm:text-sm leading-relaxed">
                    Ver transacciones del día
                  </p>
                </div>
              </div>
              <button 
                onClick={handleTransaccionesClick}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-black font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm hover:scale-105 active:scale-95"
              >
                Ver transacciones
              </button>
            </div>

            {/* Card de Padres - Staff */}
            <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-primary dark:hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg animate-slideIn" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary" 
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">
                    Padres - Staff
                  </h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs sm:text-sm leading-relaxed">
                    Gestión de padres y staff
                  </p>
                </div>
              </div>
              <button 
                onClick={handlePadresClick}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-black font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm hover:scale-105 active:scale-95"
              >
                Gestionar
              </button>
            </div>

            {/* Card de Cobrar */}
            <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#3a3a3c] hover:border-primary dark:hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg animate-slideIn" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary" 
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">
                    Cobrar
                  </h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs sm:text-sm leading-relaxed">
                    Realizar cobros a estudiantes
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCobrarClick}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-black font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm hover:scale-105 active:scale-95"
              >
                Cobrar
              </button>
            </div>
          </div>
        </main>
      </div>

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

      {/* Modal Cerrar Sesión */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={closeLogoutModal} 
        onConfirm={confirmLogout} 
      />
    </>
  )
}

export default BranchDashboard
