import React from 'react'
import { Task } from '@/types/task'
import { TaskCard } from './TaskCard'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'

interface TaskListProps {
  tasks: Task[]
  title: string
  emptyMessage?: string
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onAddNew?: () => void
  showAddButton?: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title,
  emptyMessage = 'Nenhuma tarefa encontrada',
  onToggleComplete,
  onEdit,
  onDelete,
  onAddNew,
  showAddButton = false
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 text-card-foreground border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {tasks.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.completed).length}/{tasks.length} completas
          </span>
        )}
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
      )}

      {showAddButton && onAddNew && (
        <Button
          onClick={onAddNew}
          variant="outline"
          className="w-full mt-4 border-dashed border-border hover:border-primary/30 hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Adicionar nova tarefa</span>
        </Button>
      )}
    </div>
  )
}
