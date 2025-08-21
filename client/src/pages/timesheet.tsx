import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TimesheetCell } from "@/components/timesheet/timesheet-cell";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Wand2 } from "lucide-react";

export default function Timesheet() {
  const [selectedMonth, setSelectedMonth] = useState("2024-02");
  const [contextMenuData, setContextMenuData] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: timeEntries = [] } = useQuery({
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
        const response = await apiRequest("PUT", `/api/time-entries/${data.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/time-entries", data);
        return response.json();
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
  const startDate = startOfMonth(new Date(year, month - 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month - 1, day);
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      day,
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek: format(date, "EEEEEE", { locale: ru }),
      isWeekend,
      isPastAdvancePeriod: day <= 15, // Mock: advance period is sent
    };
  });

  // Group employees by status
  const activeEmployees = employees.filter((emp: any) => emp.status === "active");
  const partTimeEmployees = employees.filter((emp: any) => emp.status === "not_registered");

  const getTimeEntry = (employeeId: string, date: string) => {
    return timeEntries.find((entry: any) => 
      entry.employeeId === employeeId && entry.date === date
    );
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

  const handleContextMenuAction = (employeeId: string, startDate: string, action: string) => {
    // TODO: Implement mass fill actions
    toast({ title: `Выполнено действие: ${action}` });
  };

  const handleAutoFill = () => {
    // TODO: Implement auto-fill from previous month
    toast({ title: "Автозаполнение выполнено" });
  };

  const calculateTotalHours = (employeeId: string) => {
    const entries = timeEntries.filter((entry: any) => entry.employeeId === employeeId);
    return entries.reduce((total: number, entry: any) => total + (entry.hours || 0), 0);
  };

  const EmployeeSection = ({ 
    employees, 
    title, 
    bgColor = "bg-muted/50" 
  }: { 
    employees: any[], 
    title: string, 
    bgColor?: string 
  }) => (
    <>
      <tr className={bgColor}>
        <td colSpan={daysInMonth + 2} className="px-4 py-2 text-sm font-medium text-foreground">
          {title} ({employees.length})
        </td>
      </tr>
      {employees.map((employee) => (
        <tr key={employee.id} className="hover:bg-muted/50" data-testid={`timesheet-row-${employee.id}`}>
          <td className="px-4 py-2 sticky left-0 bg-background border-r border-border min-w-[200px]">
            <div className="text-sm font-medium text-foreground">{employee.name}</div>
            <div className="text-xs text-muted-foreground">{employee.position}</div>
          </td>
          
          {days.map((day) => {
            const entry = getTimeEntry(employee.id, day.date);
            const isLocked = day.isPastAdvancePeriod; // Mock: advance period is locked
            
            return (
              <td key={day.date} className={`px-2 py-2 min-w-[60px] ${day.isWeekend ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                <TimesheetCell
                  value={entry?.hours ?? entry?.dayType ?? ""}
                  qualityScore={entry?.qualityScore}
                  isLocked={isLocked}
                  onChange={(value, qualityScore) => 
                    handleCellChange(employee.id, day.date, value, qualityScore)
                  }
                  onContextMenu={(action) => 
                    handleContextMenuAction(employee.id, day.date, action)
                  }
                />
              </td>
            );
          })}
          
          <td className="px-2 py-2 text-center min-w-[80px]">
            <div className="text-sm font-medium" data-testid={`total-hours-${employee.id}`}>
              {calculateTotalHours(employee.id)}
            </div>
          </td>
        </tr>
      ))}
      <tr className="bg-green-50 dark:bg-green-900/20 font-medium">
        <td className="px-4 py-2 text-sm text-foreground">
          Итого по {title.toLowerCase()} ({employees.length}):
        </td>
        <td colSpan={daysInMonth} className="px-4 py-2"></td>
        <td className="px-4 py-2 text-center text-sm font-semibold">
          {employees.reduce((total, emp) => total + calculateTotalHours(emp.id), 0)} ч
        </td>
      </tr>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Табель учёта рабочего времени</h2>
          <p className="text-muted-foreground">Ввод отработанных часов и оценок качества работы</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">Январь 2024</SelectItem>
              <SelectItem value="2024-02">Февраль 2024</SelectItem>
              <SelectItem value="2024-03">Март 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAutoFill}
            className="bg-green-600 hover:bg-green-700"
            data-testid="auto-fill"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Автозаполнение
          </Button>
        </div>
      </div>

      {/* Period Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Период аванса (1-15):</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Отправлено 16.02.2024
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Период зарплаты (1-{daysInMonth}):</span>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  В работе
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/50 min-w-[200px]">
                    Сотрудник
                  </th>
                  {days.map((day) => (
                    <th 
                      key={day.day}
                      className={`px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[60px] ${
                        day.isWeekend ? 'bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      {day.day}
                      <br />
                      <span className={`text-xs ${day.isWeekend ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {day.dayOfWeek}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                <EmployeeSection 
                  employees={activeEmployees} 
                  title="Активные сотрудники"
                />
                <EmployeeSection 
                  employees={partTimeEmployees} 
                  title="Подработка" 
                  bgColor="bg-orange-50 dark:bg-orange-900/20"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Обозначения:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
            <div>Б — Больничный</div>
            <div>О — Отпуск</div>
            <div>НН — Прогул</div>
            <div>У — Уволен</div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Оценка качества: 1 — Плохо, 2 — Удовл., 3 — Нормально, 4 — Отлично (по умолчанию: 3)</p>
            <p>Серые ячейки — отправленный период (недоступно для редактирования)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
