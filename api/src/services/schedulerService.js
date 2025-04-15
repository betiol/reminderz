// services/schedulerService.js
import { CloudSchedulerClient } from '@google-cloud/scheduler'
import { CloudTasksClient } from '@google-cloud/tasks'
import { publishMessage, TOPICS } from '../config/pubsub.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import { createNotification } from './notificationService.js'
import dotenv from 'dotenv'
import moment from 'moment-timezone'

dotenv.config()

// Google Cloud Settings
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
if (!PROJECT_ID) {
  console.error('ERROR: GOOGLE_CLOUD_PROJECT_ID environment variable not defined!')
}

const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
const QUEUE_NAME = process.env.TASK_QUEUE_NAME || 'tasks-reminders'

console.log('Cloud Tasks Configuration:')
console.log('PROJECT_ID:', PROJECT_ID)
console.log('LOCATION:', LOCATION)
console.log('QUEUE_NAME:', QUEUE_NAME)
console.log('API_BASE_URL:', process.env.API_BASE_URL)

// Clients for Google Cloud Scheduler and Cloud Tasks
const scheduler = new CloudSchedulerClient()
const tasksClient = new CloudTasksClient()

// Configure scheduling service
export const setupTaskScheduler = async () => {
  try {
    console.log(
      'Initializing scheduling service with Google Cloud Scheduler...'
    )

    // Removed job for checking reminders - now reminders are created at task creation/update time
    // No periodic check needed

    // Configure job to check overdue tasks daily
    await createOrUpdateSchedulerJob(
      'check-overdue-tasks',
      '0 8 * * *', // Every day at 8 AM
      {
        action: 'checkOverdueTasks'
      }
    )

    // Recurring tasks are now generated at creation time, no scheduler needed

    console.log('Scheduling service configured successfully')
  } catch (error) {
    console.error('Error configuring scheduling service:', error)
  }
}

// Create or update Cloud Scheduler job
const createOrUpdateSchedulerJob = async (jobId, schedule, payload) => {
  const parent = scheduler.locationPath(PROJECT_ID, LOCATION)
  const jobName = `${parent}/jobs/${jobId}`

  try {
    // Check if job already exists
    try {
      await scheduler.getJob({ name: jobName })
      console.log(`Job ${jobId} already exists, updating...`)

      // Update existing job
      await scheduler.updateJob({
        job: {
          name: jobName,
          schedule,
          timeZone: 'America/Cuiaba',
          pubsubTarget: {
            topicName: `projects/${PROJECT_ID}/topics/${TOPICS.TASK_REMINDERS}`,
            data: Buffer.from(JSON.stringify(payload)).toString('base64')
          }
        }
      })
    } catch (error) {
      // Job doesn't exist, create new one
      console.log(`Creating new job ${jobId}...`)
      await scheduler.createJob({
        parent,
        job: {
          name: jobName,
          schedule,
          timeZone: 'America/Cuiaba',
          pubsubTarget: {
            topicName: `projects/${PROJECT_ID}/topics/${TOPICS.TASK_REMINDERS}`,
            data: Buffer.from(JSON.stringify(payload)).toString('base64')
          }
        }
      })
    }

    console.log(`Job ${jobId} configured successfully`)
  } catch (error) {
    console.error(`Error configuring job ${jobId}:`, error)
    throw error
  }
}

