import Category from '../models/Category.js'
import { StatusCodes } from 'http-status-codes'


export const createDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Trabalho', icon: 'briefcase', isDefault: true },
    { name: 'Pessoal', icon: 'user', isDefault: true },
    { name: 'Saúde', icon: 'heart', isDefault: true },
    { name: 'Financeiro', icon: 'dollar-sign', isDefault: true },
    { name: 'Social', icon: 'users', isDefault: true }
  ]

  
  const existingDefaults = await Category.countDocuments({ isDefault: true })
  
  if (existingDefaults === 0) {
    
    await Category.insertMany(defaultCategories)
  }
}


export const getAllCategories = async (req, res) => {
  try {
    const userId = req.user._id
    
    
    const data = await Category.find({
      $or: [
        { isDefault: true },
        { user: userId }
      ]
    })
    .sort({ isDefault: -1, name: 1 })
    
    res.status(StatusCodes.OK).json({ data })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Erro ao buscar categorias', 
      error: error.message 
    })
  }
}


export const createCategory = async (req, res) => {
  try {
    const userId = req.user._id
    const { name, icon } = req.body

    console.log('req.user', req.user)
    
    
    if (!name || !icon) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Nome e ícone da categoria são obrigatórios'
      })
    }
    
    
    const existingCategory = await Category.findOne({
      name,
      user: userId
    })
    
    if (existingCategory) {
      return res.status(StatusCodes.CONFLICT).json({
        message: 'Já existe uma categoria com este nome'
      })
    }

    
    const data = await Category.create({
      name,
      icon,
      user: userId,
      isDefault: false
    })
    
    res.status(StatusCodes.CREATED).json({ data })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Erro ao criar categoria', 
      error: error.message 
    })
  }
}


export const updateCategory = async (req, res) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const { name, icon } = req.body
    
    
    const category = await Category.findById(id)
    
    
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Categoria não encontrada'
      })
    }
    
    
    if (category.isDefault) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Categorias padrão não podem ser editadas'
      })
    }
    
    
    if (category.user.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Você não tem permissão para editar esta categoria'
      })
    }
    
    
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name,
        user: userId,
        _id: { $ne: id }
      })
      
      if (existingCategory) {
        return res.status(StatusCodes.CONFLICT).json({
          message: 'Já existe uma categoria personalizada com este nome'
        })
      }
    }
    
    
    category.name = name || category.name
    category.icon = icon || category.icon
    await category.save()

    const data = category
    
    res.status(StatusCodes.OK).json(data)
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Erro ao atualizar categoria', 
      error: error.message 
    })
  }
}


export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    
    
    const category = await Category.findOne({_id: id})
    

console.log(category)

    
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Categoria não encontrada'
      })
    }
    
    
    if (category.isDefault) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Categorias padrão não podem ser deletadas'
      })
    }

    
    
    await Category.deleteOne({ _id: id })
    
    res.status(StatusCodes.OK).json({ message: 'Categoria deletada com sucesso' })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Erro ao deletar categoria', 
      error: error.message 
    })
  }
}