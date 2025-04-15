import { formatInTimeZone } from 'date-fns-tz'

/**
 * Utilities for handling dates and timezones
 */
export const dateUtils = {
  /**
   * Formats a UTC date to the user's timezone
   * @param date Date in UTC
   * @param timezone User's timezone
   * @param formatStr Date format
   * @returns Date formatted in user's timezone
   */
  formatToUserTimezone(
    date,
    timezone,
    formatStr = 'dd/MM/yyyy'
  ) {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatInTimeZone(dateObj, timezone, formatStr)
  },
  
  /**
   * Converts a local date and time to UTC (for sending to backend)
   * @param dateStr Local date in yyyy-MM-dd format
   * @param timeStr Local time in HH:MM format
   * @returns Date in UTC
   */
  localToUtc(dateStr, timeStr) {
    // Create a local date
    const localDate = new Date(`${dateStr}T${timeStr}:00`)
    
    // Convert to UTC by calculating offset in milliseconds
    const offset = localDate.getTimezoneOffset() * 60000
    return new Date(localDate.getTime() - offset)
  },
  
  /**
   * Checks if a UTC date/time has passed
   * @param date Date in UTC
   * @param time Time in HH:MM format
   * @returns true if the date/time has passed
   */
  isOverdue(date, time) {
    const targetDate = typeof date === 'string' ? new Date(date) : new Date(date)
    
    if (time) {
      const [hours, minutes] = time.split(':')
      targetDate.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
    }
    
    return targetDate < new Date()
  },
  
  /**
   * Extrai a data local de uma data UTC
   * @param date Data em UTC
   * @param timezone Timezone do usuário
   * @returns Data no formato yyyy-MM-dd
   */
  getLocalDate(date, timezone) {
    return formatInTimeZone(new Date(date), timezone, 'yyyy-MM-dd')
  },
  
  /**
   * Extrai a hora local de uma data UTC
   * @param date Data em UTC
   * @param timezone Timezone do usuário
   * @returns Hora no formato HH:mm
   */
  getLocalTime(date, timezone) {
    return formatInTimeZone(new Date(date), timezone, 'HH:mm')
  }
}

export default dateUtils