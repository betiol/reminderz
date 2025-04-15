import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  updateUserTimezone,
  addFcmToken,
  removeFcmToken
} from '../controllers/userController.js'

const router = express.Router()

router.use(protect)

router.get('/profile', getUserProfile)
router.put('/profile', updateUserProfile)

router.put('/settings', updateUserSettings)

router.put('/timezone', updateUserTimezone)

router.post('/fcm-token', addFcmToken)
router.delete('/fcm-token', removeFcmToken)

export default router