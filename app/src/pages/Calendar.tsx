import React, { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { TaskService } from '@/services/taskService'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TaskForm } from '@/components/task/TaskForm'

export const CalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const startDay = getDay(monthStart)

  useEffect(() => {
    fetchTasks()
  }, [currentDate])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const {data} = await TaskService.getTasks()
      //@ts-ignore
      setTasks(data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const prevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.date) return false;
      
      const dateParts = task.date.split('T')[0].split('-');
      const taskYear = parseInt(dateParts[0]);
      const taskDay = parseInt(dateParts[2]);
      
      return (
        day.getFullYear() === taskYear &&
        day.getMonth() === taskMonth &&
        day.getDate() === taskDay
      );
    });
  }

  const handleTaskClick = (task: Task) => {
    console.log({task})
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      const updatedTask = await TaskService.updateTask(selectedTask._id, data)
      //@ts-ignore
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          //@ts-ignore
          task._id === updatedTask._id ? updatedTask : task
        )
      )
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTaskTime = (time: string) => {
    return time && time.length >= 5 ? time.substring(0, 5) : time;
  }

  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate()
    );
  }

  return (
    <>
      <header className="bg-card shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Calendário</h2>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium px-2">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-sm font-semibold text-center py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array(startDay)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="h-24 p-1 rounded-md"
                  ></div>
                ))}

              {monthDays.map((day) => {
                const dayTasks = getTasksForDay(day)
                const todayCheck = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 p-1 border rounded-md overflow-y-auto ${
                      todayCheck
                        ? 'bg-primary/5 border-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {format(day, 'd')}
                    </div>

                    {dayTasks.map((task) => (
                      <div
                        key={task._id}
                        className={`text-xs p-1 mb-1 rounded truncate cursor-pointer ${
                          task.completed
                            ? 'bg-gray-100 text-gray-500 line-through'
                            : getPriorityColorClass(task.priority)
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        {formatTaskTime(task.time)} {task.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {isFormOpen && selectedTask && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleUpdateTask}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </>
  )
}

const getPriorityColorClass = (priority: string) => {
  switch (priority) {
    case 'alta':
      return 'bg-red-100 text-red-800'
    case 'média':
      return 'bg-amber-100 text-amber-800'
    case 'baixa':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}