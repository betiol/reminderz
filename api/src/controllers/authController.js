// controllers/authController.js - Simplified authentication controller
import { auth } from '../config/firebase.js'
import User from '../models/User.js'
import { asyncHandler } from '../middleware/async.js'
import ErrorResponse from '../utils/errorResponse.js'

const firebaseAuth = auth()

// @desc    Register or update user after Firebase authentication
// @route   POST /api/auth/session
// @access  Public
export const createSession = asyncHandler(async (req, res, next) => {
  const { firebaseToken } = req.body

  if (!firebaseToken) {
    return next(new ErrorResponse('Firebase token is required', 400))
  }

  try {
    // Verify Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(firebaseToken)
    const { uid: firebaseUid, email, name: displayName, picture } = decodedToken

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid })

    if (user) {
      // Update information if user exists
      user.lastLogin = new Date()

      // Update email or name if they were changed in Firebase
      if (email && user.email !== email) user.email = email
      if (displayName && user.name !== displayName) user.name = displayName

      await user.save()
    } else {
      // Check if user exists with the same email
      const existingUser = await User.findOne({ email })

      if (existingUser) {
        // Link existing account to new Firebase UID
        existingUser.firebaseUid = firebaseUid
        existingUser.lastLogin = new Date()
        await existingUser.save()
        user = existingUser
      } else {
        // Create new user
        user = await User.create({
          name: displayName || email.split('@')[0],
          email,
          firebaseUid,
          profilePicture: picture || undefined
        })
      }
    }

    // Return user information (without JWT, we'll use only Firebase tokens)
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        notificationPreferences: user.notificationPreferences
      }
    })
  } catch (error) {
    return next(
      new ErrorResponse(`Error verifying token: ${error.message}`, 401)
    )
  }
})

// @desc    Register FCM token for notifications
// @route   POST /api/auth/register-fcm-token
// @access  Private (verified via Firebase middleware)
export const registerFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body

  if (!fcmToken) {
    return next(new ErrorResponse('FCM token is required', 400))
  }

  // Add FCM token to user's list if it doesn't exist yet
  const user = await User.findById(req.user.id)
  await user.addFcmToken(fcmToken)

  res.status(200).json({
    success: true,
    message: 'FCM token registered successfully'
  })
})

// @desc    Update notification preferences
// @route   PUT /api/auth/notification-preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(
  async (req, res, next) => {
    const { email, push, reminderTime } = req.body

    const user = await User.findById(req.user.id)

    // Update only provided fields
    if (email !== undefined) user.notificationPreferences.email = email
    if (push !== undefined) user.notificationPreferences.push = push
    if (reminderTime !== undefined)
      user.notificationPreferences.reminderTime = reminderTime

    await user.save()

    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    })
  }
)

// @desc    Remove FCM token (used in logout)
// @route   DELETE /api/auth/fcm-token
// @access  Private
export const removeFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body

  if (!fcmToken) {
    return next(new ErrorResponse('FCM token is required', 400))
  }

  const user = await User.findById(req.user.id)
  await user.removeFcmToken(fcmToken)

  res.status(200).json({
    success: true,
    message: 'FCM token removed successfully'
  })
})
