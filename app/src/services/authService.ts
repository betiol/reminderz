
import ApiService, { ApiResponse } from './api'
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  getCurrentUserToken,
  requestNotificationPermission
} from '@/lib/firebase'
import { User as FirebaseUser } from 'firebase/auth'


export interface User {
  _id: string
  name: string
  email: string
  profilePicture?: string
  timezone?: string
  notificationPreferences: {
    email: boolean
    push: boolean
    reminderTime: number
  }
}

export interface NotificationPreferences {
  email?: boolean
  push?: boolean
  reminderTime?: number
}


export class AuthService {
  
  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    try {
      
      const firebaseUser = await registerWithEmail(email, password)

      
      const firebaseToken = await firebaseUser.getIdToken()

      
      const response = await ApiService.post<User>('/auth/session', {
        firebaseToken,
        name
      })

      if (!response.success || !response.data) {
        throw new Error('Erro ao criar sessão no servidor')
      }

      
      await this.registerForPushNotifications(firebaseUser)

      return response.data
    } catch (error) {
      console.error('Erro no registro:', error)
      throw error
    }
  }

  
  static async login(email: string, password: string): Promise<User> {
    try {
      
      const firebaseUser = await loginWithEmail(email, password)

      
      const firebaseToken = await firebaseUser.getIdToken()

      
      const response = await ApiService.post<User>('/auth/session', {
        firebaseToken
      })

      if (!response.success || !response.data) {
        throw new Error('Erro ao criar sessão no servidor')
      }

      await this.registerForPushNotifications(firebaseUser)

      return response.data
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  
  static async logout(): Promise<boolean> {
    try {
      
      const fcmToken = localStorage.getItem('fcmToken')
      if (fcmToken) {
        //@ts-ignore
        await ApiService.delete('/auth/fcm-token', { params: { fcmToken } })
        localStorage.removeItem('fcmToken')
      }

      
      await logoutUser()

      return true
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }

  
  static async updateNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<ApiResponse<NotificationPreferences>> {
    return ApiService.put<NotificationPreferences>(
      '/auth/notification-preferences',
      preferences
    )
  }

  
  static async registerForPushNotifications(
    //@ts-ignore
    firebaseUser: FirebaseUser
  ): Promise<void> {
    try {
      
      const fcmToken = await requestNotificationPermission()

      console.log('fcmToken', fcmToken)

      if (fcmToken) {
        
        localStorage.setItem('fcmToken', fcmToken)

        
        await ApiService.post('/auth/register-fcm-token', { fcmToken })

        console.log('Registrado para notificações push')
      }
    } catch (error) {
      console.error('Erro ao registrar para notificações push:', error)
    }
  }

  
  static isAuthenticated(): boolean {
    
    
    return localStorage.getItem('user') !== null
  }

  
  //@ts-ignore
  static async getCurrentUser(): Promise<User> {
    try {
      const data = await ApiService.get<User>('/users/profile')
      //@ts-ignore
      return data
    } catch (error) {}
  }

  
  static setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user))
  }

  
  static clearCurrentUser(): void {
    localStorage.removeItem('user')
  }

  
  static async refreshSession(): Promise<User | null> {
    try {
      
      const firebaseToken = await getCurrentUserToken()

      
      const response = await ApiService.post<User>('/auth/session', {
        firebaseToken
      })

      if (response.success && response.data) {
        
        this.setCurrentUser(response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      return null
    }
  }

  
  static async checkAndRefreshSession(): Promise<boolean> {
    
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      
      await getCurrentUserToken()
      return true
    } catch (error) {
      
      this.clearCurrentUser()
      return false
    }
  }
}

export default AuthService
