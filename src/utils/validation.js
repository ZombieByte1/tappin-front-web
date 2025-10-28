/**
 * Utilidades de validación de formularios
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida longitud mínima de contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {boolean} - true si es válida
 */
export const isValidPassword = (password, minLength = 6) => {
  return password && password.length >= minLength
}

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} - true si no está vacío
 */
export const isRequired = (value) => {
  return value && value.trim().length > 0
}

/**
 * Valida un formulario completo
 * @param {Object} formData - Datos del formulario
 * @param {Object} rules - Reglas de validación por campo
 * @returns {Object} - Objeto con errores por campo
 * 
 * Ejemplo de uso:
 * const rules = {
 *   email: [
 *     { validator: isRequired, message: 'El correo es requerido' },
 *     { validator: isValidEmail, message: 'El correo no es válido' }
 *   ],
 *   password: [
 *     { validator: isRequired, message: 'La contraseña es requerida' },
 *     { validator: (val) => isValidPassword(val, 6), message: 'Mínimo 6 caracteres' }
 *   ]
 * }
 */
export const validateForm = (formData, rules) => {
  const errors = {}

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field]
    const value = formData[field]

    for (const rule of fieldRules) {
      if (!rule.validator(value)) {
        errors[field] = rule.message
        break // Solo mostrar el primer error por campo
      }
    }
  })

  return errors
}

