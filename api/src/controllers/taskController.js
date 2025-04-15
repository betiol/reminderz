import Task from '../models/Task.js'
import User from '../models/User.js'
import { asyncHandler } from '../middleware/async.js'
import ErrorResponse from '../utils/errorResponse.js'
import { rescheduleTaskReminder } from '../services/schedulerService.js'
import { realtimeDB } from '../config/firebase.js'
import { publishMessage, TOPICS } from '../config/pubsub.js'
import mongoose from 'mongoose'
import moment from 'moment-timezone'

const fbRTDb = realtimeDB()




export const getTasks = asyncHandler(async (req, res, next) => {
  
  const filter = { user: req.user.id }

  
  if (req.query.completed) {
    filter.completed = req.query.completed === 'true'
  }

  if (req.query.category) {
    filter.category = new mongoose.Types.ObjectId(req.query.category)
  }

  if (req.query.priority) {
    filter.priority = req.query.priority
  }

  
  if (req.query.date) {
    const date = new Date(req.query.date)
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)

    filter.date = {
      $gte: date,
      $lt: nextDay
    }
  }

  
  if (req.query.from && req.query.to) {
    filter.date = {
      $gte: new Date(req.query.from),
      $lte: new Date(req.query.to)
    }
  }

  
  const sort = {}
  if (req.query.sort) {
    const sortFields = req.query.sort.split(',')
    sortFields.forEach((field) => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1
      } else {
        sort[field] = 1
      }
    })
  } else {
    
    sort.date = 1
    sort.time = 1
  }

  
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 50
  const startIndex = (page - 1) * limit

  const tasks = await Task.find(filter)
    .populate('category', { name: 1, icon: 1 })
    .sort(sort)
    .skip(startIndex)
    .limit(limit)

  
  const total = await Task.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    data: tasks
  })
})




export const getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('category')

  if (!task) {
    return next(
      new ErrorResponse(`Tarefa não encontrada com id ${req.params.id}`, 404)
    )
  }

  
  if (task.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Usuário não autorizado a acessar esta tarefa', 403)
    )
  }

  res.status(200).json({
    success: true,
    data: task
  })
})




export const createTask = asyncHandler(async (req, res, next) => {
  
  req.body.user = req.user.id

  
  if (req.body.category) {
    const Category = mongoose.model('Category')
    const categoryExists = await Category.findById(req.body.category)
    if (!categoryExists) {
      return next(new ErrorResponse('Categoria não encontrada', 404))
    }

    
    req.body.category = new mongoose.Types.ObjectId(req.body.category)
  }

  
  if (req.body.date) {
    
    let userTimezone = 'UTC'
    if (req.user) {
      try {
        const user = await User.findById(req.user.id)
        if (user && user.timezone) {
          userTimezone = user.timezone
        }
      } catch (err) {
        console.error('Erro ao buscar timezone do usuário:', err)
      }
    }

    
    
    const momentDate = moment.tz(req.body.date, 'YYYY-MM-DD', userTimezone)

    
    req.body.date = momentDate.toDate()

    console.log(`Data original: ${req.body.date}, Timezone: ${userTimezone}`)
    console.log(`Data da tarefa após conversão Moment: ${momentDate.format()}`)
    console.log(`Data da tarefa para MongoDB: ${req.body.date.toISOString()}`)
  }

  
  if (req.body.recurrence && req.body.recurrence.active) {
    
    if (!req.body.recurrence.groupId) {
      req.body.recurrence.groupId = new mongoose.Types.ObjectId().toString();
    }
  }

  
  const task = await Task.create(req.body)

  
  if (task.recurrence && task.recurrence.active) {
    console.log(`Task ${task._id} is recurring with groupId ${task.recurrence.groupId}. Publishing message to process in background...`);
    
    await publishMessage(TOPICS.RECURRING_TASKS, {
      action: 'generateOccurrences',
      taskId: task._id.toString()
    });
    console.log(`Successfully published recurring task message to background processor`);
  }

  
  await rescheduleTaskReminder(task._id)

  
  await updateTaskCounters(req.user.id)

  res.status(201).json({
    success: true,
    data: task
  })
})




