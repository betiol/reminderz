import React, { useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  MoreVertical,
  Trash,
  Edit,
  Folder,
  RepeatIcon,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Task } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import dateService from '@/services/dateService'
import { useToast } from '@/context/ToastContext'
import { TaskService } from '@/services/taskService'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const { showToast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'text-red-600 bg-red-50'
      case 'média':
        return 'text-yellow-600 bg-yellow-50'
      case 'baixa':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const renderCategoryIcon = (iconName: string) => {
    if (!iconName) return <Folder className="h-4 w-4" />
    
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Folder
    return (
      <Icon className="h-4 w-4" />
    )
  }
  
  const getCategoryColor = () => {
    const colors = {
      Briefcase: 'text-blue-500',
      User: 'text-indigo-500',
      Heart: 'text-red-500',
      DollarSign: 'text-green-500',
      Users: 'text-purple-500',
      BookOpen: 'text-amber-500',
      Coffee: 'text-yellow-600',
      Car: 'text-cyan-600',
      Home: 'text-orange-500',
      default: 'text-slate-500'
    }
    
    const iconName = task.category?.icon
    return iconName && colors[iconName as keyof typeof colors] 
      ? colors[iconName as keyof typeof colors] 
      : colors.default
  }

  const formattedDate = dateService.formatTaskDate(task.date, 'dd/MM/yyyy')
  const formattedTime = task.time
  const overdue = !task.completed && dateService.isOverdue(task.date, task.time)
  
  const showDeleteRecurrenceConfirmation = (task: Task) => {
    setTaskToDelete(task)
    setShowDeleteDialog(true)
  }
  
  const handleDeleteSingleTask = async () => {
    if (!taskToDelete) return
    
    onDelete(taskToDelete._id)
    setShowDeleteDialog(false)
    setTaskToDelete(null)
  }
  
  const handleDeleteAllRecurringTasks = async () => {
    if (!taskToDelete) return
    
    try {
      await TaskService.deleteTask(taskToDelete._id, true)
      showToast('success', `Tarefa "${taskToDelete.title}" e todas as ocorrências futuras foram excluídas`)
      
      onDelete(taskToDelete._id)
    } catch (error) {
      console.error('Erro ao excluir tarefas recorrentes:', error)
      showToast('error', 'Erro ao excluir tarefas recorrentes')
    }
    
    setShowDeleteDialog(false)
    setTaskToDelete(null)
  }


  return (
    <div
      className={`border rounded-lg p-4 shadow-sm transition ${
        task.completed
          ? 'bg-muted border-border'
          : overdue
            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
            : 'bg-card border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => {
              onToggleComplete(task._id, !task.completed)

              if (!task.completed) {
                showToast('success', `Tarefa "${task.title}" concluída! 🎉`)
              }
            }}
            className={task.completed ? 'bg-green-500' : ''}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-medium text-sm ${
                task.completed ? 'text-gray-500 line-through' : ''
              }`}
            >
              {task.title}
            </h4>
            {/* @ts-ignore */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (task.recurrence?.active) {
                      showDeleteRecurrenceConfirmation(task);
                    } else {
                      onDelete(task._id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 ${
                task.completed ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </span>

            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 flex items-center gap-1">
              {/* //@ts-ignore */}
              <span className={getCategoryColor()}>
                {renderCategoryIcon(task.category?.icon)}
              </span>
              <span className="text-gray-700">{task.category?.name || 'Sem categoria'}</span>
            </span>
            
            {/* Indicador de tarefa recorrente */}
            {task.recurrence?.active && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 flex items-center gap-1 text-primary">
                <RepeatIcon className="h-3 w-3" />
                <span>Recorrente</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formattedDate}
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              {formattedTime}
            </div>
          </div>
        </div>
      </div>
      
      {/* Diálogo de confirmação para excluir tarefas recorrentes */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="xl:max-w-xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RepeatIcon className="h-5 w-5 text-primary" />
              Excluir tarefa recorrente
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Esta é uma tarefa recorrente. O que você deseja fazer?</p>
                <div className="bg-muted/50 p-3 rounded border border-border mt-2">
                  <p className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <span className="text-primary">•</span> 
                    <span className="truncate">{taskToDelete?.title}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Frequência: {taskToDelete?.recurrence?.frequency === 'daily' && 'Diária'}
                    {taskToDelete?.recurrence?.frequency === 'weekly' && 'Semanal'}
                    {taskToDelete?.recurrence?.frequency === 'monthly' && 'Mensal'}
                    {taskToDelete?.recurrence?.frequency === 'yearly' && 'Anual'}
                    {taskToDelete?.recurrence?.frequency === 'custom' && 'Personalizada'}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <Button 
              onClick={handleDeleteSingleTask} 
              variant="outline"
              className="border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 sm:flex-1"
            >
              Excluir apenas esta ocorrência
            </Button>
            <Button 
              onClick={handleDeleteAllRecurringTasks}
              variant="destructive"
              className="sm:flex-1"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir todas
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
