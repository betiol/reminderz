import AuthProvider from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { UserPreferencesProvider } from './context/UserPreferencesContext'
import { ThemeProvider } from './context/ThemeContext'
import { setupNotificationListener } from './lib/firebase'
import { AppRoutes } from './routes'
import { BrowserRouter as Router } from 'react-router-dom'
import { useToast } from './context/ToastContext'
import { useEffect } from 'react'

const NotificationHandler: React.FC = () => {
  const { showToast } = useToast()

  useEffect(() => {
    const unsubscribe = setupNotificationListener((payload) => {
      console.log('Notificação recebida:', payload)

      if (payload.notification) {
        const { title, body } = payload.notification

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title || 'Nova notificação', {
            body: body || 'Você recebeu uma nova notificação'
          })
        } else {
          showToast('info', `${title}: ${body}`)
        }
      }
    })

    return () => {
      //@ts-ignore
      if (unsubscribe) unsubscribe()
    }
  }, [showToast])

  return null
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <UserPreferencesProvider>
          <ThemeProvider>
            <Router>
              <NotificationHandler />
              <AppRoutes />
            </Router>
          </ThemeProvider>
        </UserPreferencesProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
