/**
 * Normalizadores centralizados para datos del backend
 * 
 * Estos normalizadores convierten los datos del backend a un formato
 * consistente y fácil de usar en el frontend.
 */

/**
 * Normaliza un estudiante del backend
 * @param {Object} student - Estudiante del backend
 * @returns {Object} - Estudiante normalizado
 */
export const normalizeStudent = (student) => {
  if (!student) return null
  
  return {
    id: student.id,
    rfid: student.rfid_id || 'Pendiente',
    name: student.name,
    credits: student.credits || 0,
    state: student.state || false,
    parentId: student.parent_id,
    staffId: student.staff_id,
    limit: student.tope || 0,  // Backend usa 'tope', frontend usa 'limit'
    tope: student.tope || 0,   // Mantener ambos para compatibilidad
    school: student.school || '',
    course: student.course || ''
  }
}

/**
 * Normaliza una lista de estudiantes
 * @param {Array|Object} students - Array de estudiantes del backend o objeto con propiedad 'data'
 * @returns {Array} - Array de estudiantes normalizados
 */
export const normalizeStudentList = (students) => {
  // Si viene un objeto con propiedad 'students', extraer el array
  if (students && students.students && Array.isArray(students.students)) {
    return students.students.map(normalizeStudent)
  }
  
  // Si viene un objeto con propiedad 'data', extraer el array
  if (students && students.data && Array.isArray(students.data)) {
    return students.data.map(normalizeStudent)
  }
  
  // Si viene directamente un array
  if (!Array.isArray(students)) return []
  return students.map(normalizeStudent)
}

/**
 * Normaliza un padre del backend
 * @param {Object} parent - Padre del backend
 * @returns {Object} - Padre normalizado
 */
export const normalizeParent = (parent) => {
  if (!parent) return null
  
  return {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    rol: parent.rol,
    branchId: parent.branch_id
  }
}

/**
 * Normaliza una lista de padres
 * @param {Array|Object} parents - Array de padres del backend o objeto con propiedad 'data'
 * @returns {Array} - Array de padres normalizados
 */
export const normalizeParentList = (parents) => {
  // Si viene un objeto con propiedad 'data', extraer el array
  if (parents && parents.data && Array.isArray(parents.data)) {
    return parents.data.map(normalizeParent)
  }
  
  // Si viene directamente un array
  if (!Array.isArray(parents)) return []
  return parents.map(normalizeParent)
}

/**
 * Normaliza una sucursal del backend
 * @param {Object} branch - Sucursal del backend
 * @returns {Object} - Sucursal normalizada
 */
export const normalizeBranch = (branch) => {
  if (!branch) return null
  
  return {
    id: branch.id,
    name: branch.name,
    email: branch.email,
    rol: branch.rol,
    clientAdminId: branch.client_admin_id,
    location: branch.location
  }
}

/**
 * Normaliza una lista de sucursales
 * @param {Array|Object} branches - Array de sucursales del backend o objeto con propiedad 'data'
 * @returns {Array} - Array de sucursales normalizadas
 */
export const normalizeBranchList = (branches) => {
  // Si viene un objeto con propiedad 'data', extraer el array
  if (branches && branches.data && Array.isArray(branches.data)) {
    return branches.data.map(normalizeBranch)
  }
  
  // Si viene directamente un array
  if (!Array.isArray(branches)) return []
  return branches.map(normalizeBranch)
}

/**
 * Normaliza un cliente del backend
 * @param {Object} client - Cliente del backend
 * @returns {Object} - Cliente normalizado
 */
export const normalizeClient = (client) => {
  if (!client) return null
  
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    rol: client.rol,
    superAdminId: client.super_admin_id,
    tier: client.tier,
    maxStudents: client.max_students
  }
}

/**
 * Normaliza una transacción del backend
 * @param {Object} transaction - Transacción del backend
 * @returns {Object} - Transacción normalizada
 */
export const normalizeTransaction = (transaction) => {
  if (!transaction) return null
  
  return {
    id: transaction.id,
    studentId: transaction.student_id,
    rfidUsed: transaction.rfid_used,
    product: transaction.product,
    price: transaction.price,
    currentCredits: transaction.current_credits,
    timestamp: transaction.timestamp
  }
}

/**
 * Normaliza una lista de transacciones
 * @param {Array|Object} transactions - Array de transacciones del backend o objeto con propiedad 'data'
 * @returns {Array} - Array de transacciones normalizadas
 */
export const normalizeTransactionList = (transactions) => {
  // Si viene un objeto con propiedad 'data', extraer el array
  if (transactions && transactions.data && Array.isArray(transactions.data)) {
    return transactions.data.map(normalizeTransaction)
  }
  
  // Si viene directamente un array
  if (!Array.isArray(transactions)) return []
  return transactions.map(normalizeTransaction)
}

