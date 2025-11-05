'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building2, 
  Calendar,
  Briefcase,
  BarChart3,
  TriangleAlert,
  CheckCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function SimpleDashboard() {
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

  // Format today's date in Russian
  const todayFormatted = format(today, "d MMMM yyyy 'г.'", { locale: ru })
  const todayWeekday = format(today, "EEEE", { locale: ru })

  // Helper function for proper Russian pluralization
  const getDayWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return "день"
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return "дня"
    return "дней"
  }

  // Mock data for demonstration
  const stats = {
    activeEmployees: 2,
    firedEmployees: 1,
    contractEmployees: 1,
    totalEmployees: 4
  }

  const objects = [
    { id: '1', name: 'Офисный центр "Солнечный"', code: 'OC001' },
    { id: '2', name: 'ЖК "Новые горизонты"', code: 'ZH002' },
    { id: '3', name: 'Торговый комплекс "Атлант"', code: 'TK003' }
  ]

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
                <p className="text-sm font-medium text-slate-900">Демо-режим</p>
                <p className="text-xs text-slate-600">Менеджер</p>
              </div>
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

          {/* Object Selector */}
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
                  Доступно {objects.length} объекта для демонстрации
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {objects.map((obj) => (
                    <div key={obj.id} className="p-3 border rounded-lg bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">{obj.name}</p>
                      <p className="text-xs text-slate-600">{obj.code}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Активных сотрудников</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {stats.activeEmployees}
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
                      {stats.firedEmployees}
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
                      {stats.contractEmployees}
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
                      {stats.totalEmployees}
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

          {/* Demo Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Демонстрационный режим</h3>
                <p className="text-muted-foreground mb-4">
                  Это демонстрационная версия системы УРВС. Все данные являются примерами для демонстрации функциональности.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Демо-аккаунты:</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Администратор:</strong> admin / admin123</p>
                      <p><strong>Менеджер:</strong> manager / admin123</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Функции:</p>
                    <div className="space-y-1 text-sm">
                      <p>✓ Управление сотрудниками</p>
                      <p>✓ Учет рабочего времени</p>
                      <p>✓ Формирование отчетов</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}