import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TriangleAlert, 
  CheckCircle, 
  Users, 
  Plus, 
  FileText,
  Calendar,
  Briefcase,
  UserX,
  Building2,
  BarChart3,
  PieChart
} from "lucide-react";
import { useLocation } from "wouter";
import { Employee, TimeEntry, Position, Object as ObjectType } from "@shared/schema";
import { format, getDaysInMonth, differenceInDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useObjectStore } from "@/lib/object-store";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { selectedObjectId, setSelectedObjectId } = useObjectStore();
  const { user } = useAuth();

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", selectedObjectId],
    enabled: !!selectedObjectId,
    queryFn: () => fetch(`/api/positions?objectId=${selectedObjectId}`).then(res => res.json()),
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  // Filter employees by selected object for managers
  const relevantEmployees = user?.role === "manager" && selectedObjectId
    ? employees.filter(emp => emp.objectId === selectedObjectId)
    : employees;

  const activeEmployees = relevantEmployees.filter((emp) => emp.status === "active");
  const firedEmployees = relevantEmployees.filter((emp) => emp.status === "fired");
  const contractEmployees = relevantEmployees.filter((emp) => emp.status === "not_registered");
  
  const totalEmployees = relevantEmployees.length;
  
  // Calculate real deadline days
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate hired employees this month (for demo purposes, we'll consider those with recent creation)
  const hiredThisMonth = relevantEmployees.filter((emp) => {
    if (!emp.createdAt) return false;
    const createdDate = new Date(emp.createdAt);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  });

  // Calculate percentages
  const activePercentage = totalEmployees > 0 ? Math.round((activeEmployees.length / totalEmployees) * 100) : 0;
  const firedPercentage = totalEmployees > 0 ? Math.round((firedEmployees.length / totalEmployees) * 100) : 0;
  const contractPercentage = totalEmployees > 0 ? Math.round((contractEmployees.length / totalEmployees) * 100) : 0;
  const hiredPercentage = totalEmployees > 0 ? Math.round((hiredThisMonth.length / totalEmployees) * 100) : 0;

  // Calculate staffing and vacancies (for object manager role)
  const totalStaffPositions = positions.reduce((sum, pos) => sum + (pos.positionsCount || 0), 0);
  const objectEmployees = selectedObjectId 
    ? employees.filter(emp => emp.objectId === selectedObjectId && emp.status === "active")
    : [];
  const openVacancies = Math.max(0, totalStaffPositions - objectEmployees.length);
  
  // Авансовый период: до 15 числа
  const advanceDeadline = new Date(currentYear, currentMonth, 15);
  // Зарплатный период: до 5 числа следующего месяца
  const salaryDeadline = new Date(currentYear, currentMonth + 1, 5);
  
  const daysToAdvanceDeadline = Math.max(0, differenceInDays(advanceDeadline, today));
  const daysToSalaryDeadline = Math.max(0, differenceInDays(salaryDeadline, today));

  // Calculate real monthly statistics based on staffing schedule
  const currentMonthStr = format(today, "yyyy-MM");
  const daysInCurrentMonth = getDaysInMonth(today);
  
  // Calculate norm hours based on positions and work schedules
  const calculateMonthlyNormHours = () => {
    if (!positions.length) return 0;
    
    let totalNormHours = 0;
    
    positions.forEach(position => {
      const { workSchedule, hoursPerShift = 8, positionsCount = 0 } = position;
      let workdaysPerMonth = 0;
      
      // Calculate working days based on schedule
      switch (workSchedule) {
        case "5/2": // Monday-Friday
          workdaysPerMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
            const date = new Date(currentYear, currentMonth, i + 1);
            const dayOfWeek = date.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6;
          }).filter(Boolean).length;
          break;
        case "2/2": // 2 days work, 2 days rest
          workdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
          break;
        case "3/3": // 3 days work, 3 days rest  
          workdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
          break;
        case "6/1": // 6 days work, 1 day rest
          workdaysPerMonth = Math.floor((daysInCurrentMonth * 6) / 7);
          break;
        case "вахта (7/0)": // 7 days work continuously
          workdaysPerMonth = daysInCurrentMonth;
          break;
        default:
          workdaysPerMonth = Math.floor(daysInCurrentMonth * 5 / 7); // Default to 5/2
      }
      
      const hours = Math.max(0, workdaysPerMonth * hoursPerShift * positionsCount);
      totalNormHours += hours;
    });
    
    return totalNormHours;
  };

  const monthlyNormHours = calculateMonthlyNormHours();
  
  // Filter time entries for selected object if manager, all if economist
  // Also ensure we only use entries from current month
  const relevantTimeEntries = timeEntries.filter(entry => {
    // Filter by current month
    const entryMonth = format(new Date(entry.date), "yyyy-MM");
    const isCurrentMonth = entryMonth === currentMonthStr;
    
    // Filter by object for managers
    if (user?.role === "manager" && selectedObjectId) {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      return isCurrentMonth && employee?.objectId === selectedObjectId;
    }
    
    return isCurrentMonth;
  });
  
  const actualHours = relevantTimeEntries
    .filter((entry: TimeEntry) => typeof entry.hours === 'number')
    .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);
  
  const deviation = actualHours - monthlyNormHours;
  
  // Calculate FTE (Full Time Equivalent) based on standard 40-hour work week
  const standardWorkWeek = 40;
  const weeksInMonth = daysInCurrentMonth / 7;
  const standardMonthlyHours = standardWorkWeek * weeksInMonth;
  const currentFTE = standardMonthlyHours > 0 ? (actualHours / standardMonthlyHours).toFixed(2) : "0.00";
  const plannedFTE = standardMonthlyHours > 0 ? (monthlyNormHours / standardMonthlyHours).toFixed(2) : "0.00";

  // Calculate planned payroll fund (ФОТ) from staffing schedule
  const calculatePlannedPayroll = () => {
    if (!positions.length) return 0;
    
    let totalPlannedPayroll = 0;
    
    positions.forEach(position => {
      const { workSchedule, hoursPerShift = 8, positionsCount = 0, hourlyRate, monthlySalary } = position;
      
      if (monthlySalary && monthlySalary > 0) {
        // For salaried positions, multiply salary by positions count
        totalPlannedPayroll += monthlySalary * positionsCount;
      } else if (hourlyRate && hourlyRate > 0) {
        // For hourly positions, calculate monthly hours and multiply by rate
        let workdaysPerMonth = 0;
        
        switch (workSchedule) {
          case "5/2":
            workdaysPerMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
              const date = new Date(currentYear, currentMonth, i + 1);
              const dayOfWeek = date.getDay();
              return dayOfWeek !== 0 && dayOfWeek !== 6;
            }).filter(Boolean).length;
            break;
          case "2/2":
            workdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
            break;
          case "3/3":
            workdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
            break;
          case "6/1":
            workdaysPerMonth = Math.floor((daysInCurrentMonth * 6) / 7);
            break;
          case "вахта (7/0)":
            workdaysPerMonth = daysInCurrentMonth;
            break;
          default:
            workdaysPerMonth = Math.floor(daysInCurrentMonth * 5 / 7);
        }
        
        const monthlyHours = Math.max(0, workdaysPerMonth * hoursPerShift);
        totalPlannedPayroll += monthlyHours * hourlyRate * positionsCount;
      }
    });
    
    return totalPlannedPayroll;
  };

  const plannedPayrollFund = calculatePlannedPayroll();

  // Calculate actual payroll fund (ФОТ) from timesheet data  
  const calculateActualPayroll = () => {
    let totalActualPayroll = 0;
    
    relevantTimeEntries.forEach(entry => {
      if (typeof entry.hours === 'number' && entry.hours > 0) {
        // Find employee and their position to get rate
        const employee = employees.find(emp => emp.id === entry.employeeId);
        if (employee) {
          const position = positions.find(pos => 
            pos.title === employee.position && pos.objectId === employee.objectId
          );
          
          if (position) {
            if (position.hourlyRate && position.hourlyRate > 0) {
              totalActualPayroll += entry.hours * position.hourlyRate;
            } else if (position.monthlySalary && position.monthlySalary > 0) {
              // For salaried employees, calculate position-specific monthly hours
              const { workSchedule, hoursPerShift = 8 } = position;
              let positionWorkdaysPerMonth = 0;
              
              switch (workSchedule) {
                case "5/2":
                  positionWorkdaysPerMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
                    const date = new Date(currentYear, currentMonth, i + 1);
                    const dayOfWeek = date.getDay();
                    return dayOfWeek !== 0 && dayOfWeek !== 6;
                  }).filter(Boolean).length;
                  break;
                case "2/2":
                  positionWorkdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
                  break;
                case "3/3":
                  positionWorkdaysPerMonth = Math.floor(daysInCurrentMonth / 2);
                  break;
                case "6/1":
                  positionWorkdaysPerMonth = Math.floor((daysInCurrentMonth * 6) / 7);
                  break;
                case "вахта (7/0)":
                  positionWorkdaysPerMonth = daysInCurrentMonth;
                  break;
                default:
                  positionWorkdaysPerMonth = Math.floor(daysInCurrentMonth * 5 / 7);
              }
              
              const positionMonthlyHours = Math.max(1, positionWorkdaysPerMonth * hoursPerShift);
              const salaryPerHour = position.monthlySalary / positionMonthlyHours;
              totalActualPayroll += entry.hours * salaryPerHour;
            }
          }
        }
      }
    });
    
    return totalActualPayroll;
  };

  const actualPayrollFund = calculateActualPayroll();

  // Helper function for proper Russian pluralization
  const getDayWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return "день";
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return "дня";
    return "дней";
  };

  // Get objects for current manager
  const managerObjects = user?.role === "manager" 
    ? objects.filter(obj => obj.managerId === user.id && obj.status === 'active')
    : objects.filter(obj => obj.status === 'active');

  // Auto-select first object if manager has objects and none selected
  React.useEffect(() => {
    if (user?.role === "manager" && managerObjects.length > 0 && !selectedObjectId) {
      setSelectedObjectId(managerObjects[0].id);
    }
  }, [user, managerObjects, selectedObjectId, setSelectedObjectId]);

  const selectedObject = objects.find(obj => obj.id === selectedObjectId);
  
  // Format today's date in Russian
  const todayFormatted = format(new Date(), "d MMMM yyyy 'г.'", { locale: ru });
  const todayWeekday = format(new Date(), "EEEE", { locale: ru });

  return (
    <div className="space-y-6">
      {/* Date Display */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-1" data-testid="current-date">
          Сегодня {todayFormatted}
        </h1>
        <p className="text-lg text-muted-foreground capitalize" data-testid="current-weekday">
          {todayWeekday}
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Дашборд</h2>
        <p className="text-muted-foreground">Общая информация и статистика</p>
      </div>

      {/* Object Selector for Manager */}
      {user?.role === "manager" && managerObjects.length > 0 && (
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
              <Select value={selectedObjectId || undefined} onValueChange={setSelectedObjectId}>
                <SelectTrigger className="w-full" data-testid="object-selector">
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
                <p className="text-sm text-muted-foreground mt-2" data-testid="selected-object-info">
                  Выбранный объект: <span className="font-medium">{selectedObject.name}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No objects message for managers */}
      {user?.role === "manager" && managerObjects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Нет доступных объектов</h3>
              <p className="text-muted-foreground">
                Обратитесь к экономисту для назначения объектов под вашу ответственность.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
              Всего: <span data-testid="total-employees">{totalEmployees}</span> • {activePercentage}%
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
              За период • {firedPercentage}%
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
              Подработчики • {contractPercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Принято в месяце</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1" data-testid="hired-employees">
                  {hiredThisMonth.length}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <Users className="text-blue-600 h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Новые сотрудники • {hiredPercentage}%
            </p>
          </CardContent>
        </Card>

        {/* ФОТ Cards for Economist role */}
        {user?.role === "economist" && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Плановый ФОТ</p>
                    <p className="text-2xl font-semibold text-indigo-600 mt-1" data-testid="planned-payroll">
                      {plannedPayrollFund.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-full">
                    <Calendar className="text-indigo-600 h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Из штатного расписания за месяц
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Фактический ФОТ</p>
                    <p className="text-2xl font-semibold text-emerald-600 mt-1" data-testid="actual-payroll">
                      {actualPayrollFund.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-full">
                    <FileText className="text-emerald-600 h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  По данным табеля за месяц
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Object Manager specific cards */}
        {user?.role === "manager" && selectedObjectId && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Штатных должностей</p>
                    <p className="text-2xl font-semibold text-purple-600 mt-1" data-testid="staff-positions">
                      {totalStaffPositions}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                    <Briefcase className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Всего позиций на объекте
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Незакрытых вакансий</p>
                    <p className="text-2xl font-semibold text-red-600 mt-1" data-testid="open-vacancies">
                      {openVacancies}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                    <UserX className="text-red-600 h-6 w-6" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Требуется найм сотрудников
                </p>
              </CardContent>
            </Card>
          </>
        )}
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
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Плановый FTE:</span>
              <span className="font-medium text-blue-600" data-testid="planned-fte">{plannedFTE}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Текущий FTE:</span>
              <span className="font-medium text-purple-600" data-testid="current-fte">{currentFTE}</span>
            </div>
            
            {/* ФОТ metrics for economists */}
            {user?.role === "economist" && (
              <>
                <div className="flex justify-between items-center border-t pt-4 mt-4">
                  <span className="text-muted-foreground">Плановый ФОТ:</span>
                  <span className="font-medium text-indigo-600" data-testid="planned-payroll-stat">
                    {plannedPayrollFund.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Фактический ФОТ:</span>
                  <span className="font-medium text-emerald-600" data-testid="actual-payroll-stat">
                    {actualPayrollFund.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Отклонение ФОТ:</span>
                  <span className={`font-medium ${actualPayrollFund - plannedPayrollFund >= 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="payroll-deviation">
                    {(actualPayrollFund - plannedPayrollFund >= 0 ? '+' : '')}{(actualPayrollFund - plannedPayrollFund).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                  <div 
                    className={`h-3 rounded-full ${actualPayrollFund <= plannedPayrollFund ? 'bg-green-600' : 'bg-red-500'}`}
                    style={{ width: `${plannedPayrollFund > 0 ? Math.min((actualPayrollFund / plannedPayrollFund) * 100, 100) : 0}%` }}
                  />
                </div>
              </>
            )}

            {/* Hours progress bar for non-economists */}
            {user?.role !== "economist" && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                <div 
                  className="bg-green-600 h-3 rounded-full" 
                  style={{ width: `${monthlyNormHours > 0 ? (actualHours / monthlyNormHours) * 100 : 0}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts section for economists */}
        {user?.role === "economist" && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {/* ФОТ Comparison Chart */}
              <Card data-testid="fot-comparison-chart">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Плановый vs Фактический ФОТ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: 'Плановый ФОТ', value: plannedPayrollFund },
                      { name: 'Фактический ФОТ', value: actualPayrollFund }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k ₽`} />
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString('ru-RU')} ₽`, '']} />
                      <Bar dataKey="value">
                        <Cell fill="#4f46e5" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Employee Status Distribution */}
              <Card data-testid="employee-status-chart">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <PieChart className="h-4 w-4 inline mr-2" />
                    Состав сотрудников
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Активные', value: activeEmployees },
                          { name: 'Уволенные', value: firedEmployees },
                          { name: 'Договорники', value: contractEmployees },
                          { name: 'Новые', value: hiredThisMonth.length }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} чел.`, name]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Hours Comparison Chart */}
            <Card data-testid="hours-comparison-chart">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  Сравнение часов: норма vs факт
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Нормочасы', value: monthlyNormHours },
                    { name: 'Фактические часы', value: actualHours }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => [`${value} ч`, '']} />
                    <Bar dataKey="value">
                      <Cell fill="#4f46e5" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
