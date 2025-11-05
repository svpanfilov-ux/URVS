'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Users, Eye, EyeOff, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface User {
  id: string
  username: string
  name: string
  role: 'MANAGER' | 'ECONOMIST'
  isActive: boolean
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const today = new Date()
  const todayFormatted = format(today, "d MMMM yyyy 'г.'", { locale: ru })

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('urvs_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        router.push('/dashboard')
      } catch (err) {
        localStorage.removeItem('urvs_user')
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        // Store user in localStorage for session persistence
        localStorage.setItem('urvs_user', JSON.stringify(data.user))
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.error || 'Ошибка входа в систему')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  // Don't redirect here - let useEffect handle it
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Переход в систему...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900">УРВС</h1>
          </div>
          <p className="text-lg text-slate-600 mb-2">
            Управление Рабочим Временем и Сотрудниками
          </p>
          <p className="text-sm text-slate-500">
            Сегодня {todayFormatted}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-slate-900">
              Вход в систему
            </CardTitle>
            <p className="text-sm text-center text-slate-600">
              Введите ваши учетные данные для доступа
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                  Имя пользователя
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  className="w-full"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Вход...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Войти в систему
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center mb-3">
                Демо-аккаунты для тестирования:
              </p>
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Администратор</p>
                      <p className="text-xs text-slate-500">Экономист</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-600">admin</p>
                      <p className="text-xs font-mono text-slate-600">admin123</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Менеджер</p>
                      <p className="text-xs text-slate-500">Управление объектами</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-600">manager</p>
                      <p className="text-xs font-mono text-slate-600">admin123</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Система управления персоналом и рабочим временем
          </p>
          <div className="flex items-center justify-center mt-2 text-xs text-slate-400">
            <Users className="h-3 w-3 mr-1" />
            Версия 1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}