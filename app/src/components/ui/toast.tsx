import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  type: ToastType
  message: string
  duration?: number
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      case 'info':
        return 'bg-blue-50'
      case 'warning':
        return 'bg-amber-50'
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200'
      case 'error':
        return 'border-red-200'
      case 'info':
        return 'border-blue-200'
      case 'warning':
        return 'border-amber-200'
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow ${getBackgroundColor()} border ${getBorderColor()}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700"
        aria-label="Close"
        onClick={() => {
          setIsVisible(false)
          if (onClose) onClose()
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export const ToastContainer: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      {children}
    </div>
  )
}