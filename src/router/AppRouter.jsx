import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'

// Pages - Organizadas por rol
import Login from '../pages/Login'
import SuperAdminDashboard from '../pages/super_admin/Inicio_admin'
import BranchDashboard from '../pages/branch/Inicio_Branch'
import PadresBranch from '../pages/branch/Padres_Branch'
import EstudiantesBranch from '../pages/branch/Estudiantes_Branch'
import CobrarBranch from '../pages/branch/Cobrar_Branch'
import ClientAdminDashboard from '../pages/client_admin/Inicio_Client'
import ParentDashboard from '../pages/parent/Inicio_Parent'
import ChildDetails from '../pages/parent/Detalle_Hijo'

const AppRouter = () => {
  const { ROLES } = useAuth()

  return (
    <>
      <Routes>
        {/* Ruta de Login sin protección */}
        <Route path="/" element={<Login />} />
        
        {/* Dashboard Super Admin */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Branch */}
        <Route
          path="/branch"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BRANCH]}>
              <BranchDashboard />
            </ProtectedRoute>
          }
        />

        {/* Padres - Branch */}
        <Route
          path="/branch/padres"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BRANCH]}>
              <PadresBranch />
            </ProtectedRoute>
          }
        />

        {/* Estudiantes - Branch */}
        <Route
          path="/branch/estudiantes"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BRANCH]}>
              <EstudiantesBranch />
            </ProtectedRoute>
          }
        />

        {/* Cobrar - Branch */}
        <Route
          path="/branch/cobrar"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BRANCH]}>
              <CobrarBranch />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Client Admin */}
        <Route
          path="/client-admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENT_ADMIN]}>
              <ClientAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Parent (Padres de Familia) */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Detalles del hijo */}
        <Route
          path="/parent/child/:childId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ChildDetails />
            </ProtectedRoute>
          }
        />

        {/* Página de No Autorizado */}
        <Route 
          path="/unauthorized" 
          element={
            <div className="min-h-screen bg-[#1b1c1e] flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-white text-4xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-gray-400 mb-6">No tienes permisos para acceder a esta página</p>
                <a href="/" className="bg-[#FDB913] hover:bg-[#fcc000] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200">
                  Volver al Login
                </a>
              </div>
            </div>
          }
        />

        {/* Ruta por defecto - redirige a login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default AppRouter
