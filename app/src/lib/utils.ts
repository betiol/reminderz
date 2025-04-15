import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Theme = 'light' | 'dark' | 'system'

export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement
  
  root.classList.remove('light', 'dark')
  
  if (theme === 'system') {
    const systemTheme = getSystemTheme()
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
  
  localStorage.setItem('theme', theme)
}

export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('theme') as Theme) || 'light'
}
