import { Category } from "./category"

export interface RecurrenceConfig {
  active: boolean
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  endDate?: string | null
  daysOfWeek?: number[] 
}

export interface Task {
  _id: string
  title: string
  description?: string
  date: string
  time: string
  priority: 'baixa' | 'média' | 'alta'
  category: Category 
  reminderTime?: number 
  user?: string
  createdAt: string
  updatedAt?: string
  completed: boolean
  recurrence?: RecurrenceConfig
}

export interface CreateTaskDto {
  title: string
  description?: string
  date: string
  time: string
  priority: 'baixa' | 'média' | 'alta'
  category: string 
  reminderTime?: number
  completed?: boolean
  recurrence?: RecurrenceConfig
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  completed?: boolean
}

export interface TaskStats {
  overview: {
    total: number
    completed: number
    completion_rate: number
  }
  today: {
    total: number
    completed: number
    completion_rate: number
  }
  week: {
    total: number
    completed: number
    completion_rate: number
  }
  month: {
    total: number
    completed: number
    completion_rate: number
  }
  categories: {
    category: string
    name: string
    icon: string
    total: number
    completed: number
  }[]
  priorities: {
    priority: string
    total: number
    completed: number
  }[]
}
