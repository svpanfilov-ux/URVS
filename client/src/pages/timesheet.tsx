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
import { useObjectStore } from "@/lib/object-store";

export default function Timesheet() {
  const [selectedMonth, setSelectedMonth] = useState("2025-08");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedObjectId } = useObjectStore();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedObjectId],
    queryFn: () => {
      const url = selectedObjectId ? `/api/employees?objectId=${selectedObjectId}` : '/api/employees';
      return fetch(url).then(res => res.json());
    },
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

  // Filter and separate employees into two groups
  const allVisibleEmployees = employees.filter((emp) => {
    if (emp.status === "active" || emp.status === "not_registered") {
      return true;
    }
    if (emp.status === "fired" && emp.terminationDate) {
      // Show fired employees if current month is same or before their termination month
      const terminationMonth = emp.terminationDate.substring(0, 7); // YYYY-MM format
      return selectedMonth <= terminationMonth;
    }
    return false;
  });

  // Separate employees into active and part-time workers (including fired employees in their sections)
  // For now, all fired employees go to active section since we don't track original status
  const activeEmployees = allVisibleEmployees.filter(emp => 
    emp.status === "active" || emp.status === "fired"
  );
  const partTimeEmployees = allVisibleEmployees.filter(emp => 
    emp.status === "not_registered"
  );

  const getTimeEntry = (employeeId: string, date: string) => {
    return timeEntries.find((entry: TimeEntry) => 
      entry.employeeId === employeeId && entry.date === date
    );
  };

  const isEmployeeTerminated = (employee: Employee, date: string) => {
    if (employee.status !== "fired" || !employee.terminationDate) return false;
    const cellDate = parseISO(date);
    const terminationDate = parseISO(employee.terminationDate);
    return cellDate >= terminationDate;
  };

  const isCellLocked = (date: string) => {
    const cellDate = parseISO(date);
    const today = new Date();
    return isAfter(cellDate, today);
  };

  const isCellTerminated = (employee: Employee, date: string) => {
    return isEmployeeTerminated(employee, date);
  };

  // Calculate total hours for a group of employees
  const calculateGroupTotal = (employeeList: Employee[]) => {
    return employeeList.reduce((total, employee) => {
      const employeeTotal = timeEntries
        .filter((entry: TimeEntry) => entry.employeeId === employee.id && typeof entry.hours === 'number')
        .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);
      return total + employeeTotal;
    }, 0);
  };

  // Calculate planned hours for employee based on 5/2 schedule (8 hours per working day)
  const calculatePlannedHours = (employee: Employee) => {
    if (employee.status === 'fired' && employee.terminationDate) {
      // For fired employees, count only working days until termination
      const terminationDate = parseISO(employee.terminationDate);
      const workingDays = days.filter(day => {
        const dayDate = parseISO(day.date);
        return !day.isWeekend && !isAfter(dayDate, terminationDate);
      }).length;
      return workingDays * 8;
    } else {
      // For active employees, count all working days in month
      const workingDays = days.filter(day => !day.isWeekend).length;
      return workingDays * 8;
    }
  };

  // Check if employee has insufficient hours (less than planned)
  const hasInsufficientHours = (employee: Employee, actualHours: number) => {
    const plannedHours = calculatePlannedHours(employee);
    return actualHours < plannedHours;
  };

  const handleCellChange = (employeeId: string, date: string, value: string | number, qualityScore?: number) => {
    const existingEntry = getTimeEntry(employeeId, date);
    
    // If empty value, delete entry
    if (value === "") {
      if (existingEntry?.id) {
        // Delete existing entry
        deleteTimeEntryMutation.mutate(existingEntry.id);
      }
      return;
    }
    
    const entryData = {
      id: existingEntry?.id,
      employeeId,
      date,
      hours: typeof value === "number" ? value : null,
      dayType: typeof value === "string" ? value.toUpperCase() : "work",
      qualityScore: qualityScore || 3,
    };

    updateTimeEntryMutation.mutate(entryData);
  };

  const deleteTimeEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedMonth] });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении данных", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (entryIds: string[]) => {
      await Promise.all(entryIds.map(id => apiRequest("DELETE", `/api/time-entries/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedMonth] });
      toast({ title: "Данные успешно удалены" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении данных", variant: "destructive" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      await Promise.all(entries.map(entry => apiRequest("POST", "/api/time-entries", entry)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedMonth] });
      toast({ title: "Данные успешно заполнены" });
    },
    onError: () => {
      toast({ title: "Ошибка при заполнении данных", variant: "destructive" });
    },
  });



  // Clear all data for current month
  const handleClearAll = () => {
    const entriesToDelete = timeEntries
      .filter((entry: TimeEntry) => !isCellLocked(entry.date))
      .map((entry: TimeEntry) => entry.id);
    
    if (entriesToDelete.length > 0) {
      bulkDeleteMutation.mutate(entriesToDelete);
    }
  };

  // Clear row data for specific employee
  const handleClearRow = (employeeId: string) => {
    const entriesToDelete = timeEntries
      .filter((entry: TimeEntry) => 
        entry.employeeId === employeeId && !isCellLocked(entry.date)
      )
      .map((entry: TimeEntry) => entry.id);
    
    if (entriesToDelete.length > 0) {
      bulkDeleteMutation.mutate(entriesToDelete);
    }
  };

  // Fill row to end of month
  const handleFillToEnd = (employeeId: string, fromDate: string, sourceValue?: string | number, sourceQuality?: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !sourceValue) return;

    const fromIndex = days.findIndex(day => day.date === fromDate);
    if (fromIndex === -1) return;

    const entriesToCreate = [];
    for (let i = fromIndex; i < days.length; i++) {
      const day = days[i];
      if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
      
      const existingEntry = getTimeEntry(employeeId, day.date);
      if (!existingEntry) {
        entriesToCreate.push({
          employeeId,
          date: day.date,
          hours: typeof sourceValue === "number" ? sourceValue : null,
          dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
          qualityScore: sourceQuality || 3,
        });
      }
    }

    if (entriesToCreate.length > 0) {
      bulkCreateMutation.mutate(entriesToCreate);
    }
  };

  // Fill by employee schedule
  const handleFillBySchedule = (employeeId: string, sourceValue?: string | number, sourceQuality?: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !sourceValue) return;

    const workSchedule = employee.workSchedule || "5/2";
    const entriesToCreate = [];

    if (workSchedule === "5/2") {
      // Fill weekdays only
      for (const day of days) {
        if (isCellLocked(day.date) || isCellTerminated(employee, day.date) || day.isWeekend) continue;
        
        const existingEntry = getTimeEntry(employeeId, day.date);
        if (!existingEntry) {
          entriesToCreate.push({
            employeeId,
            date: day.date,
            hours: typeof sourceValue === "number" ? sourceValue : null,
            dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
            qualityScore: sourceQuality || 3,
          });
        }
      }
    } else if (workSchedule === "2/2") {
      // 2/2 pattern: 2 work days, then 2 rest days
      let isWorkDay = true;
      let dayCount = 0;

      for (const day of days) {
        if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;

        const existingEntry = getTimeEntry(employeeId, day.date);
        if (!existingEntry && dayCount < 2 && isWorkDay) {
          entriesToCreate.push({
            employeeId,
            date: day.date,
            hours: typeof sourceValue === "number" ? sourceValue : null,
            dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
            qualityScore: sourceQuality || 3,
          });
        }
        
        dayCount++;
        if (dayCount === 2) {
          dayCount = 0;
          isWorkDay = !isWorkDay;
        }
      }
    } else if (workSchedule === "3/3") {
      // 3/3 pattern: 3 work days, then 3 rest days
      let isWorkDay = true;
      let dayCount = 0;

      for (const day of days) {
        if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;

        const existingEntry = getTimeEntry(employeeId, day.date);
        if (!existingEntry && dayCount < 3 && isWorkDay) {
          entriesToCreate.push({
            employeeId,
            date: day.date,
            hours: typeof sourceValue === "number" ? sourceValue : null,
            dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
            qualityScore: sourceQuality || 3,
          });
        }
        
        dayCount++;
        if (dayCount === 3) {
          dayCount = 0;
          isWorkDay = !isWorkDay;
        }
      }
    } else if (workSchedule === "6/1") {
      // 6/1 pattern: 6 work days, then 1 rest day
      let dayCount = 0;

      for (const day of days) {
        if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;

        const existingEntry = getTimeEntry(employeeId, day.date);
        if (!existingEntry && dayCount < 6) {
          entriesToCreate.push({
            employeeId,
            date: day.date,
            hours: typeof sourceValue === "number" ? sourceValue : null,
            dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
            qualityScore: sourceQuality || 3,
          });
        }
        
        dayCount++;
        if (dayCount === 7) {
          dayCount = 0;
        }
      }
    } else if (workSchedule === "вахта (7/0)") {
      // Вахта: все дни рабочие
      for (const day of days) {
        if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
        
        const existingEntry = getTimeEntry(employeeId, day.date);
        if (!existingEntry) {
          entriesToCreate.push({
            employeeId,
            date: day.date,
            hours: typeof sourceValue === "number" ? sourceValue : null,
            dayType: typeof sourceValue === "string" ? sourceValue.toUpperCase() : "work",
            qualityScore: sourceQuality || 3,
          });
        }
      }
    }

    if (entriesToCreate.length > 0) {
      bulkCreateMutation.mutate(entriesToCreate);
    }
  };

  const handleClosePeriod = () => {
    toast({ 
      title: "Период закрыт", 
      description: `Данные табеля за ${format(new Date(selectedMonth + "-01"), "LLLL yyyy", { locale: ru })} зафиксированы`,
      variant: "default"
    });
  };

  const handleAutoFill = async () => {
    try {
      // Get previous month data (July 2025)
      const prevMonth = new Date(2025, 6, 1); // July 2025
      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      
      // Fetch previous month entries
      const response = await fetch(`/api/time-entries?month=${prevMonthStr}`);
      const prevMonthEntries = await response.json();
      
      if (!prevMonthEntries || prevMonthEntries.length === 0) {
        toast({ 
          title: "Нет данных", 
          description: "Данные за предыдущий месяц не найдены",
          variant: "destructive"
        });
        return;
      }

      // Group previous month entries by employee
      const prevEntriesByEmployee = prevMonthEntries.reduce((acc: any, entry: any) => {
        if (!acc[entry.employeeId]) {
          acc[entry.employeeId] = [];
        }
        acc[entry.employeeId].push(entry);
        return acc;
      }, {});

      const entriesToCreate = [];

      // For each employee, analyze their pattern and extend it to current month
      for (const employee of employees) {
        const prevEntries = prevEntriesByEmployee[employee.id] || [];
        if (prevEntries.length === 0) continue;

        // Sort entries by date
        prevEntries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Detect pattern based on employee's work schedule
        const workSchedule = employee.workSchedule || "5/2";
        
        // Apply pattern based on employee's schedule
        if (workSchedule === "5/2") {
          // Fill weekdays only, using last working day pattern from previous month
          const lastWorkEntry = prevEntries.filter((entry: any) => entry.hours !== null).pop();
          if (lastWorkEntry) {
            for (const day of days) {
              if (isCellLocked(day.date) || isCellTerminated(employee, day.date) || day.isWeekend) continue;
              
              const existingEntry = getTimeEntry(employee.id, day.date);
              if (!existingEntry) {
                entriesToCreate.push({
                  employeeId: employee.id,
                  date: day.date,
                  hours: lastWorkEntry.hours,
                  dayType: lastWorkEntry.dayType,
                  qualityScore: lastWorkEntry.qualityScore || 3,
                });
              }
            }
          }
        } else if (workSchedule === "2/2") {
          // 2/2 pattern: detect the last cycle and continue it
          const lastTwoWeeks = prevEntries.slice(-14);
          let isWorkDay = true;
          let dayCount = 0;
          
          // Find the pattern from the end of previous month
          if (lastTwoWeeks.length > 0) {
            const lastWorkEntry = lastTwoWeeks.filter((entry: any) => entry.hours !== null).pop();
            if (lastWorkEntry) {
              for (const day of days) {
                if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
                
                const existingEntry = getTimeEntry(employee.id, day.date);
                if (!existingEntry && dayCount < 2 && isWorkDay) {
                  entriesToCreate.push({
                    employeeId: employee.id,
                    date: day.date,
                    hours: lastWorkEntry.hours,
                    dayType: lastWorkEntry.dayType,
                    qualityScore: lastWorkEntry.qualityScore || 3,
                  });
                }
                
                dayCount++;
                if (dayCount === 2) {
                  dayCount = 0;
                  isWorkDay = !isWorkDay;
                }
              }
            }
          }
        } else if (workSchedule === "3/3") {
          // 3/3 pattern
          const lastWorkEntry = prevEntries.filter((entry: any) => entry.hours !== null).pop();
          if (lastWorkEntry) {
            let isWorkDay = true;
            let dayCount = 0;
            
            for (const day of days) {
              if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
              
              const existingEntry = getTimeEntry(employee.id, day.date);
              if (!existingEntry && dayCount < 3 && isWorkDay) {
                entriesToCreate.push({
                  employeeId: employee.id,
                  date: day.date,
                  hours: lastWorkEntry.hours,
                  dayType: lastWorkEntry.dayType,
                  qualityScore: lastWorkEntry.qualityScore || 3,
                });
              }
              
              dayCount++;
              if (dayCount === 3) {
                dayCount = 0;
                isWorkDay = !isWorkDay;
              }
            }
          }
        } else if (workSchedule === "6/1") {
          // 6/1 pattern
          const lastWorkEntry = prevEntries.filter((entry: any) => entry.hours !== null).pop();
          if (lastWorkEntry) {
            let dayCount = 0;
            
            for (const day of days) {
              if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
              
              const existingEntry = getTimeEntry(employee.id, day.date);
              if (!existingEntry && dayCount < 6) {
                entriesToCreate.push({
                  employeeId: employee.id,
                  date: day.date,
                  hours: lastWorkEntry.hours,
                  dayType: lastWorkEntry.dayType,
                  qualityScore: lastWorkEntry.qualityScore || 3,
                });
              }
              
              dayCount++;
              if (dayCount === 7) {
                dayCount = 0;
              }
            }
          }
        } else if (workSchedule === "вахта (7/0)") {
          // Вахта: all days are working days
          const lastWorkEntry = prevEntries.filter((entry: any) => entry.hours !== null).pop();
          if (lastWorkEntry) {
            for (const day of days) {
              if (isCellLocked(day.date) || isCellTerminated(employee, day.date)) continue;
              
              const existingEntry = getTimeEntry(employee.id, day.date);
              if (!existingEntry) {
                entriesToCreate.push({
                  employeeId: employee.id,
                  date: day.date,
                  hours: lastWorkEntry.hours,
                  dayType: lastWorkEntry.dayType,
                  qualityScore: lastWorkEntry.qualityScore || 3,
                });
              }
            }
          }
        }
      }

      if (entriesToCreate.length > 0) {
        bulkCreateMutation.mutate(entriesToCreate);
        toast({ 
          title: "Автозаполнение выполнено", 
          description: `Заполнено ${entriesToCreate.length} записей на основе данных предыдущего месяца` 
        });
      } else {
        toast({ 
          title: "Нет данных для заполнения", 
          description: "Все ячейки уже заполнены или заблокированы" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Ошибка автозаполнения", 
        description: "Не удалось получить данные предыдущего месяца",
        variant: "destructive"
      });
    }
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
          <Button 
            onClick={handleClearAll} 
            variant="destructive" 
            size="sm"
            disabled={bulkDeleteMutation.isPending}
            data-testid="button-clear-all"
          >
            Очистить всё
          </Button>
          
          <Button onClick={handleAutoFill} variant="outline" size="sm">
            <Wand2 className="w-4 h-4 mr-2" />
            Автозаполнение
          </Button>

          <Button 
            onClick={handleClosePeriod} 
            className="bg-orange-600 hover:bg-orange-700"
            size="sm"
            data-testid="button-close-period"
          >
            Закрыть период
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
        <div className="w-full">
          <table className="w-full border-collapse text-[10px] table-fixed">
            {/* Header */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background border-r border-b p-1 text-left w-32">
                  <div className="text-[9px] font-medium truncate">Сотрудник</div>
                </th>
                {days.map((day) => (
                  <th 
                    key={day.day}
                    className={`border-b border-r p-0.5 text-center w-7 ${
                      day.isWeekend ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-950/50'
                    }`}
                  >
                    <div className="text-[8px] font-medium">{day.dayOfWeek}</div>
                    <div className="text-[9px] font-bold">{day.day}</div>
                  </th>
                ))}
                <th className="border-b p-1 text-center bg-primary/5 w-12">
                  <div className="text-[8px]">Итого</div>
                  <div className="text-[9px] font-bold">час</div>
                </th>
                <th className="border-b p-1 text-center bg-green-50 dark:bg-green-950/20 w-12">
                  <div className="text-[8px]">План</div>
                  <div className="text-[9px] font-bold">час</div>
                </th>
              </tr>
            </thead>

            {/* Body - Active Employees Section */}
            <tbody>
              {/* Active Employees Header */}
              {activeEmployees.length > 0 && (
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td colSpan={days.length + 3} className="p-2 font-semibold text-sm text-blue-800 dark:text-blue-200">
                    Активные сотрудники
                  </td>
                </tr>
              )}
              
              {/* Active Employees Rows */}
              {activeEmployees.map((employee) => {
                const totalHours = timeEntries
                  .filter((entry: TimeEntry) => entry.employeeId === employee.id && typeof entry.hours === 'number')
                  .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);
                
                const insufficientHours = hasInsufficientHours(employee, totalHours);

                return (
                  <tr 
                    key={employee.id} 
                    className={`hover:bg-muted/30 ${employee.status === "fired" ? "opacity-75" : ""} ${
                      insufficientHours ? "border-b-2 border-red-500" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-background border-r p-1 font-medium">
                      <div className={`text-[10px] truncate max-w-28 ${
                        insufficientHours ? "text-red-600 font-bold" : ""
                      }`} title={employee.name}>
                        {employee.name}{employee.status === "fired" ? " (уволен)" : ""}
                      </div>
                      <div className={`text-[8px] truncate ${
                        insufficientHours ? "text-red-500 font-semibold" : "text-muted-foreground"
                      }`}>
                        {employee.position}
                      </div>
                    </td>
                    {days.map((day) => {
                      const entry = getTimeEntry(employee.id, day.date);
                      const isTerminated = isCellTerminated(employee, day.date);
                      const isLocked = isCellLocked(day.date);
                      
                      return (
                        <td key={day.date} className="p-0">
                          <TimesheetCell
                            value={entry?.hours !== null ? entry?.hours : entry?.dayType}
                            qualityScore={entry?.qualityScore || 3}
                            isLocked={isLocked}
                            isTerminated={isTerminated}
                            employeeId={employee.id}
                            date={day.date}
                            isPartTime={false}
                            onChange={(value, qualityScore) => 
                              handleCellChange(employee.id, day.date, value, qualityScore)
                            }
                            onClearRow={() => handleClearRow(employee.id)}
                            onFillBySchedule={() => handleFillBySchedule(employee.id, entry?.hours !== null ? entry?.hours : entry?.dayType, entry?.qualityScore || undefined)}
                          />
                        </td>
                      );
                    })}
                    <td className="border-r p-1 text-center font-bold bg-primary/5">
                      <div className="text-[9px]">{totalHours}</div>
                    </td>
                    <td className="border-r p-1 text-center font-bold bg-green-50 dark:bg-green-950/20">
                      <div className="text-[9px]">{calculatePlannedHours(employee)}</div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Active Employees Subtotal */}
              {activeEmployees.length > 0 && (
                <tr className="bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-300">
                  <td className="sticky left-0 z-10 bg-blue-100 dark:bg-blue-900/30 border-r p-1 font-bold text-blue-800 dark:text-blue-200">
                    <div className="text-[10px]">Итого активные:</div>
                  </td>
                  {days.map((day) => (
                    <td key={day.date} className="p-0 bg-blue-100 dark:bg-blue-900/30"></td>
                  ))}
                  <td className="border-r p-1 text-center font-bold bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200">
                    <div className="text-[10px]">{calculateGroupTotal(activeEmployees)}</div>
                  </td>
                  <td className="border-r p-1 text-center font-bold bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200">
                    <div className="text-[10px]">{activeEmployees.reduce((total, emp) => total + calculatePlannedHours(emp), 0)}</div>
                  </td>
                </tr>
              )}

              {/* Part-time Employees Header */}
              {partTimeEmployees.length > 0 && (
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td colSpan={days.length + 3} className="p-2 font-semibold text-sm text-orange-800 dark:text-orange-200">
                    Подработка
                  </td>
                </tr>
              )}
              
              {/* Part-time Employees Rows */}
              {partTimeEmployees.map((employee) => {
                const totalHours = timeEntries
                  .filter((entry: TimeEntry) => entry.employeeId === employee.id && typeof entry.hours === 'number')
                  .reduce((sum: number, entry: TimeEntry) => sum + (entry.hours || 0), 0);
                
                const insufficientHours = hasInsufficientHours(employee, totalHours);

                return (
                  <tr 
                    key={employee.id} 
                    className={`hover:bg-muted/30 ${employee.status === "fired" ? "opacity-75" : ""} ${
                      insufficientHours ? "border-b-2 border-red-500" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-background border-r p-1 font-medium">
                      <div className={`text-[10px] truncate max-w-28 ${
                        insufficientHours ? "text-red-600 font-bold" : ""
                      }`} title={employee.name}>
                        {employee.name}{employee.status === "fired" ? " (уволен)" : ""}
                      </div>
                      <div className={`text-[8px] truncate ${
                        insufficientHours ? "text-red-500 font-semibold" : "text-muted-foreground"
                      }`}>
                        {employee.position}
                      </div>
                    </td>
                    {days.map((day) => {
                      const entry = getTimeEntry(employee.id, day.date);
                      const isTerminated = isCellTerminated(employee, day.date);
                      const isLocked = isCellLocked(day.date);
                      
                      return (
                        <td key={day.date} className="p-0">
                          <TimesheetCell
                            value={entry?.hours !== null ? entry?.hours : entry?.dayType}
                            qualityScore={entry?.qualityScore || 3}
                            isLocked={isLocked}
                            isTerminated={isTerminated}
                            employeeId={employee.id}
                            date={day.date}
                            isPartTime={true}
                            onChange={(value, qualityScore) => 
                              handleCellChange(employee.id, day.date, value, qualityScore)
                            }
                            onClearRow={() => handleClearRow(employee.id)}
                            onFillBySchedule={() => handleFillBySchedule(employee.id, entry?.hours !== null ? entry?.hours : entry?.dayType, entry?.qualityScore || undefined)}
                          />
                        </td>
                      );
                    })}
                    <td className="border-r p-1 text-center font-bold bg-primary/5">
                      <div className="text-[9px]">{totalHours}</div>
                    </td>
                    <td className="border-r p-1 text-center font-bold bg-green-50 dark:bg-green-950/20">
                      <div className="text-[9px]">{calculatePlannedHours(employee)}</div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Part-time Employees Subtotal */}
              {partTimeEmployees.length > 0 && (
                <tr className="bg-orange-100 dark:bg-orange-900/30 border-t-2 border-orange-300">
                  <td className="sticky left-0 z-10 bg-orange-100 dark:bg-orange-900/30 border-r p-1 font-bold text-orange-800 dark:text-orange-200">
                    <div className="text-[10px]">Итого подработка:</div>
                  </td>
                  {days.map((day) => (
                    <td key={day.date} className="p-0 bg-orange-100 dark:bg-orange-900/30"></td>
                  ))}
                  <td className="border-r p-1 text-center font-bold bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200">
                    <div className="text-[10px]">{calculateGroupTotal(partTimeEmployees)}</div>
                  </td>
                  <td className="border-r p-1 text-center font-bold bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200">
                    <div className="text-[10px]">{partTimeEmployees.reduce((total, emp) => total + calculatePlannedHours(emp), 0)}</div>
                  </td>
                </tr>
              )}



              {/* Overall Total Row */}
              <tr className="bg-gray-200 dark:bg-gray-800 border-t-4 border-gray-400">
                <td className="sticky left-0 z-10 bg-gray-200 dark:bg-gray-800 border-r p-1 font-bold text-gray-800 dark:text-gray-200">
                  <div className="text-[11px]">ОБЩИЙ ИТОГ:</div>
                </td>
                {days.map((day) => (
                  <td key={day.date} className="p-0 bg-gray-200 dark:bg-gray-800"></td>
                ))}
                <td className="border-r p-1 text-center font-bold bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <div className="text-[11px]">{calculateGroupTotal([...activeEmployees, ...partTimeEmployees])}</div>
                </td>
                <td className="border-r p-1 text-center font-bold bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200">
                  <div className="text-[11px]">{[...activeEmployees, ...partTimeEmployees].reduce((total, emp) => total + calculatePlannedHours(emp), 0)}</div>
                </td>
              </tr>
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
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Оценки качества работы:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 border rounded text-center text-red-800 dark:text-red-200 text-xs font-bold flex items-center justify-center">1</div>
                <span className="text-xs">Плохо</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 border rounded text-center text-orange-800 dark:text-orange-200 text-xs font-bold flex items-center justify-center">2</div>
                <span className="text-xs">Удовлетв.</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 border rounded text-center text-yellow-800 dark:text-yellow-200 text-xs font-bold flex items-center justify-center">3</div>
                <span className="text-xs">Хорошо</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 border rounded text-center text-green-800 dark:text-green-200 text-xs font-bold flex items-center justify-center">4</div>
                <span className="text-xs">Отлично</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            • Числа от 1 до 24 — количество рабочих часов<br/>
            • Правый клик на числовой ячейке — изменение оценки качества работы<br/>
            • Клик на ячейку для редактирования, Enter для сохранения, Escape для отмены
          </div>
        </div>
      </div>
    </div>
  );
}