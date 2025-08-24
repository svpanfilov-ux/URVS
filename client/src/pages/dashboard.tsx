import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TriangleAlert, 
  CheckCircle, 
  Users, 
  Plus, 
  FileText,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { Employee, TimeEntry } from "@shared/schema";
import { format, getDaysInMonth, differenceInDays, parseISO } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", format(new Date(), "yyyy-MM")],
  });

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const firedEmployees = employees.filter((emp) => emp.status === "fired");
  const contractEmployees = employees.filter((emp) => emp.status === "not_registered");
  const totalEmployees = employees.length;

  // Calculate real deadline days
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Авансовый период: до 15 числа
  const advanceDeadline = new Date(currentYear, currentMonth, 15);
  // Зарплатный период: до 5 числа следующего месяца
  const salaryDeadline = new Date(currentYear, currentMonth + 1, 5);
  
  const daysToAdvanceDeadline = Math.max(0, differenceInDays(advanceDeadline, today));
  const daysToSalaryDeadline = Math.max(0, differenceInDays(salaryDeadline, today));

  // Calculate real monthly statistics
  const currentMonthStr = format(today, "yyyy-MM");
  const daysInCurrentMonth = getDaysInMonth(today);
  const workdaysInMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Исключаем выходные
  }).filter(Boolean).length;
  
  const monthlyNormHours = workdaysInMonth * 8; // 8 часов в день
  
  const actualHours = timeEntries
    .filter((entry: TimeEntry) => typeof entry.hours === 'number')
    .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);
  
  const deviation = actualHours - monthlyNormHours;

  // Helper function for proper Russian pluralization
  const getDayWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return "день";
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return "дня";
    return "дней";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Дашборд</h2>
        <p className="text-muted-foreground">Общая информация и статистика</p>
      </div>

      {/* Deadline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">




        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активных сотрудников</p>
                <p className="text-2xl font-semibold text-foreground mt-1" data-testid="active-employees">
                  {activeEmployees.length}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <Users className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Всего: <span data-testid="total-employees">{totalEmployees}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Уволенных сотрудников</p>
                <p className="text-2xl font-semibold text-red-600 mt-1" data-testid="fired-employees">
                  {firedEmployees.length}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                <Users className="text-red-600 h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              За период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">На подработке</p>
                <p className="text-2xl font-semibold text-orange-600 mt-1" data-testid="contract-employees">
                  {contractEmployees.length}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
                <Users className="text-orange-600 h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Подработчики
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Месячная статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Норма часов за месяц:</span>
              <span className="font-medium" data-testid="monthly-norm">{monthlyNormHours} ч</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Фактически отработано:</span>
              <span className="font-medium text-green-600" data-testid="actual-hours">{actualHours} ч</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Отклонение от нормы:</span>
              <span className="font-medium text-orange-600" data-testid="deviation">{deviation} ч</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
              <div 
                className="bg-green-600 h-3 rounded-full" 
                style={{ width: `${(actualHours / monthlyNormHours) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
