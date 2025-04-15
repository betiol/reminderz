import { NavLink } from 'react-router-dom'
import {
  Bell,
  Calendar,
  CheckCircle2,
  Home,
  Settings,
  LogOut,
  BarChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { ApiService } from '@/services/api'

//@ts-ignore
export const Sidebar = ({ activePage, onChangePage }) => {
  const { logout } = useAuth()
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchOverdueTasks = async () => {
      try {
        const response = await ApiService.get('/tasks/overdue-count');
        //@ts-ignore
        setOverdueCount(response?.data.count);
        //@ts-ignore
        setOverdueTasks(response?.data.tasks || []);
      } catch (error) {
        console.error('Erro ao buscar tarefas atrasadas:', error);
      }
    };

    fetchOverdueTasks();

    const interval = setInterval(fetchOverdueTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout()
    }
  }
  

  return (
    <div className="w-16 md:w-64 bg-background border-r border-border shadow-md flex flex-col h-full">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <h1 className="ml-3 text-xl font-bold text-foreground hidden md:block">
          reminderz
        </h1>
      </div>

      {showNotifications && (
        <div className="absolute right-0 mt-16 ml-16 w-80 bg-white shadow-lg rounded-lg z-50 border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-primary/10">
            <h4 className="text-sm font-semibold flex items-center">
              <Bell className="h-5 w-5 text-red-500 mr-2" />
              Tarefas Atrasadas ({overdueCount})
            </h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {overdueTasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {overdueTasks.map((task: any) => (
                  <div key={task._id} className="p-3 hover:bg-gray-50">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      Venceu em {new Date(task.date).toLocaleDateString()}
                      {task.time && ` às ${task.time}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Sem tarefas atrasadas
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <NavLink
              to="/"
              className="text-primary text-sm font-medium block text-center"
              onClick={() => {setShowNotifications(false); onChangePage('home')}}
            >
              Ver todas as tarefas
            </NavLink>
          </div>
        </div>
      )}

      <nav className="flex-1 mt-6">

        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3',
              isActive
                ? 'text-primary bg-primary/10 border-r-4 border-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )
          }
          onClick={() => onChangePage('home')}
        >
          <Home className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Início</span>
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3',
              isActive
                ? 'text-primary bg-primary/10 border-r-4 border-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )
          }
          onClick={() => onChangePage('calendar')}
        >
          <Calendar className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Calendário</span>
        </NavLink>

        <NavLink
          to="/completed"
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3',
              isActive
                ? 'text-primary bg-primary/10 border-r-4 border-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )
          }
          onClick={() => onChangePage('completed')}
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Tarefas Concluídas</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3',
              isActive
                ? 'text-primary bg-primary/10 border-r-4 border-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )
          }
          onClick={() => onChangePage('reports')}
        >
          <BarChart className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Relatórios</span>
        </NavLink>
      </nav>

      <div className="p-4 mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3',
              isActive
                ? 'text-primary bg-primary/10 border-r-4 border-primary'
                : 'text-muted-foreground hover:bg-accent/50'
            )
          }
          onClick={() => onChangePage('settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Configurações</span>
        </NavLink>

        <button
          className="flex items-center px-4 py-3 text-muted-foreground hover:bg-accent/50 mt-2 w-full text-left"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3 hidden md:block">Sair</span>
        </button>
      </div>
    </div>
  )
}
