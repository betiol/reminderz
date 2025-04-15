import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastContainer, ToastType } from '@/components/ui/toast'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Date.now().toString()
    setToasts((prevToasts) => [...prevToasts, { id, type, message }])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  const handleClose = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <ToastContainer>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={() => handleClose(toast.id)}
            />
          ))}
        </ToastContainer>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}