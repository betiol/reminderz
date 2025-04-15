import React, { createContext, useContext, useEffect, useState } from 'react'
import { Theme, getSavedTheme, applyTheme, getSystemTheme } from '@/lib/utils'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  
  useEffect(() => {
    const savedTheme = getSavedTheme()
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = getSystemTheme()
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(systemTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}