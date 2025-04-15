import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const AVAILABLE_ICONS = [
  'Briefcase', 'User', 'Heart', 'DollarSign', 'Users', 'BookOpen', 'Coffee', 
  'Car', 'Home', 'Plane', 'ShoppingBag', 'Gift', 'Star', 'Film', 'Music', 
  'Book', 'Utensils', 'Laptop', 'Smartphone', 'Camera', 'Gamepad', 'Compass', 
  'Leaf', 'Award', 'Palette', 'Scissors', 'Truck', 'Globe', 'Calendar', 'Mail', 
  'MessageSquare', 'Bell', 'Map', 'Clock', 'Bookmark', 'FileText', 'Folder'
]

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const filteredIcons = AVAILABLE_ICONS.filter(icon => 
    icon.toLowerCase().includes(filter.toLowerCase())
  )

  const SelectedIcon = value ? (LucideIcons as any)[value] : LucideIcons.Folder

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-20 flex flex-col justify-center items-center gap-2"
        >
          <SelectedIcon className="w-6 h-6" />
          <span className="text-xs">{value || 'Selecionar ícone'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha um ícone</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            placeholder="Buscar ícones..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />
          <div className="grid grid-cols-5 gap-2">
            {filteredIcons.map((iconName) => {
              const Icon = (LucideIcons as any)[iconName]
              return (
                <Button
                  key={iconName}
                  variant="outline"
                  className={`aspect-square flex justify-center items-center p-2 ${
                    value === iconName ? 'border-2 border-primary' : ''
                  }`}
                  onClick={() => {
                    onChange(iconName)
                    setIsOpen(false)
                  }}
                >
                  <Icon className="w-6 h-6" />
                </Button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}