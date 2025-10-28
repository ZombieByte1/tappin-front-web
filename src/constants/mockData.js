/**
 * Datos mock para desarrollo
 * NOTA: Estos datos serán reemplazados por llamadas al backend
 */

// Mock data para estudiantes
export const MOCK_ESTUDIANTES = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    creditos: 50.0,
    rfid: 'ABC123',
    escuela: 'Junior Chef Academy',
    curso: '5to Grado'
  },
  {
    id: 2,
    nombre: 'María García',
    creditos: 30.5,
    rfid: 'DEF456',
    escuela: 'Colegio San José',
    curso: '6to Grado'
  },
  {
    id: 3,
    nombre: 'Pedro López',
    creditos: 0.0,
    rfid: '',
    escuela: 'Junior Chef Academy',
    curso: '4to Grado'
  },
  {
    id: 4,
    nombre: 'Ana Martínez',
    creditos: 75.25,
    rfid: 'GHI789',
    escuela: 'Escuela Central',
    curso: '5to Grado'
  }
]

// Mock data para padres
export const MOCK_PADRES = [
  {
    id: 1,
    nombre: 'Carlos Rodríguez',
    email: 'carlos@example.com'
  },
  {
    id: 2,
    nombre: 'Laura Sánchez',
    email: 'laura@example.com'
  },
  {
    id: 3,
    nombre: 'Miguel Torres',
    email: 'miguel@example.com'
  },
  {
    id: 4,
    nombre: 'Sofia Ramírez',
    email: 'sofia@example.com'
  }
]

// Mock data para hijos (parent dashboard)
export const MOCK_HIJOS = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    escuela: 'Junior Chef Academy',
    curso: '5to Grado',
    creditos: 50.0,
    ultimaRecarga: '2024-01-15',
    estado: 'activo'
  },
  {
    id: 2,
    nombre: 'María Pérez',
    escuela: 'Junior Chef Academy',
    curso: '3er Grado',
    creditos: 30.5,
    ultimaRecarga: '2024-01-10',
    estado: 'activo'
  }
]

// Mock data para transacciones
export const MOCK_TRANSACCIONES = [
  {
    id: 1,
    fecha: '2024-01-20 14:30',
    descripcion: 'Almuerzo - Menú del día',
    monto: -12.50,
    saldoAnterior: 50.00,
    saldoActual: 37.50
  },
  {
    id: 2,
    fecha: '2024-01-19 12:15',
    descripcion: 'Snack - Sándwich',
    monto: -5.00,
    saldoAnterior: 55.00,
    saldoActual: 50.00
  },
  {
    id: 3,
    fecha: '2024-01-18 10:00',
    descripcion: 'Recarga de créditos',
    monto: 30.00,
    saldoAnterior: 25.00,
    saldoActual: 55.00
  },
  {
    id: 4,
    fecha: '2024-01-17 13:45',
    descripcion: 'Almuerzo - Pizza',
    monto: -15.00,
    saldoAnterior: 40.00,
    saldoActual: 25.00
  }
]

// Mock data para sucursales (client admin)
export const MOCK_SUCURSALES = [
  {
    id: 1,
    nombre: 'Sucursal Centro',
    email: 'centro@example.com'
  },
  {
    id: 2,
    nombre: 'Sucursal Norte',
    email: 'norte@example.com'
  },
  {
    id: 3,
    nombre: 'Sucursal Sur',
    email: 'sur@example.com'
  },
  {
    id: 4,
    nombre: 'Sucursal Este',
    email: 'este@example.com'
  }
]

// Mock data para clientes (super admin)
export const MOCK_CLIENTES = [
  {
    id: 1,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Premium',
    estado: 'activo'
  },
  {
    id: 2,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Custom',
    estado: 'activo'
  },
  {
    id: 3,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Basica',
    estado: 'activo'
  },
  {
    id: 4,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Estandar',
    estado: 'activo'
  },
  {
    id: 5,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Premium',
    estado: 'inactivo'
  },
  {
    id: 6,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Estandar',
    estado: 'inactivo'
  },
  {
    id: 7,
    restaurante: 'Junior Chef Academy',
    administrador: 'Jhon Doe',
    email: 'jhondoe@gmail.com',
    tipoCuenta: 'Estandar',
    estado: 'inactivo'
  }
]

// Mock data para estadísticas (super admin)
export const MOCK_STATS = {
  clientesTotales: 7,
  sucursalesTotales: 24,
  padresRegistrados: 2208,
  estudiantesActivos: 2800
}
