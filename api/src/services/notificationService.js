// services/notificationService.js
import { messaging, realtimeDB } from '../config/firebase.js'

import { publishMessage, TOPICS } from '../config/pubsub.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fbMessaging = messaging()
const fbRTDb = realtimeDB()

/**
 * Create and save a new notification
 * @param {string} userId - Recipient user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type (task_reminder, task_updated, system)
 * @param {Object} data - Additional data related to the notification
 * @returns {Promise<Object>} - Created notification object
 */
export const createNotification = async (
  userId,
  title,
  body,
  type = 'system',
  data = {}
) => {
  try {
    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      console.log(`User ${userId} not found when creating notification`)
      throw new Error('User not found')
    }

    // Create notification record in MongoDB
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      data,
      read: false,
      sentToDevice: false
    })

    console.log('Log in publishMessage', {
      notificationId: notification._id.toString(),
      userId: userId.toString(),
      title,
      body,
      type,
      data
    })

    // Publish to Pub/Sub for asynchronous processing
    // This allows notification sending to not block the API response
    await publishMessage(TOPICS.NOTIFICATIONS, {
      notificationId: notification._id.toString(),
      userId: userId.toString(),
      title,
      body,
      type,
      data
    })

    // Update unread notification counter in Realtime Database
    // This allows the frontend to be notified in real time
    await updateUnreadNotificationCount(userId)

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Process new notification (called by Pub/Sub)
 * @param {Object} message - Message received from Pub/Sub
 */
export const processNewNotification = async (message) => {
  try {
    // Decode and parse message content
    let data = {};
    
    if (message.data) {
      // PubSub returns the message as a base64 Buffer
      const decodedString = Buffer.from(message.data, 'base64').toString('utf-8');
      console.log('Decoded notification message data:', decodedString);
      
      try {
        data = JSON.parse(decodedString);
      } catch (parseError) {
        console.error('Error parsing notification message JSON:', parseError);
        // Continue with empty object
      }
    }
    
    const {
      notificationId,
      userId,
      title,
      body,
      type,
      data: notificationData
    } = data

    // Additional required fields verification
    if (!notificationId || !userId || !title || !body) {
      console.error('Missing required fields in notification:', {
        notificationId,
        userId,
        title,
        body
      })
      return
    }

    // Find user to get FCM tokens
    const user = await User.findById(userId)
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(
        `User ${userId} has no FCM tokens registered for push notifications`
      )
      return
    }

    // Check user notification preferences
    if (!user.notificationPreferences?.push) {
      console.log(`User ${userId} has disabled push notifications`)
      return
    }

    // Filter invalid tokens: remove empty or malformed tokens
    const validTokens = user.fcmTokens.filter(
      (token) => token && typeof token === 'string' && token.length > 20
    )

    if (validTokens.length === 0) {
      console.log(`User ${userId} has no valid FCM tokens`)
      return
    }

    console.log('Available methods in fbMessaging:', Object.keys(fbMessaging))

    // Prepare correct structure for sending messages with the send() method
    let successCount = 0
    let failureCount = 0
    const responses = []

    // Process tokens in batches to send using the send() method
    for (const token of validTokens) {
      try {
        // Each token needs to be sent individually with the send() method
        const messageForToken = {
          token: token,
          notification: {
            title,
            body
          },
          data: {
            notificationId: notificationId.toString(),
            type: type || 'default',
            body,
            time: new Date().toISOString(),
            ...(notificationData
              ? // Ensure all values are strings
                Object.entries(notificationData).reduce((acc, [key, value]) => {
                  acc[key] = value?.toString() || ''
                  return acc
                }, {})
              : {})
          },
          android: {
            priority: 'high',
            notification: {
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              channelId: 'tasks'
            }
          },
          webpush: {
            headers: {
              Urgency: 'high'
            }
          }
        }

        // Send message to a single token
        const messageId = await fbMessaging.send(messageForToken)
        console.log(
          `Message sent successfully to token ${token}, messageId: ${messageId}`
        )
        responses.push({ success: true, messageId })
        successCount++
      } catch (tokenError) {
        console.error(`Error sending to token ${token}:`, tokenError)
        responses.push({
          success: false,
          error: { message: tokenError.message || 'Unknown error' }
        })
        failureCount++
      }
    }

    // Create response object similar to what sendMulticast would return
    const response = {
      successCount,
      failureCount,
      responses
    }

    // Mark notification as sent in database
    await Notification.findByIdAndUpdate(notificationId, {
      sentToDevice: true,
      sentAt: new Date(),
      sendResponse: response
    })

    // Check and remove invalid tokens
    if (failureCount > 0) {
      const invalidTokens = responses
        .filter((r) => !r.success)
        .map((r) => r.token)

      // More detailed error logging
      console.error('Error details:', {
        invalidTokens,
        totalAttempts: validTokens.length,
        successCount,
        failureCount
      })

      // Remove invalid tokens from user
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: invalidTokens } }
      })
    }

    return response
  } catch (error) {
    // Log detailed message data for diagnosis
    console.error('Error processing notification:', {
      message: message.data ? Buffer.from(message.data, 'base64').toString('utf-8') : 'No data',
      error: error.message
    })

    // Register additional error details
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.details) {
      console.error('Error details:', error.details)
    }

    // If it's a Mongoose error, show validation details
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors)
    }

    throw error // Propagate error for proper handling by the caller
  }
}

