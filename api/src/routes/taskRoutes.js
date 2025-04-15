import express from 'express'
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  getTaskStats,
  getOverdueTasksCount
} from '../controllers/taskController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/stats', getTaskStats)
router.get('/overdue-count', getOverdueTasksCount)

router.route('/').get(getTasks).post(createTask)

router.route('/:id').get(getTask).put(updateTask).delete(deleteTask)

router.patch('/:id/toggle-complete', toggleTaskComplete)

export default router
