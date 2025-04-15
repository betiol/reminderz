import React, { useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task'
import { Category } from '@/types/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { X, Loader2, Trash, RepeatIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useUserPreferences } from '@/context/UserPreferencesContext'
import { CategoryService } from '@/services/categoryService'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

const recurrenceSchema = z.object({
  active: z.boolean().default(false),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('daily'),
  interval: z.number().min(1).default(1),
  endDate: z.string().nullable().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional()
})

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  priority: z.enum(['baixa', 'média', 'alta']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  reminderTime: z.number().min(0).optional(),
  completed: z.boolean().default(false),
  recurrence: recurrenceSchema.optional()
})

interface TaskFormProps {
  task?: Task
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => void
  onCancel: () => void
  onDelete?: (id: string, deleteFuture?: boolean) => void
  isLoading?: boolean
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false
}) => {
  const isEditMode = !!task
  const { currentUser } = useAuth()
  const { preferences } = useUserPreferences()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const userTimeZone =
    currentUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const extractDateFromISOString = (dateString: string) => {
    try {
      return dateString.split('T')[0]
    } catch (error) {
      console.error('Erro ao extrair data:', error)
    }
  }

  const getTaskTime = (timeString: string): string => {
    try {
      if (timeString && timeString.includes(':')) {
        return timeString.substring(0, 5)
      }

      const now = new Date()
      console.log(userTimeZone)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: userTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }

      const timeStr = new Intl.DateTimeFormat('pt-BR', options).format(now)

      return timeStr
    } catch (error) {
      console.error('Erro ao obter hora da tarefa:', error)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch
  } = useForm<CreateTaskDto | UpdateTaskDto>({
    resolver: zodResolver(taskSchema),
    //@ts-ignore
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          date: extractDateFromISOString(task.date),
          time: task.time || getTaskTime(task.time || ''),
          priority: task.priority,
          category: task.category,
          reminderTime: task.reminderTime || 15,
          completed: task.completed,
          recurrence: task.recurrence || {
            active: false,
            frequency: 'daily',
            interval: 1,
            endDate: null,
            daysOfWeek: []
          }
        }
      : {
          title: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          priority: 'média',
          completed: false,
          recurrence: {
            active: false,
            frequency: 'daily',
            interval: 1,
            endDate: null,
            daysOfWeek: []
          }
        }
  })
  
  const isRecurrenceActive = watch('recurrence.active')
  const recurrenceFrequency = watch('recurrence.frequency')
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const loadedCategories = await CategoryService.getCategories()
        setCategories(loadedCategories)
        
        if (!isEditMode && !task) {
          const defaultCategory = loadedCategories.find(c => c.isDefault)
          if (defaultCategory && !control._formValues.category) {
            control._formValues.category = defaultCategory._id
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    loadCategories()
  }, [])
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto text-card-foreground">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {isEditMode ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Tarefa
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nova Tarefa
              </>
            )}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full p-1 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-1">
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-1 text-foreground/80"
            >
              Título<span className="text-primary ml-0.5">*</span>
            </label>
            <Input
              id="title"
              placeholder="Digite o título da tarefa"
              {...register('title')}
              className={`h-11 px-3 text-base ${errors.title ? 'border-red-500 focus-visible:ring-red-300' : 'focus-visible:ring-primary/20 border-input/80'}`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="mb-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1 text-foreground/80"
            >
              Descrição
            </label>
            <textarea
              id="description"
              placeholder="Detalhes adicionais sobre a tarefa (opcional)"
              {...register('description')}
              rows={3}
              className="w-full p-3 border border-input/80 rounded-md focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-transparent bg-background text-foreground resize-none text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium mb-1 text-foreground/80"
              >
                Data<span className="text-primary ml-0.5">*</span>
              </label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className={`h-11 pl-10 ${errors.date ? 'border-red-500 focus-visible:ring-red-300' : 'focus-visible:ring-primary/20 border-input/80'}`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="time"
                className="block text-sm font-medium mb-1 text-foreground/80"
              >
                Hora<span className="text-primary ml-0.5">*</span>
              </label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  {...register('time')}
                  className={`h-11 pl-10 ${errors.time ? 'border-red-500 focus-visible:ring-red-300' : 'focus-visible:ring-primary/20 border-input/80'}`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
              {errors.time && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium mb-1 text-foreground/80"
              >
                Prioridade
              </label>
              <div className="relative">
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full h-11 pl-10 pr-3 border border-input/80 rounded-md focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-transparent bg-background text-foreground appearance-none"
                >
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                  </svg>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium mb-1 text-foreground/80"
              >
                Categoria<span className="text-primary ml-0.5">*</span>
              </label>
              {isLoadingCategories ? (
                <div className="h-11 flex items-center space-x-2 p-2 border rounded-md border-input/80 bg-muted/20">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground/70">Carregando categorias...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="category"
                    {...register('category')}
                    className={`w-full h-11 pl-10 pr-3 border rounded-md appearance-none bg-background text-foreground ${errors.category ? 'border-red-500 focus-visible:ring-red-300' : 'focus-visible:ring-primary/20 border-input/80'}`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {/* Mostrar primeiro as categorias personalizadas */}
                    {categories
                      .filter(c => !c.isDefault)
                      .map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    {/* Depois mostrar as categorias padrão */}
                    {categories
                      .filter(c => c.isDefault)
                      .map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 19A8.5 8.5 0 1 0 9.5 2a8.5 8.5 0 0 0 0 17z"></path>
                      <path d="M16.5 19a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z"></path>
                    </svg>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              )}
              {errors.category && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>
          {/* Seção de Recorrência */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center space-x-2 mb-4">
              <Controller
                name="recurrence.active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="recurrence-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5"
                  />
                )}
              />
              <label
                htmlFor="recurrence-active"
                className="text-sm font-medium cursor-pointer flex items-center"
              >
                <span className="text-base font-semibold">Tarefa recorrente</span>
              </label>
            </div>

            {isRecurrenceActive && (
              <div className="space-y-4 pl-7 pr-2 py-3 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in-50 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="recurrence-frequency"
                      className="block text-sm font-medium mb-1 text-foreground/80"
                    >
                      Frequência
                    </label>
                    <select
                      id="recurrence-frequency"
                      {...register('recurrence.frequency')}
                      className="w-full p-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background/80 text-foreground"
                    >
                      <option value="daily">Diariamente</option>
                      <option value="weekly">Semanalmente</option>
                      <option value="monthly">Mensalmente</option>
                      <option value="yearly">Anualmente</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="recurrence-interval"
                      className="block text-sm font-medium mb-1 text-foreground/80"
                    >
                      {recurrenceFrequency === 'daily' && 'A cada quantos dias'}
                      {recurrenceFrequency === 'weekly' && 'A cada quantas semanas'}
                      {recurrenceFrequency === 'monthly' && 'A cada quantos meses'}
                      {recurrenceFrequency === 'yearly' && 'A cada quantos anos'}
                      {recurrenceFrequency === 'custom' && 'Intervalo (dias)'}
                    </label>
                    <Input
                      id="recurrence-interval"
                      type="number"
                      min="1"
                      step="1"
                      className="bg-background/80"
                      {...register('recurrence.interval', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {recurrenceFrequency === 'custom' && (
                  <div className="bg-background/50 p-3 rounded-md border border-border/50">
                    <label className="block text-sm font-medium mb-3 text-foreground">
                      Dias da semana
                    </label>
                    <div className="grid grid-cols-7 gap-2 max-w-xs mx-auto">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                        <Controller
                          key={index}
                          name="recurrence.daysOfWeek"
                          control={control}
                          render={({ field }) => {
                            const dayValues = field.value || []
                            const isChecked = dayValues.includes(index)
                            
                            return (
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-medium mb-1">{day}</div>
                                <div 
                                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 
                                    ${isChecked ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                  onClick={() => {
                                    if (!isChecked) {
                                      if (!dayValues.includes(index)) {
                                        field.onChange([...dayValues, index])
                                      }
                                    } else {
                                      field.onChange(
                                        dayValues.filter((d) => d !== index)
                                      )
                                    }
                                  }}
                                >
                                  {isChecked && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="recurrence-end-date"
                    className="block text-sm font-medium mb-1 text-foreground/80"
                  >
                    Data de término (opcional)
                  </label>
                  <Input
                    id="recurrence-end-date"
                    type="date"
                    className="bg-background/80"
                    {...register('recurrence.endDate')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se não definir uma data, a recorrência se estenderá por 6 meses.
                  </p>
                </div>
              </div>
            )}
          </div>

          {isEditMode && (
            <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-border">
              <Controller
                name="completed"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="completed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-5 w-5"
                  />
                )}
              />
              <label
                htmlFor="completed"
                className="text-sm font-medium cursor-pointer flex items-center"
              >
                <span className="text-foreground font-medium">Marcar tarefa como concluída</span>
              </label>
            </div>
          )}

          <div className="flex flex-col gap-4 pt-6 mt-4 border-t border-border">
            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 py-5 text-base font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </div>
                ) : (
                  isEditMode ? 'Salvar' : 'Adicionar'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-5 text-base border-2"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
            
            {isEditMode && onDelete && task && (
              <Button
                type="button"
                variant="destructive"
                className="w-full py-4 text-base"
                onClick={() => {
                  if (task.recurrence?.active) {
                    setShowDeleteDialog(true);
                  } else {
                    onDelete(task._id);
                  }
                }}
                disabled={isLoading}
              >
                <Trash className="h-4 w-4 mr-2" />
                Excluir tarefa
              </Button>
            )}
          </div>
          
          {/* Diálogo de confirmação de exclusão para tarefas recorrentes */}
          {task && task.recurrence?.active && (
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="max-w-md">
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
                          <span className="truncate">{task.title}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Frequência: {task.recurrence?.frequency === 'daily' && 'Diária'}
                          {task.recurrence?.frequency === 'weekly' && 'Semanal'}
                          {task.recurrence?.frequency === 'monthly' && 'Mensal'}
                          {task.recurrence?.frequency === 'yearly' && 'Anual'}
                          {task.recurrence?.frequency === 'custom' && 'Personalizada'}
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
                    onClick={() => {
                      onDelete?.(task._id, false);
                      setShowDeleteDialog(false);
                    }} 
                    variant="outline"
                    className="border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 sm:flex-1"
                  >
                    Excluir apenas esta ocorrência
                  </Button>
                  <Button 
                    onClick={() => {
                      onDelete?.(task._id, true);
                      setShowDeleteDialog(false);
                    }}
                    variant="destructive"
                    className="sm:flex-1"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir todas as ocorrências
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </form>
      </div>
    </div>
  )
}