/**
 * Normaliza un usuario (cualquier rol) del backend
 * @param {Object} user - Usuario del backend
 * @returns {Object} - Usuario normalizado
 */
export const normalizeUser = (user) => {
  if (!user) return null
  
  const normalized = {
    id: user.id,
    name: user.name,
    email: user.email,
    rol: user.rol,
    role: user.rol  // Alias para compatibilidad
  }
  
  // Agregar campos específicos según el rol
  if (user.branch_id) normalized.branchId = user.branch_id
  if (user.client_admin_id) normalized.clientAdminId = user.client_admin_id
  if (user.super_admin_id) normalized.superAdminId = user.super_admin_id
  if (user.location) normalized.location = user.location
  if (user.tier) normalized.tier = user.tier
  if (user.max_students !== undefined) normalized.maxStudents = user.max_students
  
  return normalized
}

/**
 * Desnormaliza un estudiante para enviarlo al backend (crear)
 * @param {Object} student - Estudiante del frontend
 * @returns {Object} - Estudiante para el backend
 */
export const denormalizeStudentCreate = (student) => {
  const payload = {
    name: student.name
  }
  
  // Campos opcionales
  if (student.credits !== undefined) payload.credits = student.credits
  if (student.parentId !== undefined) payload.parent_id = student.parentId
  if (student.staffId !== undefined) payload.staff_id = student.staffId
  if (student.tope !== undefined) payload.tope = student.tope
  if (student.school) payload.school = student.school
  if (student.course) payload.course = student.course
  
  return payload
}

/**
 * Desnormaliza un estudiante para actualizarlo
 * @param {Object} student - Estudiante del frontend
 * @returns {Object} - Estudiante para el backend
 */
export const denormalizeStudentUpdate = (student) => {
  const payload = {}
  
  if (student.name !== undefined) payload.name = student.name
  if (student.rfid !== undefined) payload.rfid_id = student.rfid
  if (student.credits !== undefined) payload.credits = student.credits
  if (student.state !== undefined) payload.state = student.state
  // Manejar tanto 'limit' como 'tope' - backend espera 'tope'
  if (student.limit !== undefined) payload.tope = student.limit
  if (student.tope !== undefined) payload.tope = student.tope
  if (student.school !== undefined) payload.school = student.school
  if (student.course !== undefined) payload.course = student.course
  
  return payload
}

/**
 * Desnormaliza un padre para crear
 * @param {Object} parent - Padre del frontend
 * @returns {Object} - Padre para el backend
 */
export const denormalizeParentCreate = (parent) => {
  return {
    name: parent.name,
    email: parent.email,
    password: parent.password,
    branch_id: parent.branchId
  }
}

/**
 * Desnormaliza un padre para actualizar
 * @param {Object} parent - Padre del frontend
 * @returns {Object} - Padre para el backend
 */
export const denormalizeParentUpdate = (parent) => {
  const payload = {}
  
  if (parent.name !== undefined) payload.name = parent.name
  if (parent.email !== undefined) payload.email = parent.email
  if (parent.password !== undefined) payload.password = parent.password
  
  return payload
}

/**
 * Desnormaliza una sucursal para crear
 * @param {Object} branch - Sucursal del frontend
 * @returns {Object} - Sucursal para el backend
 */
export const denormalizeBranchCreate = (branch) => {
  const payload = {
    name: branch.name,
    email: branch.email,
    password: branch.password,
    client_admin_id: branch.clientAdminId
  }
  
  if (branch.location) payload.location = branch.location
  
  return payload
}

/**
 * Desnormaliza una sucursal para actualizar
 * @param {Object} branch - Sucursal del frontend
 * @returns {Object} - Sucursal para el backend
 */
export const denormalizeBranchUpdate = (branch) => {
  const payload = {}
  
  if (branch.name !== undefined) payload.name = branch.name
  if (branch.email !== undefined) payload.email = branch.email
  if (branch.password !== undefined) payload.password = branch.password
  if (branch.location !== undefined) payload.location = branch.location
  
  return payload
}

/**
 * Desnormaliza una transacción para crear
 * @param {Object} transaction - Transacción del frontend
 * @returns {Object} - Transacción para el backend
 */
export const denormalizeTransactionCreate = (transaction) => {
  return {
    rfid: transaction.rfid,
    product: transaction.product,
    price: transaction.price
  }
}

export default {
  // Normalizers
  normalizeStudent,
  normalizeStudentList,
  normalizeParent,
  normalizeParentList,
  normalizeBranch,
  normalizeBranchList,
  normalizeClient,
  normalizeTransaction,
  normalizeTransactionList,
  normalizeUser,
  
  // Denormalizers
  denormalizeStudentCreate,
  denormalizeStudentUpdate,
  denormalizeParentCreate,
  denormalizeParentUpdate,
  denormalizeBranchCreate,
  denormalizeBranchUpdate,
  denormalizeTransactionCreate
}