/**
 * Process a task reminder received from Pub/Sub
 * @param {Object} message - Message received from Pub/Sub
 */
export const processTaskReminder = async (message) => {
  try {
    // Decode and parse message content
    let data = {};
    
    if (message.data) {
      // PubSub returns the message as a base64 Buffer
      const decodedString = Buffer.from(message.data, 'base64').toString('utf-8');
      console.log('Decoded task reminder data:', decodedString);
      
      try {
        data = JSON.parse(decodedString);
      } catch (parseError) {
        console.error('Error parsing task reminder JSON:', parseError);
        // Continue with empty object
      }
    }

    // Log detailed for diagnosis
    console.log(
      'Processing task reminder. Received data:',
      JSON.stringify(data)
    )

    // Extract message data
    const { taskId, userId, title, description, date, time } = data

    // Validate required fields
    if (!taskId || !userId || !title) {
      console.error('Incomplete data for task reminder processing:', {
        taskId,
        userId,
        title
      })
      return
    }

    // Build notification body
    let body = `Reminder: ${title}`

    // Add time to message body, if available and valid
    if (
      time &&
      typeof time === 'string' &&
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
    ) {
      body += ` at ${time}`
    }

    // Add short description, if available
    if (description && typeof description === 'string') {
      const shortDesc =
        description.length > 50
          ? `${description.substring(0, 47)}...`
          : description
      body += ` - ${shortDesc}`
    }

    // Add date information, if available and valid
    let formattedDate = ''
    if (date) {
      try {
        // Try to interpret date
        let dateObj
        if (typeof date === 'string') {
          dateObj = parseISO(date)
        } else if (date instanceof Date) {
          dateObj = date
        } else {
          // If not string or Date, try to convert
          dateObj = new Date(date)
        }

        // Verify date is valid
        if (isValid(dateObj)) {
          formattedDate = format(dateObj, " (d 'of' MMMM)", { locale: ptBR })
          body += formattedDate
        }
      } catch (dateError) {
        console.warn('Unable to format reminder date:', dateError)
        // Continue without adding date to message
      }
    }

    console.log(`Sending notification to user ${userId}: "${body}"`)

    // Create notification for user
    await createNotification(
      userId,
      'Task Reminder',
      body,
      'task_reminder',
      {
        taskId,
        title,
        description: description || '',
        action: 'checkTasksReminders',
        date: date || '',
        time: time || '',
        created: new Date().toISOString()
      }
    )

    console.log(`Task reminder processed successfully for task ${taskId}`)
  } catch (error) {
    console.error('Error processing task reminder:', error)

    // Additional log for diagnosis
    if (
      error instanceof RangeError &&
      error.message.includes('Invalid time value')
    ) {
      console.error('Invalid date error. Received values:', data)
    }
  }
}

/**
 * Update unread notification counter in Firebase Realtime Database
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of unread notifications
 */
export const updateUnreadNotificationCount = async (userId) => {
  try {
    // Count unread notifications in MongoDB
    const count = await Notification.countDocuments({
      user: userId,
      read: false
    })

    // Update Realtime Database counter for real-time frontend access
    const userNotificationsRef = fbRTDb.ref(`notifications/${userId}`)
    await userNotificationsRef.update({
      unreadCount: count,
      lastUpdated: Date.now()
    })

    return count
  } catch (error) {
    console.error('Error updating notification counter:', error)
    throw error
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated notification
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    )

    if (!notification) {
      throw new Error('Notification not found')
    }

    // Update counter in Firebase
    await updateUnreadNotificationCount(userId)

    return notification
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of updated notifications
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    )

    // Update counter in Firebase
    await updateUnreadNotificationCount(userId)

    return result.modifiedCount
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Delete old notifications to keep database clean
 * Called periodically by scheduler
 * @param {number} days - Days to keep notifications (default: 30)
 */
export const pruneOldNotifications = async (days = 30) => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    })

    console.log(
      `Deleted ${result.deletedCount} old notifications (> ${days} days)`
    )
    return result.deletedCount
  } catch (error) {
    console.error('Error deleting old notifications:', error)
  }
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} - Icon URL
 */
const getNotificationIcon = (type) => {
  // These paths should point to publicly accessible files
  switch (type) {
    case 'task_reminder':
      return '/icons/reminder.png'
    case 'task_updated':
      return '/icons/update.png'
    case 'system':
      return '/icons/system.png'
    default:
      return '/icons/notification.png'
  }
}

export default {
  createNotification,
  processNewNotification,
  processTaskReminder,
  updateUnreadNotificationCount,
  markNotificationAsRead,
  markAllAsRead,
  pruneOldNotifications
}
