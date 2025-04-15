import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthService, User } from '@/services/authService'
import { NotificationService } from '@/services/notificationService'
import ApiService from '@/services/api'

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Erro ao configurar persistência de autenticação:', error)
})

interface AuthContextType {
  currentUser: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  updateUserTimezone: (timezone: string) => Promise<void>
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<User | null>
  getCurrentUser: () => Promise<User>
  updateNotificationPreferences: (preferences: {
    email?: boolean
    push?: boolean
    reminderTime?: number
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenRefreshTimeout, setTokenRefreshTimeout] =
    useState<NodeJS.Timeout | null>(null)

  const syncSessionWithBackend = async (user: FirebaseUser) => {
    try {

      localStorage.setItem('firebaseToken', firebaseToken)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ firebaseToken })
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCurrentUser(data.data)
          AuthService.setCurrentUser(data.data)
          await getCurrentUser()

          NotificationService.setupPushNotifications()

          if (tokenRefreshTimeout) {
            clearTimeout(tokenRefreshTimeout)
          }

          const refreshTimeout = setTimeout(
            () => {
              if (user) syncSessionWithBackend(user)
            },
            55 * 60 * 1000

          setTokenRefreshTimeout(refreshTimeout)

          return data.data
        }
      } else {
        console.error('Erro na resposta do servidor:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao sincronizar sessão com o backend:', error)
    }
    return null
  }

  const getCurrentUser = async (): Promise<User> => {
    try {
      const data = await AuthService.getCurrentUser()
      setCurrentUser(data)
      return data
    } catch (error) {
      throw error
    }
  }

  const updateUserTimezone = async (timezone: string): Promise<void> => {
    try {
      if (!currentUser) return

      await ApiService.put('/api/users/timezone', { timezone })

      setCurrentUser((prev) => (prev ? { ...prev, timezone } : null))
    } catch (error) {
      console.error('Erro ao atualizar timezone:', error)
      throw error
    }
  }

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        'Estado de autenticação alterado:',
        user ? `Usuário: ${user.email}` : 'Deslogado'
      )
      setFirebaseUser(user)

      if (user) {
        await syncSessionWithBackend(user)
      } else {
        setCurrentUser(null)
        AuthService.clearCurrentUser()
        localStorage.removeItem('firebaseToken')

        if (tokenRefreshTimeout) {
          clearTimeout(tokenRefreshTimeout)
          setTokenRefreshTimeout(null)
        }
      }

      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout)
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true)
    try {
      const user = await AuthService.login(email, password)
      setCurrentUser(user)
      setLoading(false)
      return user
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    setLoading(true)
    try {
      const user = await AuthService.register(name, email, password)
      setCurrentUser(user)
      setLoading(false)
      return user
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    try {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout)
        setTokenRefreshTimeout(null)
      }

      await AuthService.logout()
      setCurrentUser(null)
      localStorage.removeItem('firebaseToken')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setLoading(false)
    }
  }

  //@ts-ignore
  const updateProfile = async (data: Partial<User>): Promise<User | null> => {
    if (!currentUser) return null

    try {
      const response = await ApiService.put<User>('/users/profile', data)
      AuthService.setCurrentUser({ ...currentUser, ...response.data })

      return null
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return null
    }
  }

  const updateNotificationPreferences = async (preferences: {
    email?: boolean
    push?: boolean
    reminderTime?: number
  }): Promise<void> => {
    if (!currentUser) return

    try {
      const response =
        await AuthService.updateNotificationPreferences(preferences)
      if (response.success && response.data) {
        const updatedUser = {
          ...currentUser,
          notificationPreferences: {
            ...currentUser.notificationPreferences,
            ...preferences
          }
        }
        setCurrentUser(updatedUser)
        AuthService.setCurrentUser(updatedUser)
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências de notificação:', error)
    }
  }

  const value = {
    currentUser,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateNotificationPreferences,
    updateUserTimezone,
    getCurrentUser
  }
  //@ts-ignore
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
