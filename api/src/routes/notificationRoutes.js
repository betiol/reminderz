import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/unread-count', getUnreadCount)

router.patch('/mark-all-read', markAllAsRead)

router.route('/').get(getNotifications).delete(deleteAllNotifications)

router.route('/:id').delete(deleteNotification)

router.patch('/:id/read', markAsRead)

export default router
