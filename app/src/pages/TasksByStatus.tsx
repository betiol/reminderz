import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Filter } from 'lucide-react'
import { TaskList } from '../components/task/TaskList'
import { TaskForm } from '../components/task/TaskForm'
import {
  TaskService,
  TaskStatus,
  filterTasksByStatus
} from '../services/taskService'
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/task'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import dateService from '../services/dateService'
import { useToast } from '../context/ToastContext'
import { useAuth } from '@/context/AuthContext'

const statusLabels: Record<TaskStatus, string> = {
  today: 'Tarefas de Hoje',
  completed: 'Tarefas Completas',
  overdue: 'Tarefas em Atraso',
  upcoming: 'Próximas Tarefas',
  all: 'Todas as Tarefas'
}

const TasksByStatus: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TaskStatus>(
    (searchParams.get('status') as TaskStatus) || 'all'
  )
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await TaskService.getTasks()
        if (response.success && response.data) {
          //@ts-ignore
          setTasks(response.data)
        } else {
          showToast('error', 'Erro ao carregar tarefas')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tasks', error)
        showToast('error', 'Erro ao carregar tarefas')
        setLoading(false)
      }
    }

    fetchTasks()
  }, [showToast])

  useEffect(() => {
    
    let filtered = filterTasksByStatus(
      //@ts-ignore
      tasks,
      statusFilter,
      //@ts-ignore
      currentUser?.timezone
    )

    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((task) => task.category === categoryFilter)
    }
            //@ts-ignore

    setFilteredTasks(filtered)
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    categoryFilter,
    currentUser?.timezone
  ])

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as TaskStatus)
    navigate(`/tasks-by-status?status=${value}`, { replace: true })
  }

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
  }

  const handleToggleComplete = async (id: string) => {
    try {
      
      const taskToToggle = tasks.find((task) => task._id === id)
      if (!taskToToggle) return

      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === id ? { ...task, completed: !task.completed } : task
        )
      )

      
      await TaskService.toggleTaskComplete(id)

      showToast('success', 'Status da tarefa atualizado')
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error)
      showToast('error', 'Erro ao atualizar status da tarefa')

      
      setTasks((prevTasks) => [...prevTasks])
    }
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const taskToDelete = tasks.find((task) => task._id === id)
      if (!taskToDelete) return

      
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id))

      await TaskService.deleteTask(id)
      showToast(
        'success',
        `Tarefa "${taskToDelete.title}" excluída com sucesso!`
      )
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      showToast('error', 'Erro ao excluir tarefa. Tente novamente.')

      
      const response = await TaskService.getTasks()
      if (response.success && response.data) {
            //@ts-ignore

        setTasks(response.data)
      }
    }
  }

  const handleFormSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        
        const updatedTask = await TaskService.updateTask(
          selectedTask._id,
          //@ts-ignore
          data as UpdateTaskDto
        )
        if (updatedTask.success && updatedTask.data) {
          
          //@ts-ignore
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task._id === selectedTask._id ? updatedTask.data : task
            )
          )
          showToast('success', 'Tarefa atualizada com sucesso!')
        }
      } else {
        
        //@ts-ignore
        const newTask = await TaskService.createTask(data as CreateTaskDto)
        if (newTask.success && newTask.data) {
          
          //@ts-ignore
          setTasks((prevTasks) => [...prevTasks, newTask.data])
          showToast('success', 'Tarefa criada com sucesso!')
        }
      }

      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      showToast('error', 'Erro ao salvar tarefa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => navigate(-1)

  return (
    <div className="container p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{statusLabels[statusFilter]}</h1>
        </div>

        <div className="text-sm text-muted-foreground">
          {/* @ts-ignore */}
          {dateService.formatDate(new Date(), currentUser.timezone)}
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </h2>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tarefas</SelectItem>
                <SelectItem value="today">Tarefas de Hoje</SelectItem>
                <SelectItem value="completed">Tarefas Completas</SelectItem>
                <SelectItem value="overdue">Tarefas em Atraso</SelectItem>
                <SelectItem value="upcoming">Próximas Tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Prioridade</label>
            <Select value={priorityFilter} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="média">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="saúde">Saúde</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Carregando tarefas...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <TaskList
            tasks={filteredTasks}
            title={statusLabels[statusFilter]}
            emptyMessage="Nenhuma tarefa encontrada"
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">
              Nenhuma tarefa encontrada com os filtros atuais.
            </p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default TasksByStatus
