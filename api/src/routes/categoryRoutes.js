import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js'

const router = express.Router()

router.use(protect)

router.get('/', getAllCategories)
router.post('/', createCategory)
router.put('/:id', updateCategory)
router.delete('/:id', deleteCategory)

export default router