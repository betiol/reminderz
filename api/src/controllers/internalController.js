import { createNotification } from '../services/notificationService.js'
import Task from '../models/Task.js'

/**
 * Send task reminder (internal endpoint)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const sendReminder = async (req, res) => {
  try {
    // Verify internal token for security
    if (
      req.headers.authorization !== `Bearer ${process.env.INTERNAL_API_KEY}`
    ) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { taskId, userId, title, description, date, time } = req.body

    // Validate required data
    if (!taskId || !userId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete data. taskId, userId and title are required'
      })
    }

    // Check if task exists and is not completed
    const task = await Task.findById(taskId)
    if (task && !task.completed) {
      // Create reminder message
      let body = `Reminder: ${title}`
      if (time) {
        body += ` at ${time}`
      }
      if (description) {
        body += ` - ${description.substring(0, 50)}`
        if (description.length > 50) body += '...'
      }

      // Create notification
      await createNotification(
        userId,
        'Task Reminder',
        body,
        'task_reminder',
        { taskId, title, description, date, time }
      )

      // Mark task as having received reminder
      await Task.findByIdAndUpdate(taskId, { reminderSent: true })

      res
        .status(200)
        .json({ success: true, message: 'Reminder sent successfully' })
    } else {
      // Task doesn't exist or is already completed
      res.status(200).json({
        success: false,
        message: 'Task not found or already completed'
      })
    }
  } catch (error) {
    console.error('Error sending reminder:', error)
    res.status(500).json({
      success: false,
      error: 'Error processing reminder',
      message: error.message
    })
  }
}

/**
 * Check system status (health check)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'System running normally',
    timestamp: new Date().toISOString()
  })
}

/**
 * Process recurring tasks (endpoint called by scheduler)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
// Recurring tasks are now created at task creation time
// This endpoint is removed since it's no longer needed

export default {
  sendReminder,
  healthCheck
}
