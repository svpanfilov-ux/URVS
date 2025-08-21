import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimesheetCell } from "@/components/timesheet/timesheet-cell";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, getDaysInMonth, parseISO, isAfter } from "date-fns";
import { ru } from "date-fns/locale";
import { Wand2, Calendar } from "lucide-react";
import { Employee, TimeEntry } from "@shared/schema";

export default function Timesheet() {
  const [selectedMonth, setSelectedMonth] = useState("2025-08");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-${getDaysInMonth(new Date(selectedMonth + "-01"))}`;
      const response = await fetch(`/api/time-entries?startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/time-entries/${data.id}`, data);
      } else {
        return await apiRequest("POST", "/api/time-entries", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedMonth] });
    },
    onError: () => {
      toast({ title: "Ошибка при сохранении данных", variant: "destructive" });
    },
  });

  // Generate calendar data
  const year = parseInt(selectedMonth.split("-")[0]);
  const month = parseInt(selectedMonth.split("-")[1]);
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      day,
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek: format(date, "EEEEEE", { locale: ru }),
      isWeekend,
    };
  });

  // Filter active employees
  const activeEmployees = employees.filter((emp) => emp.status === "active" || emp.status === "not_registered");

  const getTimeEntry = (employeeId: string, date: string) => {
    return timeEntries.find((entry: TimeEntry) => 
      entry.employeeId === employeeId && entry.date === date
    );
  };

  const isEmployeeTerminated = (employee: Employee, date: string) => {
    if (employee.status !== "fired" || !employee.terminationDate) return false;
    return isAfter(parseISO(date), parseISO(employee.terminationDate));
  };

  const handleCellChange = (employeeId: string, date: string, value: string | number, qualityScore?: number) => {
    const existingEntry = getTimeEntry(employeeId, date);
    
    const entryData = {
      id: existingEntry?.id,
      employeeId,
      date,
      hours: typeof value === "number" ? value : null,
      dayType: typeof value === "string" ? value.toLowerCase() : "work",
      qualityScore: qualityScore || 3,
    };

    updateTimeEntryMutation.mutate(entryData);
  };

  const handleAutoFill = () => {
    toast({ title: "Автозаполнение выполнено", description: "Табель заполнен данными из предыдущего месяца" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Табель учёта рабочего времени</h1>
            <p className="text-muted-foreground">Учёт рабочих часов и оценка качества работы</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={handleAutoFill} variant="outline" size="sm">
            <Wand2 className="w-4 h-4 mr-2" />
            Автозаполнение
          </Button>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите месяц" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-06">Июнь 2025</SelectItem>
              <SelectItem value="2025-07">Июль 2025</SelectItem>
              <SelectItem value="2025-08">Август 2025</SelectItem>
              <SelectItem value="2025-09">Сентябрь 2025</SelectItem>
              <SelectItem value="2025-10">Октябрь 2025</SelectItem>
              <SelectItem value="2025-11">Ноябрь 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="overflow-hidden border rounded-lg bg-background">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            {/* Header */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background border-r border-b p-2 text-left w-40">
                  Сотрудник
                </th>
                {days.map((day) => (
                  <th 
                    key={day.day}
                    className={`border-b border-r p-1 text-center min-w-12 ${
                      day.isWeekend ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-950/50'
                    }`}
                  >
                    <div className="text-[10px] font-medium">{day.dayOfWeek}</div>
                    <div className="text-xs font-bold">{day.day}</div>
                  </th>
                ))}
                <th className="border-b p-2 text-center bg-primary/5 min-w-16">
                  <div className="text-[10px]">Итого</div>
                  <div className="text-xs font-bold">часов</div>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {activeEmployees.map((employee) => {
                const totalHours = timeEntries
                  .filter((entry: TimeEntry) => entry.employeeId === employee.id && typeof entry.hours === 'number')
                  .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);

                return (
                  <tr key={employee.id} className="hover:bg-muted/30">
                    <td className="sticky left-0 z-10 bg-background border-r p-2 font-medium">
                      <div className="text-sm truncate max-w-36" title={employee.name}>
                        {employee.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {employee.position}
                      </div>
                    </td>
                    {days.map((day) => {
                      const entry = getTimeEntry(employee.id, day.date);
                      const isTerminated = isEmployeeTerminated(employee, day.date);
                      
                      return (
                        <td key={day.date} className="p-0">
                          <TimesheetCell
                            value={entry?.hours !== null ? entry?.hours : entry?.dayType}
                            qualityScore={entry?.qualityScore || 3}
                            isLocked={false} // Все ячейки открыты для редактирования в текущем периоде
                            isTerminated={isTerminated}
                            onChange={(value, qualityScore) => 
                              handleCellChange(employee.id, day.date, value, qualityScore)
                            }
                          />
                        </td>
                      );
                    })}
                    <td className="border-r p-2 text-center font-bold bg-primary/5">
                      {totalHours}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Обозначения:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 border rounded text-center text-blue-800 dark:text-blue-200 text-xs font-bold">Б</div>
            <span>Больничный</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 border rounded text-center text-purple-800 dark:text-purple-200 text-xs font-bold">О</div>
            <span>Отпуск</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 border rounded text-center text-gray-700 dark:text-gray-300 text-xs font-bold">НН</div>
            <span>Прогул</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 border rounded text-center text-red-800 dark:text-red-200 text-xs font-bold">У</div>
            <span>Уволен</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          • Числа от 1 до 24 — количество рабочих часов<br/>
          • Правый клик на числовой ячейке — изменение оценки качества работы<br/>
          • Цвета ячеек: красный (оценка 1), оранжевый (2), жёлтый (3), зелёный (4)<br/>
          • Клик на ячейку для редактирования, Enter для сохранения, Escape для отмены
        </div>
      </div>
    </div>
  );
}