import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ScrollProvider } from './context/ScrollContext'
import { useTheme } from './hooks/useTheme'
import AppRouter from './router/AppRouter'

function App() {
  // Inicializar el tema automático basado en preferencias del sistema
  useTheme()

  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollProvider>
          <AppRouter />
        </ScrollProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
