import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getCurrentUserToken } from '@/lib/firebase'


export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  count?: number
  total?: number
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}


const apiClient: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 
})


apiClient.interceptors.request.use(
  //@ts-ignore
  async (config: AxiosRequestConfig) => {
    try {
      
      const token = await getCurrentUserToken()

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    } catch (error) {
      console.error('Erro ao obter token para requisição:', error)
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)


apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        
        const token = await getCurrentUserToken()

        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)


export class ApiService {
  
  static async get<T>(
    endpoint: string,
    params?: object
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(endpoint, { params })
      return response.data
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  
  static async post<T>(
    endpoint: string,
    data: object
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(endpoint, data)
      return response.data
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  
  static async put<T>(endpoint: string, data: object): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put<ApiResponse<T>>(endpoint, data)
      return response.data
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  
  static async patch<T>(
    endpoint: string,
    data: object
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch<ApiResponse<T>>(endpoint, data)
      return response.data
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  
  static async delete<T>(endpoint: string, params?: object): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(endpoint, { params })
      return response.data
    } catch (error: any) {
      this.handleError(error)
      throw error
    }
  }

  
  private static handleError(error: any): void {
    
    let errorMessage = 'Ocorreu um erro inesperado'

    if (error.response) {
      
      const serverError = error.response.data
      errorMessage = serverError.error || serverError.message || errorMessage
      console.error('Erro na API:', error.response.status, errorMessage)
    } else if (error.request) {
      
      errorMessage = 'Servidor não respondeu à requisição'
      console.error('Erro na requisição:', errorMessage)
    } else {
      
      errorMessage = error.message || errorMessage
      console.error('Erro:', errorMessage)
    }

    
    
  }
}


export { apiClient }

export default ApiService
