//@ts-nocheck
import { format, toZonedTime } from 'date-fns-tz'

const dateService = {
 
  utcToUserTimezone(date, timezone) {
    const utcDate = typeof date === 'string' ? new Date(date) : date
    return toZonedTime(utcDate, timezone)
  },


  userTimezoneToUtc(date, timezone) {
    const localDate = typeof date === 'string' ? new Date(date) : date
    return toZonedTime(localDate, timezone)
  },

 
  formatDate(date, timezone, formatStr = 'dd/MM/yyyy') {
    if (!date) return ''

    const utcDate = typeof date === 'string' ? new Date(date) : date
    const zonedDate = toZonedTime(utcDate, timezone)
    return format(zonedDate, formatStr)
  },

 
  formatDateTime(date, time, timezone, formatStr = 'dd/MM/yyyy HH:mm') {
    if (!date) return ''

    
    const utcDate = typeof date === 'string' ? new Date(date) : new Date(date)

    if (time) {
      const [hours, minutes] = time.split(':')
      utcDate.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
    }

    const zonedDate = toZonedTime(utcDate, timezone)
    return format(zonedDate, formatStr)
  },

  
  createDateTimeUtc(dateStr, timeStr, timezone) {
    
    const localDate = new Date(`${dateStr}T${timeStr}:00`)

    
    return toZonedTime(localDate, timezone)
  },

  
  isOverdue(date, time) {
    if (!date) return false

    try {
      
      const dateParts =
        typeof date === 'string'
          ? date.split('T')[0].split('-')
          : [
              date.getUTCFullYear(),
              String(date.getUTCMonth() + 1).padStart(2, '0'),
              String(date.getUTCDate()).padStart(2, '0')
            ]

      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 
      const day = parseInt(dateParts[2])

      
      let hour = 0
      let minute = 0

      if (time) {
        const timeParts = time.split(':')
        hour = parseInt(timeParts[0])
        minute = parseInt(timeParts[1])
      }

      
      const taskDateTime = new Date()
      taskDateTime.setFullYear(year, month, day)
      taskDateTime.setHours(hour, minute, 0, 0)

      
      const now = new Date()

      
      console.log('Task date/time:', taskDateTime.toString())
      console.log('Current time:', now.toString())
      console.log('Is overdue:', taskDateTime < now)

      
      return taskDateTime < now
    } catch (error) {
      console.error('Erro ao verificar se tarefa está atrasada:', error)
      return false
    }
  },

 
  combineDateTime(dateStr, timeStr, timezone) {
    if (!dateStr) return null

    try {
      
      const dateObj =
        typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr)

      
      const combinedDate = new Date(dateObj)

      
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':')
        combinedDate.setUTCHours(
          parseInt(hours, 10),
          parseInt(minutes, 10),
          0,
          0
        )
      }

      
      return toZonedTime(combinedDate, timezone)
    } catch (error) {
      console.error('Erro ao combinar data e hora:', error)
      return new Date(dateStr)
    }
  },

 
  formatDateFixedTimezone(dateStr, format = 'dd/MM/yyyy') {
    if (!dateStr) return ''

    try {
      
      
      const utcDate = new Date(dateStr)
      const year = utcDate.getUTCFullYear()
      const month = utcDate.getUTCMonth() 
      const day = utcDate.getUTCDate()

      
      const fixedDate = new Date(Date.UTC(year, month, day))

      
      const dd = String(day).padStart(2, '0')
      const MM = String(month + 1).padStart(2, '0')
      const yyyy = year

      
      return format
        .replace('dd', dd)
        .replace('MM', MM)
        .replace('yyyy', yyyy)
        .replace('yy', yyyy.toString().substr(-2))
    } catch (error) {
      console.error('Erro ao formatar data com timezone fixo:', error)
      return String(dateStr)
    }
  },

  
  formatTaskDate(dateStr, formatStr = 'dd/MM/yyyy') {
    if (!dateStr) return ''

    
    const dateParts = dateStr.split('T')[0].split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 
    const day = parseInt(dateParts[2])

    
    const dd = String(day).padStart(2, '0')
    const MM = String(month + 1).padStart(2, '0')
    const yyyy = year

    return formatStr
      .replace('dd', dd)
      .replace('MM', MM)
      .replace('yyyy', yyyy)
      .replace('yy', yyyy.toString().substr(-2))
  }
}

export default dateService
