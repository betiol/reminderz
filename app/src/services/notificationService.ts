
import ApiService, { ApiResponse } from './api'
import { listenToNotificationCount } from '@/lib/firebase'


export interface Notification {
  _id: string
  user: string
  title: string
  body: string
  data: any
  type: 'task_reminder' | 'task_updated' | 'system'
  read: boolean
  sentToDevice: boolean
  createdAt: string
  updatedAt: string
}


export class NotificationService {
  
  static async getNotifications(filters?: {
    read?: boolean
    type?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<Notification[]>> {
    return ApiService.get<Notification[]>('/notifications', filters)
  }

  
  static async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return ApiService.patch<Notification>(`/notifications/${id}/read`, {})
  }

  
  static async markAllAsRead(): Promise<
    ApiResponse<{ count: number; message: string }>
  > {
    return ApiService.patch<{ count: number; message: string }>(
      '/notifications/mark-all-read',
      {}
    )
  }

  
  static async deleteNotification(id: string): Promise<ApiResponse<{}>> {
    return ApiService.delete<{}>(`/notifications/${id}`)
  }

  
  static async deleteAllNotifications(filters?: {
    read?: boolean
  }): Promise<ApiResponse<{ count: number; message: string }>> {
    return ApiService.delete<{ count: number; message: string }>(
      '/notifications',
      //@ts-ignore
      { params: filters }
    )
  }

  
  static async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return ApiService.get<{ count: number }>('/notifications/unread-count')
  }

  
  static setupUnreadCountListener(
    userId: string,
    callback: (count: number) => void
  ): () => void {
    
    return listenToNotificationCount(userId, callback)
  }

  
  static setupPushNotifications(): void {
    
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações push')
      return
    }

    
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Permissão para notificações concedida')
        }
      })
    }
  }

  
  static formatNotificationTime(date: string): string {
    const notificationDate = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - notificationDate.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffMins < 1) {
      return 'agora'
    } else if (diffMins < 60) {
      return `${diffMins} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`
    } else if (diffDays === 1) {
      return 'ontem'
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return notificationDate.toLocaleDateString('pt-BR')
    }
  }

  
  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'task_reminder':
        return 'bell'
      case 'task_updated':
        return 'refresh-cw'
      case 'system':
        return 'info'
      default:
        return 'message-circle'
    }
  }

  
  static getNotificationColor(type: string): string {
    switch (type) {
      case 'task_reminder':
        return 'bg-amber-100 text-amber-800'
      case 'task_updated':
        return 'bg-blue-100 text-blue-800'
      case 'system':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}

export default NotificationService
