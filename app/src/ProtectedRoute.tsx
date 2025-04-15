import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { MainLayout } from './components/layout/Layout'

//@ts-ignore
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <MainLayout>{children}</MainLayout>
}

export { ProtectedRoute }