export const updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id).populate('category')

  if (!task) {
    return next(
      new ErrorResponse(`Tarefa não encontrada com id ${req.params.id}`, 404)
    )
  }

  
  if (task.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Usuário não autorizado a atualizar esta tarefa', 403)
    )
  }

  
  if (req.body.category) {
    const Category = mongoose.model('Category')
    const categoryExists = await Category.findById(req.body.category)
    if (!categoryExists) {
      return next(new ErrorResponse('Categoria não encontrada', 404))
    }

    
    req.body.category = new mongoose.Types.ObjectId(req.body.category)
  }

  
  if (req.body.date) {
    
    let userTimezone = 'UTC'
    try {
      const user = await User.findById(req.user.id)
      if (user && user.timezone) {
        userTimezone = user.timezone
      }
    } catch (err) {
      console.error('Erro ao buscar timezone do usuário:', err)
    }

    
    
    const momentDate = moment.tz(req.body.date, 'YYYY-MM-DD', userTimezone)

    
    req.body.date = momentDate.toDate()

    console.log(`Data original: ${req.body.date}, Timezone: ${userTimezone}`)
    console.log(`Data da tarefa após conversão Moment: ${momentDate.format()}`)
    console.log(`Data da tarefa para MongoDB: ${req.body.date.toISOString()}`)
  }

  
  if (req.body.date || req.body.time) {
    req.body.reminderSent = false

    
    await rescheduleTaskReminder(req.params.id)
  }

  
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('category')

  
  if (req.body.recurrence && 
      (req.body.recurrence.active !== undefined || 
       req.body.recurrence.frequency || 
       req.body.recurrence.interval || 
       req.body.recurrence.endDate || 
       req.body.recurrence.daysOfWeek)) {
    
    
    if (req.body.recurrence.active === true) {
      
      if (!task.recurrence.groupId) {
        task.recurrence.groupId = new mongoose.Types.ObjectId().toString();
        await task.save(); 
      }
      
      
      if (task.recurrence.groupId) {
        await Task.deleteMany({
          user: req.user.id,
          'recurrence.groupId': task.recurrence.groupId,
          date: { $gt: task.date },
          _id: { $ne: task._id } 
        });
      } else {
        
        await Task.deleteMany({
          user: req.user.id,
          date: { $gt: task.date },
          recurrence: { active: true },
          _id: { $ne: task._id } 
        });
      }
      
      
      console.log(`Publishing message to regenerate occurrences for task ${task._id} in background`);
      await publishMessage(TOPICS.RECURRING_TASKS, {
        action: 'regenerateOccurrences',
        taskId: task._id.toString()
      });
      console.log(`Successfully published message to regenerate occurrences in background`);
    }
  }

  
  if (req.body.completed !== undefined) {
    
    await updateTaskCounters(req.user.id);
    
    
    if (req.body.completed === true && task.recurrence && task.recurrence.active) {
      console.log(`Recurring task ${task._id} was completed. Checking if we need to generate next occurrence...`);
      
      
      const futureTask = await Task.findOne({
        user: req.user.id,
        'recurrence.active': true,
        date: { $gt: new Date() },
        
        'recurrence.frequency': task.recurrence.frequency,
        'recurrence.interval': task.recurrence.interval
      });
      
      if (!futureTask) {
        console.log('No future occurrence found. Generating next occurrence...');
        
        const nextTaskData = task.generateNextOccurrence();
        if (nextTaskData) {
          const newTask = await Task.create(nextTaskData);
          console.log(`Created next occurrence ${newTask._id} for completed recurring task`);
          
          
          await rescheduleTaskReminder(newTask._id);
          console.log(`Scheduled reminder for the new occurrence`);
        } else {
          console.log('Could not generate next occurrence (recurrence may have ended)');
        }
      } else {
        console.log(`Future occurrence already exists (${futureTask._id}). No need to generate a new one.`);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: task
  })
})




