import Task from '../models/Task.js';
import { rescheduleTaskReminder } from './schedulerService.js';

/**
 * Process messages from PubSub for recurring tasks
 * @param {Object} message - The PubSub message object
 */
export const processRecurringTaskMessage = async (message) => {
  try {
    // Parse the message data
    const messageData = JSON.parse(message.data.toString());
    console.log('Received recurring task message:', messageData);

    const { action, taskId } = messageData;

    if (!taskId) {
      console.error('Missing taskId in recurring task message');
      return;
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      console.error(`Task not found with id ${taskId}`);
      return;
    }

    switch (action) {
      case 'generateOccurrences':
        await generateFutureOccurrences(task);
        break;
      case 'regenerateOccurrences':
        // First delete any existing future occurrences
        if (task.recurrence?.groupId) {
          // Delete tasks in the same group
          await Task.deleteMany({
            user: task.user,
            'recurrence.groupId': task.recurrence.groupId,
            date: { $gt: new Date() },
            _id: { $ne: task._id } // Skip the current task
          });
        } else {
          // Fallback to previous behavior
          await Task.deleteMany({
            user: task.user,
            date: { $gt: new Date() },
            'recurrence.active': true,
            _id: { $ne: task._id } // Skip the current task
          });
        }
        await generateFutureOccurrences(task);
        break;
      case 'generateNextOccurrence':
        await generateNextOccurrence(task);
        break;
      default:
        console.warn(`Unknown action ${action} for recurring task`);
    }
  } catch (error) {
    console.error('Error processing recurring task message:', error);
  }
};

/**
 * Generate future occurrences of a recurring task
 * @param {Object} task - The recurring task object
 */
export const generateFutureOccurrences = async (task) => {
  try {
    if (!task.recurrence || !task.recurrence.active) {
      return;
    }

    console.log(`Generating future occurrences for task ${task._id}`);

    // Define how many occurrences to generate (e.g., 6 months worth)
    const MAX_OCCURRENCES = 50; // Safety limit to prevent infinite loop
    const MONTHS_AHEAD = 6;
    const endDate = task.recurrence.endDate || 
                   new Date(Date.now() + (MONTHS_AHEAD * 30 * 24 * 60 * 60 * 1000)); // 6 months ahead
    
    let currentTask = task;
    let count = 0;
    const createdTasks = [];

    // Generate occurrences until we reach the end date or safety limit
    while (count < MAX_OCCURRENCES) {
      const nextTaskData = currentTask.generateNextOccurrence();
      
      // Stop if we can't generate next occurrence or reached end date
      if (!nextTaskData) {
        break;
      }
      
      // Check if we've reached the end date
      if (new Date(nextTaskData.date) > new Date(endDate)) {
        break;
      }
      
      // Create the next occurrence
      const newTask = await Task.create(nextTaskData);
      
      // Schedule reminder for this occurrence using Cloud Tasks
      // Only if the task date is in the future
      const taskDate = new Date(newTask.date);
      const now = new Date();
      if (taskDate > now) {
        try {
          await rescheduleTaskReminder(newTask._id);
          console.log(`Scheduled reminder for future occurrence: ${newTask._id}`);
        } catch (reminderError) {
          console.error(`Error scheduling reminder for task ${newTask._id}:`, reminderError);
          // Continue with other tasks even if reminder scheduling fails
        }
      }
      
      createdTasks.push(newTask);
      
      // Set the current task to the newly created one
      currentTask = newTask;
      count++;
    }

    console.log(`Generated ${createdTasks.length} future occurrences for task ${task._id}`);
    return createdTasks;
  } catch (error) {
    console.error('Error generating future occurrences:', error);
    throw error;
  }
};

/**
 * Generate just the next occurrence of a recurring task
 * @param {Object} task - The recurring task object
 */
export const generateNextOccurrence = async (task) => {
  try {
    if (!task.recurrence || !task.recurrence.active) {
      console.log(`Task ${task._id} is not recurring`);
      return null;
    }

    const nextTaskData = task.generateNextOccurrence();
    if (!nextTaskData) {
      console.log(`No next occurrence could be generated for task ${task._id}`);
      return null;
    }

    const newTask = await Task.create(nextTaskData);
    console.log(`Created next occurrence ${newTask._id} for recurring task ${task._id}`);
    
    // Schedule reminder for this new occurrence
    await rescheduleTaskReminder(newTask._id);
    console.log(`Scheduled reminder for the new occurrence ${newTask._id}`);
    
    return newTask;
  } catch (error) {
    console.error(`Error generating next occurrence for task ${task._id}:`, error);
    throw error;
  }
};