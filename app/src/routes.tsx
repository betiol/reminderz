import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { CalendarPage } from './pages/Calendar'
import { CompletedTasksPage } from './pages/CompletedTask'
import { SettingsPage } from './pages/Settings'
import TasksByStatus from './pages/TasksByStatus'
import ReportsPage from './pages/Reports'

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/completed"
        element={
          <ProtectedRoute>
            <CompletedTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tasks-by-status"
        element={
          <ProtectedRoute>
            <TasksByStatus />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Rota de fallback - redireciona para a página inicial */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export { AppRoutes }