export const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)

  if (!task) {
    return next(
      new ErrorResponse(`Tarefa não encontrada com id ${req.params.id}`, 404)
    )
  }

  
  if (task.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Usuário não autorizado a excluir esta tarefa', 403)
    )
  }

  
  if (task?.recurrence?.active && req.query.deleteFuture === 'true') {
    
    if (task.recurrence.groupId) {
      
      await Task.deleteMany({
        user: req.user._id,
        'recurrence.groupId': task.recurrence.groupId,
        date: { $gte: task.date }
      });
    } else {
      
      console.warn(`Deleting recurring task ${task._id} without a groupId. This might affect unrelated tasks.`);
      await Task.deleteMany({
        user: req.user._id,
        date: { $gte: task.date },
        recurrence: { active: true }
      });
    }
  } else {
    
    await task.deleteOne();
  }

  
  await updateTaskCounters(req.user.id)

  res.status(200).json({
    success: true,
    data: {}
  })
})




export const toggleTaskComplete = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id).populate('category')

  if (!task) {
    return next(
      new ErrorResponse(`Tarefa não encontrada com id ${req.params.id}`, 404)
    )
  }

  
  if (task.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Usuário não autorizado a atualizar esta tarefa', 403)
    )
  }

  
  const wasCompleted = task.completed;
  task.completed = !wasCompleted;
  await task.save();

  
  await updateTaskCounters(req.user.id);
  
  
  if (!wasCompleted && task.completed && task.recurrence && task.recurrence.active) {
    console.log(`Recurring task ${task._id} was toggled to completed. Checking if we need to generate next occurrence...`);
    
    
    const futureTask = await Task.findOne({
      user: req.user.id,
      'recurrence.active': true,
      date: { $gt: new Date() },
      
      'recurrence.frequency': task.recurrence.frequency,
      'recurrence.interval': task.recurrence.interval
    });
    
    if (!futureTask) {
      console.log('No future occurrence found. Publishing message to generate next occurrence...');
      
      await publishMessage(TOPICS.RECURRING_TASKS, {
        action: 'generateNextOccurrence',
        taskId: task._id.toString()
      });
      console.log(`Successfully published message to generate next occurrence in background`);
    } else {
      console.log(`Future occurrence already exists (${futureTask._id}). No need to generate a new one.`);
    }
  }

  res.status(200).json({
    success: true,
    data: task
  })
})







export const getOverdueTasksCount = asyncHandler(async (req, res) => {
  
  const user = await User.findById(req.user.id)
  const userTimezone = user?.timezone || 'UTC'

  
  const now = moment().tz(userTimezone)
  const today = now.clone().startOf('day')

  
  const todayUTC = today.toDate()

  
  const overdueCount = await Task.countDocuments({
    user: req.user.id,
    completed: false,
    $or: [
      { date: { $lt: todayUTC } }, 
      {
        date: {
          $gte: todayUTC,
          $lt: moment(todayUTC).add(1, 'days').toDate()
        },
        
        time: {
          $lt: now.format('HH:mm')
        }
      }
    ]
  })

  const overdueTasks = await Task.find({
    user: req.user.id,
    completed: false,
    date: { $lt: todayUTC }
  })
    .limit(5)
    .sort({ date: 1, time: 1 })

  res.status(200).json({
    success: true,
    data: {
      count: overdueCount,
      tasks: overdueTasks,
      timestamp: now.format()
    }
  })
})

