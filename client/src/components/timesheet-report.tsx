import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Employee, TimeEntry, Position } from "@shared/schema";
import { calculatePlannedHours, calculateSalary } from "@/lib/payroll-calculations";
import { getDaysInMonth } from "date-fns";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface TimesheetReportProps {
  month: string; // Format: "YYYY-MM"
  employees: Employee[];
  timeEntries: TimeEntry[];
  positions: Position[];
  objectId: string;
}

interface EmployeeReportRow {
  employeeId: string;
  name: string;
  position: string;
  paymentType: string;
  rate: number; // hourlyRate or monthlySalary
  plannedHours: number;
  actualHours: number;
  plannedSalary: number; // плановый ФОТ для этого сотрудника
  totalSalary: number;
  advanceSalary: number;
  mainSalary: number;
  paymentMethod: string; // card or cash
  isValid: boolean; // actualHours >= plannedHours
}

export function TimesheetReport({
  month,
  employees,
  timeEntries,
  positions,
  objectId,
}: TimesheetReportProps) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = getDaysInMonth(new Date(year, monthNum - 1));

  // Фильтр сотрудников по объекту и только активные
  const objectEmployees = employees.filter(emp => 
    emp.objectId === objectId && 
    emp.status === "active" &&
    emp.name && // Исключаем записи без имени
    emp.id // Исключаем записи без ID
  );

  // Расчёт данных отчёта для каждого сотрудника
  const reportData: EmployeeReportRow[] = useMemo(() => {
    return objectEmployees.map(employee => {
      // Расчёт плановых часов по графику
      const plannedHours = calculatePlannedHours(employee.workSchedule, year, monthNum);

      // Расчёт фактических часов из табеля
      const employeeEntries = timeEntries.filter(entry => entry.employeeId === employee.id);
      
      const hoursByDay: { day: number; hours: number }[] = [];
      let totalActualHours = 0;
      let advanceHours = 0;
      let mainHours = 0;

      // Группируем записи по дням
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const entry = employeeEntries.find(e => e.date === dateStr);
        
        if (entry && typeof entry.hours === "number") {
          totalActualHours += entry.hours;
          hoursByDay.push({ day, hours: entry.hours });
          
          if (day <= 15) {
            advanceHours += entry.hours;
          } else {
            mainHours += entry.hours;
          }
        }
      }

      // Расчёт планового ФОТ
      const plannedSalary = employee.paymentType === "salary"
        ? (employee.monthlySalary || 0) // Для окладников - полный оклад
        : Math.round((employee.hourlyRate || 0) * plannedHours); // Для почасовиков - ставка × плановые часы

      // Расчёт фактической заработной платы
      const totalSalary = calculateSalary(
        employee.paymentType,
        totalActualHours,
        plannedHours,
        employee.monthlySalary || undefined,
        employee.hourlyRate || undefined
      );

      // Разделение на аванс и зарплату (пропорционально часам)
      const advanceSalary = totalActualHours > 0 
        ? Math.round((totalSalary * advanceHours) / totalActualHours)
        : 0;
      const mainSalary = totalSalary - advanceSalary;

      // Валидация: actualHours >= plannedHours
      const isValid = totalActualHours >= plannedHours;

      return {
        employeeId: employee.id,
        name: employee.name,
        position: employee.position,
        paymentType: employee.paymentType,
        rate: employee.paymentType === "salary" ? (employee.monthlySalary || 0) : (employee.hourlyRate || 0),
        plannedHours,
        actualHours: totalActualHours,
        plannedSalary,
        totalSalary,
        advanceSalary,
        mainSalary,
        paymentMethod: employee.paymentMethod || "card",
        isValid,
      };
    });
  }, [objectEmployees, timeEntries, year, monthNum, daysInMonth]);

  // Итоговые суммы
  const totals = useMemo(() => {
    const plannedHoursTotal = reportData.reduce((sum, row) => sum + row.plannedHours, 0);
    const actualHoursTotal = reportData.reduce((sum, row) => sum + row.actualHours, 0);
    const plannedFOT = reportData.reduce((sum, row) => sum + row.plannedSalary, 0);
    const actualFOT = reportData.reduce((sum, row) => sum + row.totalSalary, 0);

    // Разделение по способу оплаты (аванс)
    const advanceCard = reportData
      .filter(row => row.paymentMethod === "card")
      .reduce((sum, row) => sum + row.advanceSalary, 0);
    const advanceCash = reportData
      .filter(row => row.paymentMethod === "cash")
      .reduce((sum, row) => sum + row.advanceSalary, 0);

    // Разделение по способу оплаты (зарплата)
    const salaryCard = reportData
      .filter(row => row.paymentMethod === "card")
      .reduce((sum, row) => sum + row.mainSalary, 0);
    const salaryCash = reportData
      .filter(row => row.paymentMethod === "cash")
      .reduce((sum, row) => sum + row.mainSalary, 0);

    return {
      plannedHours: plannedHoursTotal,
      actualHours: actualHoursTotal,
      plannedFOT,
      actualFOT,
      advanceCard,
      advanceCash,
      salaryCard,
      salaryCash,
    };
  }, [reportData]);

  // Валидация: каждый сотрудник должен отработать >= плана
  const allEmployeesValid = reportData.every(row => row.isValid);
  const invalidEmployees = reportData.filter(row => !row.isValid);
  const canSend = allEmployeesValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Отчёт по табелю за {month}</span>
          {allEmployeesValid ? (
            <Badge className="bg-green-600" data-testid="badge-report-valid">
              <CheckCircle className="w-4 h-4 mr-1" />
              Готов к отправке
            </Badge>
          ) : (
            <Badge variant="destructive" data-testid="badge-report-invalid">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Недостаточно часов ({invalidEmployees.length} сотр.)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Таблица с данными по сотрудникам */}
        <div className="border rounded-lg overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-background">ФИО</TableHead>
                <TableHead className="sticky top-0 bg-background">Должность</TableHead>
                <TableHead className="sticky top-0 bg-background">Ставка/Оклад</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">План (ч)</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">Факт (ч)</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">Всего (₽)</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">Аванс (₽)</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">ЗП (₽)</TableHead>
                <TableHead className="sticky top-0 bg-background">Способ выплаты</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.employeeId} data-testid={`report-row-${row.employeeId}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.position}</TableCell>
                  <TableCell>
                    {row.paymentType === "salary" 
                      ? `${row.rate.toLocaleString()} ₽/мес` 
                      : `${row.rate.toLocaleString()} ₽/ч`}
                  </TableCell>
                  <TableCell className="text-right">{row.plannedHours}</TableCell>
                  <TableCell 
                    className={`text-right ${!row.isValid ? 'text-red-600 font-semibold' : 'text-green-600'}`}
                    data-testid={`text-actual-hours-${row.employeeId}`}
                  >
                    {row.actualHours}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.totalSalary.toLocaleString()} ₽
                  </TableCell>
                  <TableCell className="text-right">
                    {row.advanceSalary.toLocaleString()} ₽
                  </TableCell>
                  <TableCell className="text-right">
                    {row.mainSalary.toLocaleString()} ₽
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {row.paymentMethod === "card" ? "На карту" : "Ведомость"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Итоговая строка */}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={3}>ИТОГО:</TableCell>
                <TableCell className="text-right">{totals.plannedHours}</TableCell>
                <TableCell 
                  className={`text-right ${!allEmployeesValid ? 'text-red-600' : 'text-green-600'}`}
                  data-testid="text-total-actual-hours"
                >
                  {totals.actualHours}
                </TableCell>
                <TableCell className="text-right" data-testid="text-total-salary">
                  {totals.actualFOT.toLocaleString()} ₽
                </TableCell>
                <TableCell className="text-right">
                  {(totals.advanceCard + totals.advanceCash).toLocaleString()} ₽
                </TableCell>
                <TableCell className="text-right">
                  {(totals.salaryCard + totals.salaryCash).toLocaleString()} ₽
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Разделение по способу выплаты */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Аванс (1-15 число)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>На карту:</span>
                <span className="font-semibold" data-testid="text-advance-card">
                  {totals.advanceCard.toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ведомость:</span>
                <span className="font-semibold" data-testid="text-advance-cash">
                  {totals.advanceCash.toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Итого аванс:</span>
                <span className="font-bold">
                  {(totals.advanceCard + totals.advanceCash).toLocaleString()} ₽
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Зарплата (16-конец месяца)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>На карту:</span>
                <span className="font-semibold" data-testid="text-salary-card">
                  {totals.salaryCard.toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ведомость:</span>
                <span className="font-semibold" data-testid="text-salary-cash">
                  {totals.salaryCash.toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Итого зарплата:</span>
                <span className="font-bold">
                  {(totals.salaryCard + totals.salaryCash).toLocaleString()} ₽
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Краткий репорт */}
        <Card className={allEmployeesValid ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="text-base">Сводка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Плановые часы</div>
                <div className="text-2xl font-bold">{totals.plannedHours} ч</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Фактические часы</div>
                <div className={`text-2xl font-bold ${!allEmployeesValid ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.actualHours} ч
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Плановый ФОТ</div>
                <div className="text-2xl font-bold">{totals.plannedFOT.toLocaleString()} ₽</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Фактический ФОТ</div>
                <div className={`text-2xl font-bold ${!allEmployeesValid ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.actualFOT.toLocaleString()} ₽
                </div>
              </div>
            </div>

            {!allEmployeesValid && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-900 dark:text-red-100">
                      Недостаточно отработанных часов
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-200">
                      {invalidEmployees.length} сотрудников отработали меньше плана.
                      Отчёт заблокирован для отправки на согласование.
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-200 mt-2">
                      Сотрудники с недостаточными часами:
                      {invalidEmployees.map(emp => (
                        <div key={emp.employeeId} className="ml-2">
                          • {emp.name}: {emp.actualHours} ч из {emp.plannedHours} ч
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allEmployeesValid && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      Отчёт готов к отправке
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-200">
                      Все сотрудники отработали достаточно часов.
                      Отчёт можно отправить на согласование.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </CardContent>
    </Card>
  );
}
