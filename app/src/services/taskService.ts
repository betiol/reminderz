
import ApiService, { ApiResponse } from './api'


export type TaskStatus = 'today' | 'completed' | 'overdue' | 'upcoming' | 'all'


export interface Task {
  _id: string
  title: string
  description?: string
  date: string
  time: string
  priority: 'baixa' | 'média' | 'alta'
  category: 'trabalho' | 'pessoal' | 'saúde' | 'financeiro' | 'social'
  completed: boolean
  user: string
  reminderSent: boolean
  reminderTime: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description?: string
  date: string
  time: string
  priority?: 'baixa' | 'média' | 'alta'
  category?: 'trabalho' | 'pessoal' | 'saúde' | 'financeiro' | 'social'
  reminderTime?: number
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
    total: number
    completed: number
  }[]
  priorities: {
    priority: string
    total: number
    completed: number
  }[]
}


export class TaskService {
  
  static async getTasks(filters?: {
    _id?: string
    completed?: boolean
    category?: string
    priority?: string
    date?: string
    from?: string
    to?: string
    sort?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<Task[]>> {
    return ApiService.get<Task[]>('/tasks', filters)
  }

  
  static async getTask(id: string): Promise<ApiResponse<Task>> {
    return ApiService.get<Task>(`/tasks/${id}`)
  }

  
  static async createTask(task: CreateTaskDto): Promise<ApiResponse<Task>> {
    return ApiService.post<Task>('/tasks', task)
  }

  static getUpcomingTasks = (filteredTasks: Task[]) => {
    if (!filteredTasks || !filteredTasks.length) return []

    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] 

    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0] 

    return filteredTasks.filter((task) => {
      if (!task.date) return false

      
      const taskDateStr = task.date.split('T')[0] 

      
      
      
      return (
        taskDateStr > todayStr && 
        taskDateStr <= nextWeekStr 
      )
    })
  }

  
  static async updateTask(
    id: string,
    task: UpdateTaskDto
  ): Promise<ApiResponse<Task>> {
    return ApiService.put<Task>(`/tasks/${id}`, task)
  }

  
  static async deleteTask(id: string, deleteFuture: boolean = false): Promise<ApiResponse<{}>> {
    const params = deleteFuture ? { deleteFuture: true } : undefined;
    return ApiService.delete<{}>(`/tasks/${id}`, params)
  }

  
  static async toggleTaskComplete(id: string): Promise<ApiResponse<Task>> {
    return ApiService.patch<Task>(`/tasks/${id}/toggle-complete`, {})
  }

  
  static async getTaskStats(): Promise<ApiResponse<TaskStats>> {
    return ApiService.get<TaskStats>('/tasks/stats')
  }

  
  static async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    const today = new Date().toISOString().split('T')[0]
    return this.getTasks({ date: today })
  }

  
  static async getCurrentWeekTasks(): Promise<ApiResponse<Task[]>> {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek

    const startOfWeek = new Date(today)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return this.getTasks({
      from: startOfWeek.toISOString().split('T')[0],
      to: endOfWeek.toISOString().split('T')[0]
    })
  }

  
  static async getOverdueTasks(): Promise<ApiResponse<Task[]>> {
    const today = new Date().toISOString().split('T')[0]

    return this.getTasks({
      to: today,
      completed: false,
      sort: '-date'
    })
  }

  
  static async getTasksByCategory(
    category: string
  ): Promise<ApiResponse<Task[]>> {
    return this.getTasks({ category })
  }
}


export const filterTasksByStatus = (
  tasks: Task[],
  status: TaskStatus
): Task[] => {
  if (!tasks || !tasks.length) return []

  
  
  const today = new Date().toISOString().split('T')[0]

  switch (status) {
    case 'today':
      return tasks.filter((task) => {
        
        return task.date.split('T')[0] === today && !task.completed
      })

    case 'completed':
      return tasks.filter((task) => task.completed)

    case 'overdue':
      return tasks.filter((task) => {
        if (task.completed) return false

        
        const taskDateTime = new Date(
          `${task.date}T${task.time || '00:00'}:00.000Z`
        )
        const nowDate = new Date()

        
        return taskDateTime < nowDate && !task.completed
      })

    case 'upcoming':
      return TaskService.getUpcomingTasks(
        tasks.filter((task) => !task.completed)
      )

    case 'all':
    default:
      return [...tasks]
  }
}


export const getTaskStatusCounts = async (): Promise<
  Record<TaskStatus, number>
> => {
  const response = await TaskService.getTasks()

  if (!response.success || !response.data) {
    return {
      today: 0,
      completed: 0,
      overdue: 0,
      upcoming: 0,
      all: 0
    }
  }

  const tasks = response.data

  return {
    today: filterTasksByStatus(tasks, 'today').length,
    completed: filterTasksByStatus(tasks, 'completed').length,
    overdue: filterTasksByStatus(tasks, 'overdue').length,
    upcoming: filterTasksByStatus(tasks, 'upcoming').length,
    all: tasks.length
  }
}

export default TaskService
