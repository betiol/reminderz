import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconPicker } from '@/components/common/IconPicker'
import { Category } from '@/types/category'
import { CategoryService } from '@/services/categoryService'
import { Trash, Edit, Plus, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(30, 'Nome deve ter no máximo 30 caracteres'),
  icon: z.string().min(1, 'Ícone é obrigatório')
})

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: ''
    }
  })

  const selectedIcon = watch('icon')

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await CategoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const startCreatingCategory = () => {
    setIsCreating(true)
    setEditingCategory(null)
    reset({ name: '', icon: '' })
  }

  const startEditingCategory = (category: Category) => {
    setIsCreating(false)
    setEditingCategory(category)
    reset({ name: category.name, icon: category.icon })
  }

  const cancelForm = () => {
    setIsCreating(false)
    setEditingCategory(null)
    reset({ name: '', icon: '' })
  }

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    try {
      setIsSubmitting(true)
      
      if (isCreating) {
        await CategoryService.createCategory(data)
        toast.success('Categoria criada com sucesso!')
      } else if (editingCategory) {
        await CategoryService.updateCategory(editingCategory._id, data)
        toast.success('Categoria atualizada com sucesso!')
      }
      
      cancelForm()
      await loadCategories()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }
    
    try {
      await CategoryService.deleteCategory(id)
      toast.success('Categoria excluída com sucesso!')
      await loadCategories()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  const renderCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Folder
    return <Icon className="w-5 h-5" />
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Categorias</CardTitle>
        <CardDescription>
          Crie e personalize suas categorias para organizar suas tarefas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Lista de categorias */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Suas categorias</h3>
            {!isCreating && !editingCategory && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startCreatingCategory}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova categoria
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma categoria encontrada. Crie sua primeira categoria!
                </p>
              ) : (
                <div className="divide-y">
                  {categories?.map((category) => (
                    <div 
                      key={category._id} 
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mr-3">
                          {renderCategoryIcon(category.icon)}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-gray-500">
                            {category.isDefault ? 'Categoria padrão' : 'Categoria personalizada'}
                          </p>
                        </div>
                      </div>
                      
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => startEditingCategory(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteCategory(category._id)}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Formulário de criação/edição */}
        {(isCreating || editingCategory) && (
          <Card className="border-2 border-primary p-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">
                {isCreating ? 'Nova categoria' : 'Editar categoria'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Nome da categoria
                  </label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                    placeholder="Ex: Trabalho, Estudos, Lazer..."
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="icon" className="block text-sm font-medium mb-1">
                    Ícone
                  </label>
                  <IconPicker 
                    value={selectedIcon} 
                    onChange={(icon) => setValue('icon', icon)} 
                  />
                  {errors.icon && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.icon.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelForm}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}