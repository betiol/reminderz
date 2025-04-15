import React, { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { TaskService } from '@/services/taskService'
import { TaskList } from '@/components/task/TaskList'
import { TaskForm } from '@/components/task/TaskForm'
import { parseISO, isThisWeek, isThisMonth } from 'date-fns'

import { Button } from '@/components/ui/button'

export const CompletedTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month'>(
    'all'
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const { data } = await TaskService.getTasks()
      //@ts-ignore
      const completedTasks = data.filter((task) => task.completed)
      //@ts-ignore
      setTasks(completedTasks)

    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await TaskService.deleteTask(id)
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id))
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error)
      }
    }
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const updatedTask = await TaskService.toggleTaskComplete(id)

      if (!completed) {
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id))
      } else {
        //@ts-ignore
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            //@ts-ignore
            task._id === updatedTask._id ? updatedTask : task
          )
        )
      }
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error)
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      const updatedTask = await TaskService.updateTask(selectedTask._id, data)

      //@ts-ignore
      if (!updatedTask.completed) {
        setTasks((prevTasks) =>
          //@ts-ignore
          prevTasks.filter((task) => task._id !== updatedTask._id)
        )
      } else {
        //@ts-ignore
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            //@ts-ignore
            task._id === updatedTask._id ? updatedTask : task
          )
        )
      }

      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const taskDate = parseISO(task.date)

    switch (filterPeriod) {
      case 'week':
        return isThisWeek(taskDate)
      case 'month':
        return isThisMonth(taskDate)
      case 'all':
      default:
        return true
    }
  })

  const tasksByCategory: Record<string, Task[]> = {}

  filteredTasks.forEach((task) => {
    //@ts-ignore
    if (!tasksByCategory[task.category]) {
      //@ts-ignore
      tasksByCategory[task.category] = []
    }
    //@ts-ignore
    tasksByCategory[task.category].push(task)
  })

  Object.keys(tasksByCategory).forEach((category) => {
    tasksByCategory[category].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  return (
    <>
      <header className="bg-card shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Tarefas Concluídas
          </h2>

          <div className="flex items-center space-x-2">
            <Button
              variant={filterPeriod === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('all')}
            >
              Todas
            </Button>
            <Button
              variant={filterPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('month')}
            >
              Este Mês
            </Button>
            <Button
              variant={filterPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPeriod('week')}
            >
              Esta Semana
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma tarefa concluída
            </h3>
            <p className="text-muted-foreground">
              As tarefas que você marcar como concluídas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByCategory).map(
              ([category, categoryTasks]) => (
                <TaskList
                  key={category}
                  tasks={categoryTasks}
                  title={`${
                    category.charAt(0).toUpperCase() + category.slice(1)
                  } (${categoryTasks.length})`}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
      </main>

      {isFormOpen && selectedTask && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </>
  )
}
