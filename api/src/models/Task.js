import mongoose from 'mongoose'
import moment from 'moment-timezone'

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
      maxlength: [100, 'Título não pode ter mais de 100 caracteres']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
    },
    date: {
      type: Date,
      required: [true, 'Data é obrigatória']
    },

    time: {
      type: String,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Formato de hora inválido (HH:MM)'
      ],
      default: '12:00'
    },
    priority: {
      type: String,
      enum: ['baixa', 'média', 'alta'],
      default: 'média'
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    cloudTaskId: {
      type: String,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    recurrence: {
      active: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
        default: 'daily'
      },
      interval: {
        type: Number,
        default: 1
      },
      endDate: {
        type: Date,
        default: null
      },
      daysOfWeek: {
        type: [Number], 
        default: []
      },
      groupId: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
)


TaskSchema.index({ user: 1, date: 1 })
TaskSchema.index({ user: 1, completed: 1 })
TaskSchema.index({ date: 1, reminderSent: 1 }) 
TaskSchema.index({ user: 1, category: 1 })
TaskSchema.index({ user: 1, priority: 1 })


TaskSchema.virtual('fullDateTime').get(function () {
  const dateObj = new Date(this.date)
  if (this.time) {
    const [hours, minutes] = this.time.split(':')
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }
  return dateObj
})


TaskSchema.methods.getLocalDate = function (userTimeZone) {
  return moment.utc(this.date).tz(userTimeZone)
}


TaskSchema.methods.getFormattedDate = function (userTimeZone, formatStr = 'DD/MM/YYYY') {
  const localDate = this.getLocalDate(userTimeZone)
  return localDate.format(formatStr)
}


TaskSchema.methods.shouldSendReminder = function (userTimeZone) {
  if (this.completed || this.reminderSent) {
    return false
  }

  
  const taskDate = moment.utc(this.date).tz(userTimeZone).startOf('day')
  
  
  if (this.time) {
    const [hours, minutes] = this.time.split(':')
    taskDate.hours(parseInt(hours, 10)).minutes(parseInt(minutes, 10)).seconds(0)
  } else {
    taskDate.hours(12).minutes(0).seconds(0)
  }
  
  
  const now = moment().tz(userTimeZone)
  
  
  
  
  const reminderTime = 30 
  
  
  const reminderDate = taskDate.clone().subtract(reminderTime, 'minutes')
  
  
  
  return now.isAfter(reminderDate) && now.isBefore(taskDate)
}


TaskSchema.methods.generateNextOccurrence = function () {
  if (!this.recurrence || !this.recurrence.active) {
    return null
  }

  
  const currentDate = moment(this.date)
  let nextDate = moment(currentDate)

  switch (this.recurrence.frequency) {
    case 'daily':
      nextDate = nextDate.add(this.recurrence.interval, 'days')
      break
    case 'weekly':
      nextDate = nextDate.add(this.recurrence.interval * 7, 'days')
      break
    case 'monthly':
      nextDate = nextDate.add(this.recurrence.interval, 'months')
      break
    case 'yearly':
      nextDate = nextDate.add(this.recurrence.interval, 'years')
      break
    case 'custom':
      
      if (this.recurrence.daysOfWeek && this.recurrence.daysOfWeek.length > 0) {
        let found = false
        let tempDate = moment(currentDate).add(1, 'day') 

        
        const maxIterations = 365 
        let iterations = 0
        
        while (
          !found &&
          iterations < maxIterations &&
          (!this.recurrence.endDate ||
            tempDate.isSameOrBefore(moment(this.recurrence.endDate)))
        ) {
          const dayOfWeek = tempDate.day() 
          if (this.recurrence.daysOfWeek.includes(dayOfWeek)) {
            found = true
            nextDate = moment(tempDate)
          } else {
            tempDate.add(1, 'day')
          }
          iterations++
        }

        if (!found) return null 
      }
      break
  }

  
  if (this.recurrence.endDate && nextDate.isAfter(moment(this.recurrence.endDate))) {
    return null
  }

  
  const nextTaskData = {
    title: this.title,
    description: this.description,
    date: nextDate.toDate(),
    time: this.time,
    priority: this.priority,
    category: this.category,
    user: this.user,
    tags: this.tags,
    recurrence: this.recurrence
  }
  
  
  if (!nextTaskData.recurrence.groupId && this.recurrence?.groupId) {
    nextTaskData.recurrence.groupId = this.recurrence.groupId;
  }

  return nextTaskData
}

export default mongoose.model('Task', TaskSchema)