import api from './api'
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category'

export const CategoryService = {
 
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories')
    console.log(response)
    //@ts-ignore
    return response.data || []
  },


  createCategory: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post('/categories', data)
    //@ts-ignore
    return response.data
  },

  
  updateCategory: async (
    id: string,
    data: UpdateCategoryDto
  ): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data)
    //@ts-ignore
    return response.data
  },


  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  }
}