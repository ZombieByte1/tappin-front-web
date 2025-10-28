import { useState, useEffect, useRef } from 'react'
import logoTappin from '../../assets/logoTappin.png'
import LogoutModal from '../../components/LogoutModal'
import { useScroll } from '../../context/ScrollContext'
import { useLogout } from '../../hooks/useLogout'
import { getData } from '../../services/api'
import logger from '../../utils/logger'

const SuperAdminDashboard = () => {
  const { saveScroll, getScroll } = useScroll()
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal, confirmLogout } = useLogout()
  const [isScrolled, setIsScrolled] = useState(false)
  const containerRef = useRef(null)
  const scrollKey = '/super-admin'

  // Estados para datos del backend
  const [stats, setStats] = useState({
    clientesTotales: 0,
    sucursalesTotales: 0,
    padresRegistrados: 0,
    estudiantesActivos: 0
  })
  const [clientes, setClientes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar datos del backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Obtener estadísticas
        const statsData = await getData('/admin/stats')
        setStats(statsData)

        // Obtener clientes
        const clientesData = await getData('/admin/clients')
        setClientes(clientesData)

        logger.info('Datos de Super Admin cargados exitosamente')
      } catch (err) {
        logger.error('Error al cargar datos de Super Admin:', err)
        setError('Error al cargar los datos. Por favor, intenta nuevamente.')
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

  const handleDetalles = (clienteId) => {
    logger.info('Ver detalles del cliente:', clienteId)
    // TODO: Navegar a página de detalles del cliente
  }

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

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
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
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.clientesTotales}</p>
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
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.sucursalesTotales}</p>
              </div>
            </div>
          </div>

          {/* Padres registrados */}
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">Padres registrados</p>
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.padresRegistrados.toLocaleString()}</p>
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
                <p className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold">{stats.estudiantesActivos.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <div className="bg-white dark:bg-[#2a2b2e] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#3a3a3c] overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-[#3a3a3c]">
            <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-bold">Clientes</h3>
          </div>

          {/* Tabla para desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#3a3a3c]">
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Restaurante</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Administrador</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Tipo de Cuenta</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Estado</th>
                  <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-semibold p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-gray-200 dark:border-[#3a3a3c] hover:bg-gray-50 dark:hover:bg-[#1b1c1e] transition-colors">
                    <td className="p-4 text-light-text dark:text-dark-text text-sm">{cliente.restaurante}</td>
                    <td className="p-4">
                      <p className="text-light-text dark:text-dark-text text-sm font-medium">{cliente.administrador}</p>
                      <p className="text-primary text-xs">{cliente.email}</p>
                    </td>
                    <td className="p-4 text-light-text dark:text-dark-text text-sm">{cliente.tipoCuenta}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        cliente.estado === 'activo' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700'
                      }`}>
                        {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDetalles(cliente.id)}
                        className="bg-primary hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-semibold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                      >
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards para móvil/tablet */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-[#3a3a3c]">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-[#1b1c1e] transition-colors">
                <div className="space-y-2.5 sm:space-y-3">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Restaurante</p>
                    <p className="text-light-text dark:text-dark-text text-sm font-medium">{cliente.restaurante}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Administrador</p>
                    <p className="text-light-text dark:text-dark-text text-sm font-medium">{cliente.administrador}</p>
                    <p className="text-primary text-xs">{cliente.email}</p>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Tipo de Cuenta</p>
                      <p className="text-light-text dark:text-dark-text text-sm">{cliente.tipoCuenta}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-1">Estado</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cliente.estado === 'activo' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700'
                      }`}>
                        {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDetalles(cliente.id)}
                    className="w-full bg-primary hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </main>

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
