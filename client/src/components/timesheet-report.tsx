import { useMemo, useState } from "react";
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
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

interface TimesheetReportProps {
  month: string; // Format: "YYYY-MM"
  employees: Employee[];
  timeEntries: TimeEntry[];
  positions: Position[];
  objectId: string;
  objectManagerName?: string; // Имя менеджера объекта для сортировки
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
  objectManagerName,
}: TimesheetReportProps) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = getDaysInMonth(new Date(year, monthNum - 1));

  const [vacanciesExpanded, setVacanciesExpanded] = useState(false);

  // Фильтр сотрудников по объекту: штатные и подработчики
  const unsortedStaffEmployees = employees.filter(emp => 
    emp.objectId === objectId && 
    emp.status === "active" &&
    emp.name && // Исключаем записи без имени
    emp.id // Исключаем записи без ID
  );

  // Сортировка штатных сотрудников: менеджер → администраторы → остальные
  const sortStaffEmployees = (emps: Employee[]): Employee[] => {
    const manager: Employee[] = [];
    const administrators: Employee[] = [];
    const regular: Employee[] = [];
    
    emps.forEach(emp => {
      // Проверяем, является ли сотрудник менеджером объекта
      if (objectManagerName && emp.name === objectManagerName) {
        manager.push(emp);
      }
      // Проверяем, является ли должность администратором
      else if (emp.position?.toLowerCase().includes('администратор')) {
        administrators.push(emp);
      }
      // Все остальные
      else {
        regular.push(emp);
      }
    });
    
    // Сортируем администраторов и обычных по алфавиту
    const sortByName = (a: Employee, b: Employee) => a.name.localeCompare(b.name, 'ru');
    administrators.sort(sortByName);
    regular.sort(sortByName);
    
    // Объединяем: менеджер → администраторы → остальные
    return [...manager, ...administrators, ...regular];
  };

  const staffEmployees = sortStaffEmployees(unsortedStaffEmployees);

  const partTimeEmployees = employees.filter(emp => 
    emp.objectId === objectId && 
    emp.status === "not_registered" &&
    emp.name && 
    emp.id
  ).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Вакансии для отчета
  const vacancies = useMemo(() => {
    const allVisibleEmployees = employees.filter(emp => 
      emp.objectId === objectId && 
      (emp.status === "active" || emp.status === "not_registered")
    );
    
    const vacancyList: Array<{ positionTitle: string; count: number }> = [];
    
    positions
      .filter(pos => pos.objectId === objectId)
      .forEach(position => {
        const assignedCount = allVisibleEmployees.filter(emp => 
          emp.position === position.title
        ).length;
        const vacanciesNeeded = Math.max(0, position.positionsCount - assignedCount);
        
        if (vacanciesNeeded > 0) {
          vacancyList.push({
            positionTitle: position.title,
            count: vacanciesNeeded
          });
        }
      });
    
    // Сортировка по названию должности
    return vacancyList.sort((a, b) => 
      a.positionTitle.localeCompare(b.positionTitle, 'ru')
    );
  }, [positions, employees, objectId]);

  const objectEmployees = [...staffEmployees, ...partTimeEmployees];

  // Функция для расчёта данных одного сотрудника
  const calculateEmployeeRow = (employee: Employee): EmployeeReportRow => {
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
        
        // Учитываем только числовые значения в диапазоне 0-24 (без буквенных кодов)
        if (entry && typeof entry.hours === "number" && entry.hours >= 0 && entry.hours <= 24) {
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
  };

  // Расчёт данных отчёта для каждой группы
  const staffReportData: EmployeeReportRow[] = useMemo(() => {
    return staffEmployees.map(calculateEmployeeRow);
  }, [staffEmployees, timeEntries, year, monthNum, daysInMonth]);

  const partTimeReportData: EmployeeReportRow[] = useMemo(() => {
    return partTimeEmployees.map(calculateEmployeeRow);
  }, [partTimeEmployees, timeEntries, year, monthNum, daysInMonth]);

  const reportData = useMemo(() => {
    return [...staffReportData, ...partTimeReportData];
  }, [staffReportData, partTimeReportData]);

  // Функция для расчёта промежуточных итогов
  const calculateSubtotals = (data: EmployeeReportRow[]) => {
    return {
      hours: data.reduce((sum, row) => sum + row.actualHours, 0),
      fot: data.reduce((sum, row) => sum + row.totalSalary, 0),
    };
  };

  const staffSubtotals = useMemo(() => calculateSubtotals(staffReportData), [staffReportData]);
  const partTimeSubtotals = useMemo(() => calculateSubtotals(partTimeReportData), [partTimeReportData]);

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
              {/* Секция: Штатные сотрудники */}
              {staffReportData.length > 0 && (
                <>
                  <TableRow className="bg-blue-50 dark:bg-blue-950/20">
                    <TableCell colSpan={9} className="font-semibold text-blue-800 dark:text-blue-200">
                      Штатные сотрудники
                    </TableCell>
                  </TableRow>
                  {staffReportData.map((row) => (
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
                  {/* Промежуточные итоги для штатных */}
                  <TableRow className="bg-blue-100 dark:bg-blue-900/30 font-semibold">
                    <TableCell colSpan={4}>Итого (Штатные):</TableCell>
                    <TableCell className="text-right">{staffSubtotals.hours} ч</TableCell>
                    <TableCell className="text-right">{staffSubtotals.fot.toLocaleString()} ₽</TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </>
              )}

              {/* Секция: Подработчики */}
              {partTimeReportData.length > 0 && (
                <>
                  <TableRow className="bg-orange-50 dark:bg-orange-950/20">
                    <TableCell colSpan={9} className="font-semibold text-orange-800 dark:text-orange-200">
                      Подработчики
                    </TableCell>
                  </TableRow>
                  {partTimeReportData.map((row) => (
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
                  {/* Промежуточные итоги для подработчиков */}
                  <TableRow className="bg-orange-100 dark:bg-orange-900/30 font-semibold">
                    <TableCell colSpan={4}>Итого (Подработчики):</TableCell>
                    <TableCell className="text-right">{partTimeSubtotals.hours} ч</TableCell>
                    <TableCell className="text-right">{partTimeSubtotals.fot.toLocaleString()} ₽</TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </>
              )}

              {/* Секция: Вакансии (свернутая) */}
              {vacancies.length > 0 && (
                <>
                  <TableRow 
                    className="bg-gray-50 dark:bg-gray-950/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/40"
                    onClick={() => setVacanciesExpanded(!vacanciesExpanded)}
                    data-testid="vacancies-header"
                  >
                    <TableCell colSpan={9} className="font-semibold text-gray-800 dark:text-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>Вакансии</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            ({vacancies.reduce((sum, v) => sum + v.count, 0)} {vacancies.reduce((sum, v) => sum + v.count, 0) === 1 ? 'вакансия' : vacancies.reduce((sum, v) => sum + v.count, 0) < 5 ? 'вакансии' : 'вакансий'})
                          </span>
                        </div>
                        {vacanciesExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Список вакансий (показываем только при развертывании) */}
                  {vacanciesExpanded && vacancies.map((vacancy, idx) => (
                    <TableRow key={idx} className="bg-gray-50 dark:bg-gray-900/20" data-testid={`vacancy-row-${idx}`}>
                      <TableCell colSpan={2} className="font-medium text-gray-600 dark:text-gray-400">
                        {vacancy.positionTitle} ({vacancy.count} {vacancy.count === 1 ? 'шт.' : 'шт.'})
                      </TableCell>
                      <TableCell colSpan={7} className="text-sm text-muted-foreground">
                        Незаполненные позиции
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Промежуточные итоги для вакансий */}
                  {vacanciesExpanded && (
                    <TableRow className="bg-gray-100 dark:bg-gray-900/30 font-semibold">
                      <TableCell colSpan={9}>
                        Итого вакансий: {vacancies.reduce((sum, v) => sum + v.count, 0)} шт.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
              
              {/* Общая итоговая строка */}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={3}>ВСЕГО:</TableCell>
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
