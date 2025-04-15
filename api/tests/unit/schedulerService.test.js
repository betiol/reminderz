import { jest } from '@jest/globals'

// Mock dependencies before importing the module to be tested
const createNotification = jest.fn().mockImplementation(() => Promise.resolve({ success: true }))

// Mock for Task model
const mockTaskFind = jest.fn()
const mockTask = {
  find: mockTaskFind,
  findByIdAndUpdate: jest.fn().mockResolvedValue({ success: true })
}

// Mock dependencies
jest.mock('../../src/services/notificationService.js', () => ({
  createNotification
}))

jest.mock('../../src/models/Task.js', () => ({
  default: mockTask
}))

// Now import the module to be tested (after mocking its dependencies)
import { checkOverdueTasks } from '../../src/services/schedulerService.js'

describe('schedulerService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
    createNotification.mockClear()
    createNotification.mockImplementation(() => Promise.resolve({ success: true }))
    mockTaskFind.mockClear()
  })

  describe('checkOverdueTasks', () => {
    test('should correctly identify overdue tasks considering date and time', async () => {
      // Mock current date (March 7, 2025, 15:00)
      const mockNow = new Date('2025-03-07T15:00:00Z')
      const realDate = Date
      global.Date = class extends Date {
        constructor(date) {
          if (date) {
            return super(date)
          }
          return mockNow
        }
        static now() {
          return mockNow.getTime()
        }
      }

      // Mock user for tests
      const mockUser = {
        _id: 'user123',
        notificationPreferences: { push: true }
      }

      // Mock tasks for testing
      const mockTasks = [
        // Task 1: Today at 14:00 (1 hour ago) - MUST be overdue
        {
          _id: 'task1',
          title: 'Overdue Task',
          date: new Date('2025-03-07T00:00:00Z'),
          time: '14:00',
          completed: false,
          user: mockUser,
          getLocalDate: jest.fn()
        },
        // Task 2: Today at 16:00 (1 hour in future) - MUST NOT be overdue
        {
          _id: 'task2',
          title: 'Future Task',
          date: new Date('2025-03-07T00:00:00Z'),
          time: '16:00',
          completed: false,
          user: mockUser,
          getLocalDate: jest.fn()
        },
        // Task 3: Yesterday at 15:00 - MUST be overdue
        {
          _id: 'task3',
          title: 'Yesterday\'s Task',
          date: new Date('2025-03-06T00:00:00Z'),
          time: '15:00',
          completed: false,
          user: mockUser,
          getLocalDate: jest.fn()
        },
        // Task 4: Tomorrow at 14:00 - MUST NOT be overdue (even with earlier time)
        {
          _id: 'task4',
          title: 'Tomorrow\'s Task',
          date: new Date('2025-03-08T00:00:00Z'),
          time: '14:00',
          completed: false,
          user: mockUser,
          getLocalDate: jest.fn()
        }
      ]

      // Configure Task.find mock
      mockTaskFind.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTasks)
      })

      // Execute the function we're testing
      const count = await checkOverdueTasks()

      // Verifications
      expect(mockTaskFind).toHaveBeenCalledWith({
        date: { $lt: mockNow },
        completed: false
      })

      // Should have identified 2 truly overdue tasks (task1 and task3)
      expect(count).toBe(2)
      
      // Should have called createNotification twice (for task1 and task3)
      expect(createNotification).toHaveBeenCalledTimes(2)
      
      // Verify call for task1
      expect(createNotification).toHaveBeenCalledWith(
        'user123',
        'Task overdue',
        'The task "Overdue Task" is overdue',
        'task_overdue',
        expect.objectContaining({
          taskId: 'task1',
          title: 'Overdue Task'
        })
      )
      
      // Verify call for task3
      expect(createNotification).toHaveBeenCalledWith(
        'user123',
        'Task overdue',
        'The task "Yesterday\'s Task" is overdue',
        'task_overdue',
        expect.objectContaining({
          taskId: 'task3',
          title: 'Yesterday\'s Task'
        })
      )

      // Restore original Date implementation
      global.Date = realDate
    })

    test('should not send notifications for already completed tasks', async () => {
      // Mock user for tests
      const mockUser = {
        _id: 'user123',
        notificationPreferences: { push: true }
      }

      // Mock tasks for testing (all overdue, but some completed)
      const mockTasks = [
        // Uncompleted task
        {
          _id: 'task2',
          title: 'Uncompleted Task',
          date: new Date('2025-03-06T00:00:00Z'), 
          time: '15:00',
          completed: false,
          user: mockUser,
          getLocalDate: jest.fn()
        }
      ]

      // Configure Task.find mock (only returns uncompleted task)
      mockTaskFind.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTasks)
      })

      // Mock current date
      const mockNow = new Date('2025-03-07T15:00:00Z')
      const realDate = Date
      global.Date = class extends Date {
        constructor(date) {
          if (date) {
            return super(date)
          }
          return mockNow
        }
        static now() {
          return mockNow.getTime()
        }
      }

      // Execute function
      const count = await checkOverdueTasks()

      // Verifications
      expect(count).toBe(1)
      expect(createNotification).toHaveBeenCalledTimes(1)
      expect(createNotification).toHaveBeenCalledWith(
        'user123',
        'Task overdue',
        'The task "Uncompleted Task" is overdue',
        'task_overdue',
        expect.any(Object)
      )

      // Restore Date
      global.Date = realDate
    })

    test('should respect user notification preferences', async () => {
      // Mock users for testing with different preferences
      const userWantsPush = {
        _id: 'user1',
        notificationPreferences: { push: true }
      }
      
      const userDisabledPush = {
        _id: 'user2',
        notificationPreferences: { push: false }
      }

      // Mock tasks for testing
      const mockTasks = [
        // Task for user who wants push notifications
        {
          _id: 'task1',
          title: 'User 1 Task',
          date: new Date('2025-03-06T00:00:00Z'),
          time: '14:00',
          completed: false,
          user: userWantsPush,
          getLocalDate: jest.fn()
        },
        // Task for user who disabled push notifications
        {
          _id: 'task2',
          title: 'User 2 Task',
          date: new Date('2025-03-06T00:00:00Z'),
          time: '15:00',
          completed: false,
          user: userDisabledPush,
          getLocalDate: jest.fn()
        }
      ]

      // Configure Task.find mock
      mockTaskFind.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTasks)
      })

      // Mock current date
      const mockNow = new Date('2025-03-07T15:00:00Z')
      const realDate = Date
      global.Date = class extends Date {
        constructor(date) {
          if (date) {
            return super(date)
          }
          return mockNow
        }
        static now() {
          return mockNow.getTime()
        }
      }

      // Execute function
      const count = await checkOverdueTasks()

      // Verifications
      expect(count).toBe(1) // Only one notification sent
      expect(createNotification).toHaveBeenCalledTimes(1)
      expect(createNotification).toHaveBeenCalledWith(
        'user1', // Only for the user who activated notifications
        'Task overdue',
        'The task "User 1 Task" is overdue',
        'task_overdue',
        expect.any(Object)
      )

      // Restore Date
      global.Date = realDate
    })
  })
})