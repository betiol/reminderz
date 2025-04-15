
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  ChevronRight,
  Clock,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useUserPreferences } from '@/context/UserPreferencesContext'
import { CategoriesTab } from '@/components/settings/CategoriesTab'


const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  timezone: z.string().min(1, 'Timezone é obrigatória')
})


const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua nova senha')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  })

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications' | 'appearance' | 'categories'
  >('profile')
  const { updateProfile, currentUser } = useAuth()
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const { preferences, updatePreferences, isLoading: isPreferencesLoading } = useUserPreferences()
  const [timezones, setTimezones] = useState<string[]>([])

  
  useEffect(() => {
    
    const availableTimezones = [
      
      'America/Cuiaba',
      'America/Sao_Paulo',
      'America/Rio_Branco',
      'America/Manaus',
      'America/Bahia',
      'America/Fortaleza',
      'America/Recife',
      'America/Noronha',
      'America/Belem',
      'America/Maceio',
      
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Mexico_City',
      
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Moscow',
      
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Singapore',
      'Asia/Dubai',
      
      'Australia/Sydney',
      'Australia/Perth',
      'Pacific/Auckland',
      
      'Africa/Cairo',
      'Africa/Johannesburg'
    ]
    setTimezones(availableTimezones)
  }, [])

  
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
    watch: watchProfile
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || 'Nikollas',
      email: currentUser?.email || 'nikollas@example.com',
      timezone: currentUser?.timezone || 'America/Sao_Paulo'
    }
  })

  const currentTimezone = watchProfile('timezone')

  
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema)
  })

  //@ts-ignore
  const onSubmitProfile = async (data: z.infer<typeof profileSchema>) => {
    console.log('data', data)
    setIsProfileSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    await updateProfile(data)

    
    setTimeout(() => {
      setSuccessMessage('Perfil atualizado com sucesso!')
      setIsProfileSubmitting(false)
    }, 1000)
  }

  //@ts-ignore
  const onSubmitPassword = async (data: z.infer<typeof passwordSchema>) => {
    setIsPasswordSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    
    setTimeout(() => {
      setSuccessMessage('Senha alterada com sucesso!')
      setIsPasswordSubmitting(false)
      resetPassword()
    }, 1000)
  }

  const handleChangeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    setSuccessMessage('Tema alterado com sucesso!')
  }

  const handleTimezoneChange = (value: string) => {
    console.log('value', value)
    setProfileValue('timezone', value)
  }

  
  const formatTimezone = (timezone: string) => {
    
    const [region, city] = timezone.split('/')
    return `${region} - ${city.replace(/_/g, ' ')}`
  }

  
  const getCurrentTime = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: currentTimezone
      }
      return new Date().toLocaleTimeString('pt-BR', options)
    } catch (error) {
      return new Date().toLocaleTimeString('pt-BR')
    }
  }

  return (
    <>
      <header className="bg-card shadow-sm">
        <div className="px-4 py-3">
          <h2 className="text-xl font-semibold text-gray-800">Configurações</h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Menu lateral */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <button
                    className={`flex items-center px-4 py-3 text-left ${
                      activeTab === 'profile'
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="w-5 h-5 mr-3" />
                    <span>Perfil</span>
                    {activeTab !== 'profile' && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>

                  <button
                    className={`flex items-center px-4 py-3 text-left ${
                      activeTab === 'security'
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    <span>Segurança</span>
                    {activeTab !== 'security' && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>

                  <button
                    className={`flex items-center px-4 py-3 text-left ${
                      activeTab === 'notifications'
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="w-5 h-5 mr-3" />
                    <span>Notificações</span>
                    {activeTab !== 'notifications' && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>

                  <button
                    className={`flex items-center px-4 py-3 text-left ${
                      activeTab === 'appearance'
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('appearance')}
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 mr-3" />
                    ) : (
                      <Sun className="w-5 h-5 mr-3" />
                    )}
                    <span>Aparência</span>
                    {activeTab !== 'appearance' && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>

                  <button
                    className={`flex items-center px-4 py-3 text-left ${
                      activeTab === 'categories'
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('categories')}
                  >
                    <Tag className="w-5 h-5 mr-3" />
                    <span>Categorias</span>
                    {activeTab !== 'categories' && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo principal */}
          <div className="md:col-span-3">
            {/* Mensagens de sucesso/erro */}
            {successMessage && (
              <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4 flex justify-between items-center">
                <span>{successMessage}</span>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-500 hover:text-green-700"
                >
                  &times;
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4 flex justify-between items-center">
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Aba de Perfil */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Nome
                        </label>
                        <Input
                          id="name"
                          {...registerProfile('name')}
                          className={profileErrors.name ? 'border-red-500' : ''}
                        />
                        {profileErrors.name && (
                          <p className="mt-1 text-xs text-red-500">
                            {profileErrors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          {...registerProfile('email')}
                          className={
                            profileErrors.email ? 'border-red-500' : ''
                          }
                        />
                        {profileErrors.email && (
                          <p className="mt-1 text-xs text-red-500">
                            {profileErrors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="timezone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Fuso Horário
                        </label>
                        <div className="flex flex-col space-y-2">
                          <Select
                            onValueChange={handleTimezoneChange}
                            defaultValue={currentTimezone}
                          >
                            <SelectTrigger
                              id="timezone"
                              className={
                                profileErrors.timezone ? 'border-red-500' : ''
                              }
                            >
                              <SelectValue placeholder="Selecione seu fuso horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {timezones.map((timezone) => (
                                <SelectItem key={timezone} value={timezone}>
                                  {formatTimezone(timezone)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {profileErrors.timezone && (
                            <p className="mt-1 text-xs text-red-500">
                              {profileErrors.timezone.message}
                            </p>
                          )}
                          <div className="mt-2 text-sm flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Horário atual: {getCurrentTime()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button type="submit" disabled={isProfileSubmitting}>
                        {isProfileSubmitting
                          ? 'Salvando...'
                          : 'Salvar alterações'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Aba de Segurança */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Segurança da Conta</CardTitle>
                  <CardDescription>
                    Altere sua senha ou configure a autenticação de dois fatores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Senha Atual
                        </label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...registerPassword('currentPassword')}
                          className={
                            passwordErrors.currentPassword
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordErrors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Nova Senha
                        </label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...registerPassword('newPassword')}
                          className={
                            passwordErrors.newPassword ? 'border-red-500' : ''
                          }
                        />
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordErrors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Confirmar Nova Senha
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...registerPassword('confirmPassword')}
                          className={
                            passwordErrors.confirmPassword
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordErrors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button type="submit" disabled={isPasswordSubmitting}>
                        {isPasswordSubmitting
                          ? 'Alterando senha...'
                          : 'Alterar senha'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Aba de Notificações */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>
                    Escolha como e quando deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <h4 className="font-medium">Lembretes de tarefas</h4>
                        <p className="text-sm text-gray-500">
                          Receba notificações para tarefas próximas do prazo
                        </p>
                      </div>
                      <div className="flex items-center h-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="task-reminders" 
                            checked={preferences.taskReminders}
                            onCheckedChange={(checked) => 
                              updatePreferences({ taskReminders: checked === true })
                            }
                          />
                          <label
                            htmlFor="task-reminders"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ativar
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <h4 className="font-medium">Email diário</h4>
                        <p className="text-sm text-gray-500">
                          Receba um resumo diário de suas tarefas
                        </p>
                      </div>
                      <div className="flex items-center h-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="daily-email" 
                            checked={preferences.emailNotifications}
                            onCheckedChange={(checked) => 
                              updatePreferences({ emailNotifications: checked === true })
                            }
                          />
                          <label
                            htmlFor="daily-email"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ativar
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <h4 className="font-medium">Notificações push</h4>
                        <p className="text-sm text-gray-500">
                          Receba alertas no seu dispositivo
                        </p>
                      </div>
                      <div className="flex items-center h-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="push-notifications" 
                            checked={preferences.pushNotifications}
                            onCheckedChange={(checked) => 
                              updatePreferences({ pushNotifications: checked === true })
                            }
                          />
                          <label
                            htmlFor="push-notifications"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ativar
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="py-3 border-b">
                      <div className="mb-2">
                        <h4 className="font-medium">Tempo de lembrete padrão</h4>
                        <p className="text-sm text-gray-500">
                          Quanto tempo antes do evento você deseja ser notificado
                        </p>
                      </div>
                      <div className="mt-2">
                        <Select 
                          value={preferences.reminderTime.toString()} 
                          onValueChange={(value) => updatePreferences({ reminderTime: parseInt(value) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tempo de lembrete" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No momento do evento</SelectItem>
                            <SelectItem value="5">5 minutos antes</SelectItem>
                            <SelectItem value="10">10 minutos antes</SelectItem>
                            <SelectItem value="15">15 minutos antes</SelectItem>
                            <SelectItem value="30">30 minutos antes</SelectItem>
                            <SelectItem value="60">1 hora antes</SelectItem>
                            <SelectItem value="120">2 horas antes</SelectItem>
                            <SelectItem value="1440">1 dia antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="button"
                      disabled={isPreferencesLoading}
                      onClick={async () => {
                        try {
                          
                          
                          await updatePreferences({});
                          setSuccessMessage('Preferências de notificação salvas!');
                        } catch (error) {
                          console.error("Erro ao salvar preferências:", error);
                          setErrorMessage('Erro ao salvar preferências. Tente novamente.');
                        }
                      }}
                    >
                      {isPreferencesLoading ? 'Salvando...' : 'Salvar preferências'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aba de Aparência */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Aparência</CardTitle>
                  <CardDescription>
                    Personalize a aparência do seu aplicativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tema</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <Card
                          className={`cursor-pointer border-2 ${
                            theme === 'light'
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                          onClick={() => handleChangeTheme('light')}
                        >
                          <CardContent className="p-4 flex flex-col items-center">
                            <Sun className="h-10 w-10 mb-2 text-amber-500" />
                            <span>Claro</span>
                          </CardContent>
                        </Card>

                        <Card
                          className={`cursor-pointer border-2 ${
                            theme === 'dark'
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                          onClick={() => handleChangeTheme('dark')}
                        >
                          <CardContent className="p-4 flex flex-col items-center">
                            <Moon className="h-10 w-10 mb-2 text-indigo-500" />
                            <span>Escuro</span>
                          </CardContent>
                        </Card>

                        <Card
                          className={`cursor-pointer border-2 ${
                            theme === 'system'
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                          onClick={() => handleChangeTheme('system')}
                        >
                          <CardContent className="p-4 flex flex-col items-center">
                            <div className="h-10 w-10 mb-2 flex">
                              <div className="w-1/2 flex items-center justify-center bg-amber-500 rounded-l-full">
                                <Sun className="h-5 w-5 text-white" />
                              </div>
                              <div className="w-1/2 flex items-center justify-center bg-indigo-500 rounded-r-full">
                                <Moon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <span>Sistema</span>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aba de Categorias */}
            {activeTab === 'categories' && <CategoriesTab />}
          </div>
        </div>
      </main>
    </>
  )
}
