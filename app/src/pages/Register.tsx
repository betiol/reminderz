import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  })

interface RegisterPageProps {
  onRegister: () => void
  onBackToLogin: () => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onBackToLogin
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true)
    setError(null)

    try {
      await registerUser(data.name, data.email, data.password)
      onRegister()
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          'Erro ao fazer registro. Tente novamente.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Crie sua conta</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome
          </label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
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
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirmar Senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBackToLogin}
          className="text-primary hover:underline font-medium inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para login
        </button>
      </div>
    </>
  )
}
