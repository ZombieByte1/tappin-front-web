import Modal from './Modal'

/**
 * Modal de confirmación para cerrar sesión
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {function} onConfirm - Callback para confirmar logout
 */
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showIcon={false} showCloseButton={false}>
      <div className="text-center px-2 sm:px-4 py-2">
        {/* Icono profesional con círculo rojo */}
        <div className="mb-4 sm:mb-6 flex justify-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-500"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{ animation: 'fadeSlide 2s ease-in-out infinite' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-light-text dark:text-dark-text text-lg sm:text-xl font-bold mb-2 sm:mb-3">
          ¿Cerrar sesión?
        </h3>

        {/* Mensaje */}
        <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
          ¿Estás seguro que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-[#3a3a3c] dark:hover:bg-[#4a4a4c] text-light-text dark:text-dark-text font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 sm:py-4 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg 
              className="w-5 h-5" 
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
            Cerrar sesión
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default LogoutModal
