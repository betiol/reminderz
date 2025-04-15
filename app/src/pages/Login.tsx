import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RegisterPage } from '@/pages/Register'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Navigate } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  const { login, currentUser, updateUserTimezone } = useAuth()
  const navigate = useNavigate()

  if (currentUser) {
    return <Navigate to="/" replace />
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    setError(null)

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      await login(data.email, data.password)

      await updateUserTimezone(userTimezone)

      navigate('/')
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          'Erro ao fazer login. Verifique suas credenciais.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8 border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">reminderz</h1>
          <p className="text-muted-foreground mt-1">
            Nunca esqueça de tarefas importantes
          </p>
        </div>

        {!showRegister ? (
          <>
            <h2 className="text-xl font-semibold mb-6 text-center">
              Faça login na sua conta
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Ainda não tem uma conta?{' '}
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Registre-se
                </button>
              </p>
            </div>
          </>
        ) : (
          <RegisterPage
            onRegister={() => navigate('/')}
            onBackToLogin={() => setShowRegister(false)}
          />
        )}
      </div>
    </div>
  )
}