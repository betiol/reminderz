import express from 'express'
import {
  createSession,
  registerFcmToken,
  removeFcmToken,
  updateNotificationPreferences
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/session', createSession)

router.post('/register-fcm-token', protect, registerFcmToken)
router.delete('/fcm-token', protect, removeFcmToken)
router.put('/notification-preferences', protect, updateNotificationPreferences)

export default router
