'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Building2, 
  Calendar,
  Briefcase,
  BarChart3,
  TriangleAlert,
  CheckCircle,
  LogOut
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'

// Types
interface User {
  id: string
  username: string
  name: string
  role: 'MANAGER' | 'ECONOMIST'
  isActive: boolean
}

interface Object {
  id: string
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'CLOSED'
  managerId?: string
  _count?: {
    employees: number
  }
}

interface Employee {
  id: string
  name: string
  position: string
  status: 'ACTIVE' | 'NOT_REGISTERED' | 'FIRED'
  objectId: string
  object?: Object
}

export default function Dashboard() {
  const [selectedObjectId, setSelectedObjectId] = useState<string>('')
  const [user, setUser] = useState<User | null>(null)
  const [objects, setObjects] = useState<Object[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Calculate real deadline days
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // Авансовый период: до 15 числа
  const advanceDeadline = new Date(currentYear, currentMonth, 15)
  // Зарплатный период: до 5 числа следующего месяца
  const salaryDeadline = new Date(currentYear, currentMonth + 1, 5)
  
  const daysToAdvanceDeadline = Math.max(0, differenceInDays(advanceDeadline, today))
  const daysToSalaryDeadline = Math.max(0, differenceInDays(salaryDeadline, today))

  // Filter employees by selected object for managers
  const relevantEmployees = user?.role === 'MANAGER' && selectedObjectId
    ? employees.filter(emp => emp.objectId === selectedObjectId)
    : employees

  const activeEmployees = relevantEmployees.filter((emp) => emp.status === 'ACTIVE')
  const firedEmployees = relevantEmployees.filter((emp) => emp.status === 'FIRED')
  const contractEmployees = relevantEmployees.filter((emp) => emp.status === 'NOT_REGISTERED')
  
  const totalEmployees = relevantEmployees.length

  // Get objects for current manager
  const managerObjects = user?.role === 'MANAGER' 
    ? objects.filter(obj => obj.status === 'ACTIVE')
    : objects.filter(obj => obj.status === 'ACTIVE')

  // Auto-select first object if manager has objects and none selected
  useEffect(() => {
    if (user?.role === 'MANAGER' && managerObjects.length > 0 && !selectedObjectId) {
      setSelectedObjectId(managerObjects[0].id)
    }
  }, [user, managerObjects, selectedObjectId])

  const selectedObject = objects.find(obj => obj.id === selectedObjectId)
  
  // Format today's date in Russian
  const todayFormatted = format(new Date(), "d MMMM yyyy 'г.'", { locale: ru })
  const todayWeekday = format(new Date(), "EEEE", { locale: ru })

  // Helper function for proper Russian pluralization
  const getDayWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return "день"
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return "дня"
    return "дней"
  }

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is logged in (only on client side)
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('urvs_user')
          if (!storedUser) {
            router.push('/')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        }

        // Fetch objects
        const objectsResponse = await fetch('/api/objects')
        if (objectsResponse.ok) {
          const objectsData = await objectsResponse.json()
          setObjects(objectsData)
        }

        // Fetch employees
        const employeesResponse = await fetch('/api/employees')
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json()
          setEmployees(employeesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('urvs_user')
    }
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">УРВС</h1>
                <p className="text-sm text-slate-600">Система управления персоналом</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-600">
                  {user.role === 'MANAGER' ? 'Менеджер' : 'Экономист'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Date Display */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-1">
              Сегодня {todayFormatted}
            </h1>
            <p className="text-lg text-muted-foreground capitalize">
              {todayWeekday}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Дашборд</h2>
            <p className="text-muted-foreground">Общая информация и статистика</p>
          </div>

          {/* Object Selector for Manager */}
          {user?.role === 'MANAGER' && managerObjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Выбор объекта
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    У вас доступ к {managerObjects.length} объекту{managerObjects.length === 1 ? '' : managerObjects.length < 5 ? 'ам' : 'ам'}
                  </p>
                  <Select value={selectedObjectId || ''} onValueChange={setSelectedObjectId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите объект" />
                    </SelectTrigger>
                    <SelectContent>
                      {managerObjects.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedObject && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Выбранный объект: <span className="font-medium">{selectedObject.name}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Активных сотрудников</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {activeEmployees.length}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Уволенные</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {firedEmployees.length}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">По договорам</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {contractEmployees.length}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Всего сотрудников</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {totalEmployees}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deadline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Дедлайн авансового отчета</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {daysToAdvanceDeadline} {getDayWord(daysToAdvanceDeadline)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {daysToAdvanceDeadline <= 3 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <TriangleAlert className="h-4 w-4" />
                          Срочно!
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          В норме
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Дедлайн зарплатного отчета</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {daysToSalaryDeadline} {getDayWord(daysToSalaryDeadline)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {daysToSalaryDeadline <= 3 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <TriangleAlert className="h-4 w-4" />
                          Срочно!
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          В норме
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto p-4 flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Сотрудники</span>
                </Button>
                <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
                  <Calendar className="h-6 w-6" />
                  <span>Табель</span>
                </Button>
                <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
                  <BarChart3 className="h-6 w-6" />
                  <span>Отчеты</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}