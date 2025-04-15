import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task'
import { TaskService } from '@/services/taskService'
import { TaskList } from '@/components/task/TaskList'
import { TaskForm } from '@/components/task/TaskForm'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SearchContext } from '@/components/layout/Layout'
import moment from 'moment-timezone'

export const HomePage: React.FC = () => {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { searchQuery } = useContext(SearchContext)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const { data } = await TaskService.getTasks()
      //@ts-ignore
      setTasks(data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setIsLoading(false)
    }
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

      const updatedTask = await TaskService.toggleTaskComplete(id)

      //@ts-ignore
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          //@ts-ignore
          task._id === updatedTask._id ? updatedTask : task
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error)

      setTasks((prevTasks) => [...prevTasks])

    }
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    try {
      const taskToDeleteData = tasks.find((task) => task._id === taskToDelete)
      if (!taskToDeleteData) return

      setTasks((prevTasks) =>
        prevTasks.filter((task) => task._id !== taskToDelete)
      )

      showToast('info', `Excluindo tarefa "${taskToDeleteData.title}"...`)

      await TaskService.deleteTask(taskToDelete)

      showToast(
        'success',
        `Tarefa "${taskToDeleteData.title}" excluída com sucesso!`
      )
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)

      fetchTasks()

      showToast('error', 'Erro ao excluir tarefa. Tente novamente.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setTaskToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
  }

  const handleAddNew = () => {
    setSelectedTask(undefined)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        const optimisticTask = {
          ...selectedTask,
          ...data,
          updatedAt: new Date().toISOString()
        }

        //@ts-ignore
        setTasks((prevTasks) =>
          //@ts-ignore
          prevTasks.map((task) =>
            //@ts-ignore
            task._id === selectedTask._id ? optimisticTask : task
          )
        )


        const updatedTask = await TaskService.updateTask(selectedTask._id, data)

        //@ts-ignore
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            //@ts-ignore
            task._id === updatedTask._id ? updatedTask : task
          )
        )

        showToast('success', 'Tarefa atualizada com sucesso!')
      } else {
        const tempId = 'temp-' + Date.now()

        const optimisticTask = {
          _id: tempId,
          ...data,
          user: currentUser?._id,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        //@ts-ignore
        setTasks((prevTasks) => [...prevTasks, optimisticTask])

        //@ts-ignore
        const newTask = await TaskService.createTask(data as CreateTaskDto)

        //@ts-ignore
        setTasks((prevTasks) => {
          const filteredTasks = prevTasks.filter((task) => task._id !== tempId)
          //@ts-ignore
          return [...filteredTasks, newTask]
        })

        fetchTasks()

        showToast('success', 'Tarefa criada com sucesso!')
      }

      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      showToast('error', 'Erro ao salvar tarefa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  console.log(currentUser?.timezone)

  const filteredTasks = searchQuery
    ? tasks?.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description &&
            task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (task.category?.name &&
            task.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          task.priority.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks

  const getTodayTasks = (filteredTasks: Task[]) => {
    const userTimezone =
      currentUser?.timezone || moment.tz.guess()

    const todayInUserTZ = moment().tz(userTimezone).startOf('day')

    return filteredTasks?.filter((task) => {
      if (!task.date) return false

      const taskDateInUserTZ = moment(task.date).tz(userTimezone).startOf('day')
      
      return taskDateInUserTZ.isSame(todayInUserTZ, 'day')
    })
  }

  //@ts-ignore
  const upcomingTasks = TaskService.getUpcomingTasks(filteredTasks)

  const overdueTasks = filteredTasks?.filter((task) => {
    if (!task.date || task.completed) return false
    
    const userTimezone = currentUser?.timezone || moment.tz.guess()
    
    const nowInUserTZ = moment().tz(userTimezone)
    
    const taskDateInUserTZ = moment(task.date).tz(userTimezone)
    
    return taskDateInUserTZ.isBefore(nowInUserTZ, 'day')
  })

  const todayTasks = getTodayTasks(filteredTasks)

  console.log(todayTasks)

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : searchQuery ? (
          <div className="grid grid-cols-1 gap-6">
            <TaskList
              tasks={filteredTasks}
              title={`Resultados da pesquisa: "${searchQuery}" (${filteredTasks.length})`}
              emptyMessage={`Nenhuma tarefa encontrada para "${searchQuery}"`}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onAddNew={handleAddNew}
              showAddButton={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2">
              <TaskList
                tasks={todayTasks}
                title="Tarefas de Hoje"
                emptyMessage="Nenhuma tarefa para hoje. Aproveite seu dia!"
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onAddNew={handleAddNew}
                showAddButton={true}
              />
            </div>

            <div className="col-span-1">
              <TaskList
            //@ts-ignore

                tasks={upcomingTasks}
                title="Próximos Dias"
                emptyMessage="Nenhuma tarefa nos próximos dias."
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />

              <div className="bg-card rounded-lg shadow-sm p-6 mt-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/15 transition-colors"
                    onClick={() => navigate('/tasks-by-status?status=today')}
                  >
                    <span className="text-sm text-gray-600">Tarefas Hoje</span>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {todayTasks.length}
                    </div>
                  </div>

                  <div
                    className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() =>
                      navigate('/tasks-by-status?status=completed')
                    }
                  >
                    <span className="text-sm text-gray-600">Completas</span>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {todayTasks.filter((t) => t.completed).length}
                    </div>
                  </div>

                  <div
                    className="p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => navigate('/tasks-by-status?status=overdue')}
                  >
                    <span className="text-sm text-gray-600">Em Atraso</span>
                    <div className="text-2xl font-bold text-amber-600 mt-1">
                      {overdueTasks.length}
                    </div>
                  </div>

                  <div
                    className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => navigate('/tasks-by-status?status=upcoming')}
                  >
                    <span className="text-sm text-gray-600">Esta Semana</span>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {todayTasks.length + upcomingTasks.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isFormOpen && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          onDelete={handleDeleteClick}
          isLoading={isSubmitting}
        />
      )}

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Excluir Tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Excluir"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  )
}
