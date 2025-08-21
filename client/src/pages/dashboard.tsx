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
import { Employee } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const totalEmployees = employees.length;

  // Calculate deadline days (mock data for demo)
  const daysToAdvanceDeadline = 3;
  const daysToSalaryDeadline = 12;
  const monthlyNormHours = 176;
  const actualHours = 164;
  const deviation = actualHours - monthlyNormHours;

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
                <p className="text-sm font-medium text-muted-foreground">До закрытия аванса</p>
                <p className="text-2xl font-semibold text-orange-600 mt-1" data-testid="days-to-advance">
                  {daysToAdvanceDeadline} дня
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
                <TriangleAlert className="text-orange-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={25} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">До закрытия зарплаты</p>
                <p className="text-2xl font-semibold text-green-600 mt-1" data-testid="days-to-salary">
                  {daysToSalaryDeadline} дней
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <CheckCircle className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/timesheet")}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="action-timesheet"
            >
              <Plus className="h-4 w-4 mr-2" />
              Заполнить табель
            </Button>
            <Button 
              onClick={() => navigate("/employees")}
              variant="outline"
              className="w-full"
              data-testid="action-employees"
            >
              <Users className="h-4 w-4 mr-2" />
              Управление сотрудниками
            </Button>
            <Button 
              onClick={() => navigate("/reports")}
              variant="outline"
              className="w-full"
              data-testid="action-reports"
            >
              <FileText className="h-4 w-4 mr-2" />
              Сформировать отчёт
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
