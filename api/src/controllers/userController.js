import User from '../models/User.js'
import asyncHandler from 'express-async-handler'

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      timezone: user.timezone,
      notificationPreferences: user.notificationPreferences,
      settings: user.settings
    })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.timezone = req.body.timezone || user.timezone
  
    if (req.body.profilePicture !== undefined) {
      user.profilePicture = req.body.profilePicture
    }

    await user.save()

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      timezone: user.timezone,
      notificationPreferences: user.notificationPreferences,
      settings: user.settings
    })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})

export const updateUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
  
    if (req.body.settings) {
      user.settings = {
        ...user.settings,
        ...req.body.settings
      }
    }

  
    if (req.body.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...req.body.notificationPreferences
      }
    }

    await user.save()

    res.json({
      _id: user._id,
      settings: user.settings,
      notificationPreferences: user.notificationPreferences
    })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})

export const updateUserTimezone = asyncHandler(async (req, res) => {
  const { timezone } = req.body

  if (!timezone) {
    res.status(400)
    throw new Error('Timezone é obrigatório')
  }

  const user = await User.findById(req.user._id)

  if (user) {
    user.timezone = timezone
    await user.save()

    res.json({
      _id: user._id,
      timezone: user.timezone
    })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})

export const addFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body

  if (!token) {
    res.status(400)
    throw new Error('Token FCM é obrigatório')
  }

  const user = await User.findById(req.user._id)

  if (user) {
    await user.addFcmToken(token)
    res.status(200).json({ success: true })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})

export const removeFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body

  if (!token) {
    res.status(400)
    throw new Error('Token FCM é obrigatório')
  }

  const user = await User.findById(req.user._id)

  if (user) {
    await user.removeFcmToken(token)
    res.status(200).json({ success: true })
  } else {
    res.status(404)
    throw new Error('Usuário não encontrado')
  }
})
