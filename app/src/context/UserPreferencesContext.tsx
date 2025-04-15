import React, { createContext, useContext, useState, useEffect } from 'react'
import AuthService, { NotificationPreferences } from '@/services/authService'
import { useAuth } from './AuthContext'

interface UserPreferences {
  reminderTime: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  reminderTime: 30,
  emailNotifications: false,
  pushNotifications: true,
  taskReminders: true
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { currentUser } = useAuth()
  
 
  useEffect(() => {
   
    if (currentUser?.notificationPreferences) {
      const userPrefs: UserPreferences = {
        reminderTime: currentUser.notificationPreferences.reminderTime || 30,
        emailNotifications: currentUser.notificationPreferences.email || false,
        pushNotifications: currentUser.notificationPreferences.push || true,
        taskReminders: true
      }
      setPreferences(userPrefs)
    } else {
     
      const savedPrefs = localStorage.getItem('userPreferences')
      if (savedPrefs) {
        try {
          const parsedPrefs = JSON.parse(savedPrefs)
          setPreferences({ ...defaultPreferences, ...parsedPrefs })
        } catch (error) {
          console.error('Erro ao carregar preferências do usuário:', error)
        }
      }
    }
  }, [currentUser])
  
 
  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      setIsLoading(true)
      const updatedPrefs = { ...preferences, ...newPrefs }
      setPreferences(updatedPrefs)
      
     
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs))
      
     
      if (currentUser) {
       
        const backendPrefs: NotificationPreferences = {
          email: updatedPrefs.emailNotifications,
          push: updatedPrefs.pushNotifications,
          reminderTime: updatedPrefs.reminderTime
        }
        
       
        await AuthService.updateNotificationPreferences(backendPrefs)
        console.log('Preferências salvas no servidor')
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}