export const getTaskStats = asyncHandler(async (req, res, next) => {
  
  const user = await User.findById(req.user.id)
  const userTimezone = user?.timezone || 'UTC'

  
  const now = moment().tz(userTimezone)
  const today = now.clone().startOf('day')
  const tomorrow = today.clone().add(1, 'days')

  
  
  const startDay = user.settings?.startDayOfWeek || 0 
  const startOfWeek = today.clone().startOf('week').day(startDay)
  if (startOfWeek.isAfter(today)) {
    startOfWeek.subtract(7, 'days')
  }
  const endOfWeek = startOfWeek.clone().add(7, 'days')

  
  const startOfMonth = today.clone().startOf('month')
  const endOfMonth = today.clone().endOf('month').add(1, 'milliseconds')

  
  const todayDate = today.toDate()
  const tomorrowDate = tomorrow.toDate()
  const startOfWeekDate = startOfWeek.toDate()
  const endOfWeekDate = endOfWeek.toDate()
  const startOfMonthDate = startOfMonth.toDate()
  const endOfMonthDate = endOfMonth.toDate()

  
  const totalTasks = await Task.countDocuments({ user: req.user.id })
  const completedTasks = await Task.countDocuments({
    user: req.user.id,
    completed: true
  })
  const todayTasks = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: todayDate, $lt: tomorrowDate }
  })
  const todayCompleted = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: todayDate, $lt: tomorrowDate },
    completed: true
  })
  const weekTasks = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: startOfWeekDate, $lt: endOfWeekDate }
  })
  const weekCompleted = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: startOfWeekDate, $lt: endOfWeekDate },
    completed: true
  })
  const monthTasks = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: startOfMonthDate, $lt: endOfMonthDate }
  })
  const monthCompleted = await Task.countDocuments({
    user: req.user.id,
    date: { $gte: startOfMonthDate, $lt: endOfMonthDate },
    completed: true
  })

  
  const categoriesStats = await Task.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: {
        path: '$categoryInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        completed: 1,
        name: '$categoryInfo.name',
        icon: '$categoryInfo.icon',
        _id: 0
      }
    }
  ])

  
  const priorityStats = await Task.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: '$priority',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } }
      }
    },
    {
      $project: {
        priority: '$_id',
        total: 1,
        completed: 1,
        _id: 0
      }
    }
  ])

  res.status(200).json({
    success: true,
    data: {
      overview: {
        total: totalTasks,
        completed: completedTasks,
        completion_rate:
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      },
      today: {
        total: todayTasks,
        completed: todayCompleted,
        completion_rate:
          todayTasks > 0 ? ((todayCompleted / todayTasks) * 100).toFixed(1) : 0
      },
      week: {
        total: weekTasks,
        completed: weekCompleted,
        completion_rate:
          weekTasks > 0 ? ((weekCompleted / weekTasks) * 100).toFixed(1) : 0
      },
      month: {
        total: monthTasks,
        completed: monthCompleted,
        completion_rate:
          monthTasks > 0 ? ((monthCompleted / monthTasks) * 100).toFixed(1) : 0
      },
      categories: categoriesStats,
      priorities: priorityStats
    }
  })
})




const updateTaskCounters = async (userId) => {
  try {
    
    const user = await User.findById(userId)

    
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    
    const todayTasks = await Task.countDocuments({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    })

    const todayCompleted = await Task.countDocuments({
      user: userId,
      date: { $gte: today, $lt: tomorrow },
      completed: true
    })

    
    const overdueTasks = await Task.countDocuments({
      user: userId,
      date: { $lt: today },
      completed: false
    })

    
    const userTasksRef = fbRTDb.ref(`tasks/${userId}`)
    await userTasksRef.update({
      todayCount: todayTasks,
      todayCompleted: todayCompleted,
      overdueCount: overdueTasks,
      lastUpdated: Date.now()
    })

    return {
      todayCount: todayTasks,
      todayCompleted: todayCompleted,
      overdueCount: overdueTasks
    }
  } catch (error) {
    console.error('Error updating task counters:', error)
    throw error
  }
}
