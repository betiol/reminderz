// controllers/notificationController.js - Notification controller
import Notification from '../models/Notification.js'
import { asyncHandler } from '../middleware/async.js'
import ErrorResponse from '../utils/errorResponse.js'
import { updateUnreadNotificationCount } from '../services/notificationService.js'

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res, next) => {
  // Filtering options
  const filter = { user: req.user.id }

  // Filter by read status if provided
  if (req.query.read !== undefined) {
    filter.read = req.query.read === 'true'
  }

  // Filter by type if provided
  if (req.query.type) {
    filter.type = req.query.type
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 20
  const startIndex = (page - 1) * limit

  // Fetch notifications
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 }) // Most recent first
    .skip(startIndex)
    .limit(limit)

  // Count total for pagination
  const total = await Notification.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    data: notifications
  })
})

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) {
    return next(
      new ErrorResponse(
        `Notification not found with id ${req.params.id}`,
        404
      )
    )
  }

  // Check if user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        'User not authorized to access this notification',
        403
      )
    )
  }

  // Mark as read
  notification.read = true
  await notification.save()

  // Update counter in Firebase
  await updateUnreadNotificationCount(req.user.id)

  res.status(200).json({
    success: true,
    data: notification
  })
})

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  // Update all unread notifications for the user
  const result = await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  )

  // Update counter in Firebase
  await updateUnreadNotificationCount(req.user.id)

  res.status(200).json({
    success: true,
    count: result.modifiedCount,
    message: `${result.modifiedCount} notifications marked as read`
  })
})

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) {
    return next(
      new ErrorResponse(
        `Notification not found with id ${req.params.id}`,
        404
      )
    )
  }

  // Check if user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        'User not authorized to delete this notification',
        403
      )
    )
  }

  await notification.deleteOne()

  // If notification was unread, update counter
  if (!notification.read) {
    await updateUnreadNotificationCount(req.user.id)
  }

  res.status(200).json({
    success: true,
    data: {}
  })
})

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications = asyncHandler(async (req, res, next) => {
  // Filter by type if provided
  const filter = { user: req.user.id }

  if (req.query.read !== undefined) {
    filter.read = req.query.read === 'true'
  }

  // Delete notifications
  const result = await Notification.deleteMany(filter)

  // Update counter in Firebase
  await updateUnreadNotificationCount(req.user.id)

  res.status(200).json({
    success: true,
    count: result.deletedCount,
    message: `${result.deletedCount} notifications deleted`
  })
})

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false
  })

  res.status(200).json({
    success: true,
    count
  })
})
