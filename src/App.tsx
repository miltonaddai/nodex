import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppRoutes } from '@/routes/AppRoutes'
import { Toaster } from '@/components/ui/toaster'
import { EarlySignalWatcher } from '@/components/dashboard/EarlySignalWatcher'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
          <EarlySignalWatcher />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