// Process Scheduler message (called via Pub/Sub)
export const processSchedulerMessage = async (message) => {
  try {
    console.log('Message received:', message)

    // Decode message
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8')

    // Convert to JSON
    const data = JSON.parse(decodedData)

    console.log('Decoded data:', data)

    const { action } = data

    console.log('Extracted action:', action)

    switch (action) {
      case 'checkOverdueTasks':
        await checkOverdueTasks()
        break
      // Removed checkTaskReminders - now handled at task creation/update time
      // Recurring tasks processing removed - handled at creation time
      default:
        console.warn(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Error processing scheduler message:', error)
  }
}

// Check and schedule reminders for upcoming tasks
// Function removed - Now reminders are scheduled automatically at:
// 1. Task creation (createTask in taskController.js)
// 2. Task update (updateTask in taskController.js)
// 3. Recurring occurrences generation (recurringTaskService.js)
// using the rescheduleTaskReminder function directly

// Schedule reminder in Google Cloud Tasks
const scheduleTaskReminder = async (task, reminderDate) => {
  try {
    console.log('QUEUE_NAME', QUEUE_NAME)
    const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME)

    // Prepare message payload
    const payload = {
      taskId: task._id.toString(),
      userId: task.user._id.toString(),
      title: task.title,
      description: task.description || '',
      date: task.date.toISOString(),
      time: task.time || ''
    }

    // Configure task
    const [response] = await tasksClient.createTask({
      parent: queuePath,
      task: {
        scheduleTime: {
          seconds: Math.floor(reminderDate.getTime() / 1000)
        },
        httpRequest: {
          httpMethod: 'POST',
          url: `${process.env.API_BASE_URL}/api/internal/send-reminder`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: Buffer.from(JSON.stringify(payload)).toString('base64')
        }
      }
    })

    // Extract Cloud Tasks ID from response
    // The response.name format is "projects/PROJECT_ID/locations/LOCATION/queues/QUEUE_NAME/tasks/TASK_ID"
    const cloudTaskId = response.name;
    
    // Store Cloud Task ID in the task
    await Task.findByIdAndUpdate(task._id, { cloudTaskId });

    console.log(`Reminder scheduled: ${cloudTaskId}`)
    console.log(`API URL configured: ${process.env.API_BASE_URL}/api/internal/send-reminder`)
    return cloudTaskId
  } catch (error) {
    console.error('Error scheduling reminder. Details:', error.message)
    console.error('Configuration used:')
    console.error(`- PROJECT_ID: ${PROJECT_ID}`)
    console.error(`- LOCATION: ${LOCATION}`)
    console.error(`- QUEUE_NAME: ${QUEUE_NAME}`)
    console.error(`- API_BASE_URL: ${process.env.API_BASE_URL}`)
    console.error(`- Complete Response/Error:`, error)
    throw error
  }
}

// Check overdue tasks
export const checkOverdueTasks = async () => {
  try {
    const nowUTC = moment.utc()
    const yesterdayUTC = nowUTC.clone().subtract(1, 'day').startOf('day')

    console.log(`Checking overdue tasks - current date (UTC): ${nowUTC.format('YYYY-MM-DD HH:mm:ss')}`)
    console.log(`Searching tasks before: ${yesterdayUTC.format('YYYY-MM-DD HH:mm:ss')}`)

    // Find potentially overdue tasks (before now) that haven't been completed
    const potentialOverdueTasks = await Task.find({
      date: { $lt: nowUTC.toDate() },
      completed: false
    }).populate('user', 'notificationPreferences timezone email name')

    console.log(`Found ${potentialOverdueTasks.length} potentially overdue tasks`)
    
    let count = 0
    const trueOverdueTasks = [];

    // Filter truly overdue tasks considering user's time and timezone
    for (const task of potentialOverdueTasks) {
      if (!task.user) {
        console.log(`Task ${task._id} has no associated user, skipping...`)
        continue
      }
      
      // Get user's timezone
      const userTimezone = task.user.timezone || "America/Sao_Paulo"
      
      // Get current date in user's timezone
      const nowInUserTZ = moment().tz(userTimezone)
      
      // Convert task date to user's timezone
      const taskDateInUserTZ = moment.utc(task.date).tz(userTimezone)
      
      // Create complete date/time with task's time
      let fullTaskDateInUserTZ = taskDateInUserTZ.clone()
      
      if (task.time) {
        const [hours, minutes] = task.time.split(':')
        fullTaskDateInUserTZ.hours(parseInt(hours, 10)).minutes(parseInt(minutes, 10)).seconds(0)
      }
      
      // Check if it's overdue in user's timezone
      if (fullTaskDateInUserTZ.isBefore(nowInUserTZ)) {
        console.log(`Task "${task.title}" is overdue:`)
        console.log(`  Task date/time: ${fullTaskDateInUserTZ.format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`)
        console.log(`  Current date/time: ${nowInUserTZ.format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`)
        trueOverdueTasks.push(task)
      }
    }

    console.log(`Found ${trueOverdueTasks.length} truly overdue tasks`)

    for (const task of trueOverdueTasks) {
      // Check if user wants to receive notifications
      if (task.user?.notificationPreferences?.push) {
        // Use createNotification to create record in database and send correctly
        await createNotification(
          task.user._id.toString(),
          'Task overdue',
          `The task "${task.title}" is overdue`,
          'task_overdue',
          {
            taskId: task._id.toString(),
            title: task.title,
            action: 'checkOverdueTasks'
          }
        )

        count++
      }
    }

    console.log(`Sent ${count} overdue task notifications`)
    return count
  } catch (error) {
    console.error('Error checking overdue tasks:', error)
    throw error
  }
}

// Reschedule reminder for an updated task
export const rescheduleTaskReminder = async (taskId) => {
  try {
    // Immediately check if this task needs a reminder
    const task = await Task.findById(taskId).populate(
      'user',
      'notificationPreferences timezone email name'
    )
    
    if (!task || task.completed) {
      console.log('Task not found or already completed, skipping scheduling')
      return
    }
    
    // Current date in UTC
    const nowUTC = moment.utc()
    console.log('CURRENT DATE (UTC):', nowUTC.format('YYYY-MM-DD HH:mm:ss'))
    
    // Define user's timezone
    const userTimezone = task.user?.timezone || "America/Sao_Paulo"
    console.log('User timezone:', userTimezone)
    
    // Get current date in user's timezone
    const nowInUserTZ = moment().tz(userTimezone)
    console.log(`Current date/time (TZ user): ${nowInUserTZ.format('YYYY-MM-DD HH:mm:ss')}`)
    
    // Create moment object with task date in UTC
    const taskDateUTC = moment.utc(task.date)
    
    // Convert date to user's timezone
    const taskDateInUserTZ = taskDateUTC.clone().tz(userTimezone)
    
    // Apply task's specific time (in user's timezone)
    let fullTaskDateInUserTZ = taskDateInUserTZ.clone().startOf('day')
    
    if (task.time) {
      const [hours, minutes] = task.time.split(':')
      const taskHour = parseInt(hours, 10);
      const taskMinute = parseInt(minutes, 10);
      
      // Apply time to date in user's timezone
      fullTaskDateInUserTZ.hours(taskHour).minutes(taskMinute).seconds(0).milliseconds(0)
      console.log(`Task time applied: ${hours}:${minutes}`);
    } else {
      // If no specific time, assume noon
      fullTaskDateInUserTZ.hours(12).minutes(0).seconds(0).milliseconds(0)
      console.log('No specific time, using noon');
    }
    
    console.log(`Complete date/time (TZ user): ${fullTaskDateInUserTZ.format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`);
    
    // Check if date+time is in the past
    if (fullTaskDateInUserTZ.isBefore(nowInUserTZ)) {
      console.log('⚠️ WARNING: Task date and time have passed!')
      console.log(`Task date/time: ${fullTaskDateInUserTZ.format('YYYY-MM-DD HH:mm:ss')}`)
      console.log(`Current: ${nowInUserTZ.format('YYYY-MM-DD HH:mm:ss')}`)
      
      // Do not remove reminderSent mark for past tasks
      return;
    }
    
    // Convert back to UTC for saving and scheduling
    const taskDateTimeUTC = fullTaskDateInUserTZ.clone().utc()
    
    console.log('ORIGINAL TASK DATE (UTC):', taskDateUTC.format('YYYY-MM-DD HH:mm:ss'))
    console.log('TASK DATE (TZ user):', fullTaskDateInUserTZ.format('YYYY-MM-DD HH:mm:ss'))
    console.log('FINAL TASK DATE (converted to UTC):', taskDateTimeUTC.format('YYYY-MM-DD HH:mm:ss'))
    
    // Check if task is in the future
    if (taskDateTimeUTC.isAfter(nowUTC)) {
      console.log('Task is in the future! Scheduling reminder...')
      
      // Get user's reminder time configuration
      const reminderTime = task.user?.notificationPreferences?.reminderTime || 30
      console.log('Configured reminder time (minutes before):', reminderTime)
      
      // Calculate when reminder should be sent (in user's timezone)
      const reminderDateInUserTZ = fullTaskDateInUserTZ.clone().subtract(reminderTime, 'minutes')
      
      // Create UTC equivalent date/time maintaining the same absolute time instant
      // The moment.utc() method only changes the display format, not the time instant
      // Therefore, we use moment.tz(timeString, timezone).utc() to convert correctly
      const reminderDateTimeUTC = moment.tz(
        reminderDateInUserTZ.format('YYYY-MM-DD HH:mm:ss'), 
        userTimezone
      ).utc()
      
      // Logs for debug
      console.log(`Task date: ${fullTaskDateInUserTZ.format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`)
      console.log(`Reminder date: ${reminderDateInUserTZ.format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`)
      console.log('Reminder date (UTC):', reminderDateTimeUTC.format('YYYY-MM-DD HH:mm:ss'))

      // If reminder is still in the future, schedule
      if (reminderDateTimeUTC.isAfter(nowUTC)) {
        console.log('✅ Reminder is in the future, scheduling cloud task for:', reminderDateTimeUTC.format('YYYY-MM-DD HH:mm:ss'))
        console.log(`   (${reminderTime} minutes before task time)`)

        // IMPORTANT: First cancel any existing task in Cloud Tasks for this task
        // to avoid duplicate notifications
        try {
          if (task.cloudTaskId) {
            await cancelTaskById(task.cloudTaskId)
            console.log(`Previous reminder canceled for task ${taskId}: ${task.cloudTaskId}`)
            
            // Clear cloudTaskId after canceling
            task.cloudTaskId = null;
          } else {
            console.log(`No previous reminder found for task ${taskId}`)
          }
        } catch (cancelError) {
          console.error('Error canceling existing reminder:', cancelError)
          // Continue even if failed to cancel
          // But clear cloudTaskId to ensure it doesn't reference a task that may no longer exist
          task.cloudTaskId = null;
        }

        // Reset reminderSent status only if we successfully create a new one
        await Task.findByIdAndUpdate(taskId, { reminderSent: false })
        
        // Update task date to adjusted version
        task.date = taskDateTimeUTC.toDate();
        
        // Schedule reminder
        await scheduleTaskReminder(task, reminderDateTimeUTC.toDate())
        
        // Mark as sent after scheduling
        task.reminderSent = true
        await task.save()
        
        console.log('✅ Reminder scheduled successfully in Cloud Tasks!')
      } else {
        console.log('⚠️ Reminder time has passed, cannot schedule')
        console.log(`   Current time: ${nowUTC.format('YYYY-MM-DD HH:mm:ss')}`)
        console.log(`   Reminder would be for: ${reminderDateTimeUTC.format('YYYY-MM-DD HH:mm:ss')}`)
      }
    } else {
      console.log('⚠️ Task has passed, cannot schedule reminder')
      console.log(`   Current time: ${nowUTC.format('YYYY-MM-DD HH:mm:ss')}`)
      console.log(`   Task time: ${taskDateTimeUTC.format('YYYY-MM-DD HH:mm:ss')}`)
    }

    console.log(`Rescheduling process completed for task ${taskId}`)
  } catch (error) {
    console.error('Error rescheduling task reminder:', error)
    throw error
  }
}

// Cancel a cloud task by ID
const cancelTaskById = async (cloudTaskId) => {
  try {
    console.log(`Attempting to cancel cloud task: ${cloudTaskId}`)
    
    // Cancel task using Cloud Tasks API
    await tasksClient.deleteTask({ name: cloudTaskId })
    
    console.log(`Cloud task canceled successfully: ${cloudTaskId}`)
    return true
  } catch (error) {
    // If task doesn't exist, it may have already been executed or expired
    if (error.code === 5) { // NOT_FOUND
      console.log(`Cloud task not found (may have already been executed): ${cloudTaskId}`)
      return false
    }
    
    console.error(`Error canceling cloud task ${cloudTaskId}:`, error)
    throw error
  }
}

// Recurring tasks processing removed - handled at creation time

export default {
  setupTaskScheduler,
  processSchedulerMessage,
  checkOverdueTasks,
  rescheduleTaskReminder
}
