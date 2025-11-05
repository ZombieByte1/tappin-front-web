import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ScrollProvider } from './context/ScrollContext'
import { useTheme } from './hooks/useTheme'
import AppRouter from './router/AppRouter'
import { Analytics } from "@vercel/analytics/react"

function App() {

  useTheme()

  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollProvider>
          <AppRouter />
          <Analytics />
        </ScrollProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App