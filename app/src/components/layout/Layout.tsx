import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search, Moon, Sun, Bell } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { TaskForm } from '@/components/task/TaskForm'
import { CreateTaskDto, UpdateTaskDto } from '@/types/task'
import { TaskService } from '@/services/taskService'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { ApiService } from '@/services/api'
import React from 'react'

export const SearchContext = React.createContext({
  searchQuery: '',
  //@ts-ignore
  setSearchQuery: (query: string) => {},
});

//@ts-ignore
const MainLayout = ({ children }) => {
  const { currentUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('home')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  const [overdueCount, setOverdueCount] = useState(0)
  const [overdueTasks, setOverdueTasks] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  
  useEffect(() => {
    const fetchOverdueTasks = async () => {
      try {
        const response = await ApiService.get('/tasks/overdue-count')
        //@ts-ignore
        setOverdueCount(response?.data?.count)
        //@ts-ignore
        setOverdueTasks(response?.data?.tasks || [])
      } catch (error) {
        console.error('Erro ao buscar tarefas atrasadas:', error)
      }
    }

    fetchOverdueTasks()

    const interval = setInterval(fetchOverdueTasks, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    //@ts-ignore
    const handleClickOutside = (event) => {
      //@ts-ignore
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const refreshData = () => {
    window.location.reload()
  }

  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: ptBR
  })

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleAddNewTask = () => {
    setIsFormOpen(true)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(
        `/tasks-by-status?status=all&search=${encodeURIComponent(searchQuery)}`
      )
    }
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const handleFormSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    setIsSubmitting(true)
    try {
      //@ts-ignore
      await TaskService.createTask(data as CreateTaskDto)
      showToast('success', 'Tarefa criada com sucesso!')
      refreshData()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      showToast('error', 'Erro ao criar tarefa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteTask = async (taskId: string, deleteFuture: boolean = false) => {
    try {
      await TaskService.deleteTask(taskId, deleteFuture)
      showToast('success', 'Tarefa excluída com sucesso!')
      refreshData()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      showToast('error', 'Erro ao excluir tarefa. Tente novamente.')
    }
  }

  return (
    <SearchContext.Provider value={{ searchQuery: debouncedSearchQuery, setSearchQuery }}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar activePage={activePage} onChangePage={setActivePage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header fixo */}
          <header className="bg-background border-b border-border shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Olá, {currentUser?.name || 'Usuário'}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hoje é {formattedDate}
                </p>
              </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar tarefas..."
                  className={`pl-9 pr-4 py-2 rounded-md border ${
                    searchQuery ? "border-primary bg-primary/5" : "border-input bg-background"
                  } text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearch}
                />
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${
                  searchQuery ? "text-primary" : "text-muted-foreground"
                }`} />
                {searchQuery && (
                  <button 
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpar pesquisa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Notificações */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell  className="h-5 w-5 text-primary-500" />
                  {overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {overdueCount}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 dark:bg-amber-900/20">
                      <h4 className="text-sm font-semibold flex items-center dark:text-amber-400">
                        <Bell className="h-5 w-5 mr-2" />
                        Tarefas Atrasadas
                      </h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {overdueTasks.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {overdueTasks.map((task: any) => (
                            <div key={task._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Venceu em {new Date(task.date).toLocaleDateString()}
                                {task.time && ` às ${task.time}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Sem tarefas atrasadas 🎉
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="link" 
                        className="w-full" 
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/');
                        }}
                      >
                        Ver todas as tarefas
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="default"
                onClick={handleAddNewTask}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Nova Tarefa</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>

        {/* Formulário de tarefa */}
        {isFormOpen && (
          <TaskForm
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            onDelete={handleDeleteTask}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
    </SearchContext.Provider>
  )
}

export { MainLayout }
