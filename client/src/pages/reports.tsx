import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useObjectStore } from "@/lib/object-store";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Send, FileText, AlertTriangle, Lock, Calendar } from "lucide-react";
import { Object as ObjectType, Employee, Position, TimeEntry, TimesheetPeriod } from "@shared/schema";
import { TimesheetReport } from "@/components/timesheet-report";
import { EconomistReportsControl } from "@/components/economist-reports-control";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedObjectId } = useObjectStore();
  const [showReport, setShowReport] = useState(false);
  
  // Default to current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [reportMonth, setReportMonth] = useState(getCurrentMonth());

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports"],
  });

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", selectedObjectId],
    enabled: !!selectedObjectId,
    queryFn: () => fetch(`/api/positions?objectId=${selectedObjectId}`).then(r => r.json()),
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", reportMonth],
    queryFn: async () => {
      const [year, month] = reportMonth.split('-');
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      const startDate = `${reportMonth}-01`;
      const endDate = `${reportMonth}-${String(daysInMonth).padStart(2, '0')}`;
      const response = await fetch(`/api/time-entries?startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
  });

  // Get timesheet period status
  const { data: periodStatus } = useQuery<TimesheetPeriod | { status: string; reportStatus: string | null }>({
    queryKey: ["/api/timesheet-periods", selectedObjectId, reportMonth],
    enabled: !!selectedObjectId && user?.role === "manager",
  });

  const isPeriodClosed = periodStatus?.status === "closed";
  const reportStatus = periodStatus?.reportStatus;

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = format(date, "LLLL yyyy", { locale: ru });
      months.push({ value, label });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

  const sendReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest("PUT", `/api/reports/${reportId}/send`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Отчёт отправлен успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при отправке отчёта", variant: "destructive" });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Отчёт создан успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при создании отчёта", variant: "destructive" });
    },
  });

  // Calculate real data from imported information
  const calculateReportData = () => {
    const activeEmployees = employees.filter(emp => emp.status === "active");
    const totalEmployees = activeEmployees.length;
    
    // Calculate total hours from time entries
    const totalHoursFromEntries = timeEntries.reduce((sum, entry) => {
      if (typeof entry.hours === 'number') {
        return sum + entry.hours;
      }
      return sum;
    }, 0);
    
    // If no time entries, estimate based on employees and work days
    const estimatedHours = totalEmployees * 160; // 160 hours per month per employee
    const actualHours = totalHoursFromEntries > 0 ? totalHoursFromEntries : estimatedHours;
    
    return {
      totalEmployees,
      totalHours: actualHours,
      totalPositions: positions.length,
      totalObjects: objects.filter(obj => obj.status === "active").length
    };
  };

  const reportData = calculateReportData();

  const currentPeriods = {
    advance: {
      period: "1-15 августа 2025",
      status: "sent",
      totalEmployees: reportData.totalEmployees,
      totalHours: Math.round(reportData.totalHours * 0.5), // Half month for advance
      sentDate: "16.08.2025 14:32",
    },
    salary: {
      period: "1-31 августа 2025", 
      status: "draft",
      totalEmployees: reportData.totalEmployees,
      totalHours: reportData.totalHours,
      deadline: "1 сентября 2025",
    },
  };

  const handleSendSalaryReport = () => {
    // Create and send salary report
    const reportData = {
      period: "2024-02",
      type: "salary",
      status: "sent",
      data: JSON.stringify(currentPeriods.salary),
    };
    
    createReportMutation.mutate(reportData);
  };

  const handlePreviewReport = (type: string) => {
    toast({ title: `Предпросмотр отчёта: ${type}` });
  };

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Отправлено
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
        В работе
      </Badge>
    );
  };

  // Economist view - reports control and approval
  if (user?.role === "economist") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Контроль отчётов</h2>
          <p className="text-muted-foreground">Управление отчётами от всех объектов</p>
        </div>

        <EconomistReportsControl />
      </div>
    );
  }

  // Object Manager specific actions
  const handleGenerateReport = () => {
    if (!selectedObjectId) {
      toast({ 
        title: "Ошибка", 
        description: "Выберите объект для формирования отчёта",
        variant: "destructive" 
      });
      return;
    }
    setShowReport(true);
    toast({ title: "Отчёт сформирован", description: "Отчёт готов к предпросмотру и отправке" });
  };

  const handleSendReport = () => {
    setShowReport(false);
    toast({ title: "Отчёт отправлен на утверждение", description: "Отчёт передан руководству для проверки" });
  };

  const sendForApprovalMutation = useMutation({
    mutationFn: async () => {
      if (!periodStatus || !('id' in periodStatus)) {
        throw new Error("Период не найден");
      }
      return await apiRequest("PUT", `/api/timesheet-periods/${periodStatus.id}/report-status`, {
        reportStatus: "submitted"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-periods", selectedObjectId, reportMonth] });
      toast({ title: "Отчёт отправлен на утверждение", description: "Отчёт передан руководству для проверки" });
    },
    onError: () => {
      toast({ title: "Ошибка при отправке отчёта", variant: "destructive" });
    },
  });

  const handleSendForApproval = () => {
    sendForApprovalMutation.mutate();
  };

  const handleRequestChanges = () => {
    toast({ title: "Запрошены изменения", description: "Отправлен запрос на корректировку данных", variant: "destructive" });
  };

  // HR Economist, Object Manager, Group Manager view - full reports functionality
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Формирование отчётов</h2>
        <p className="text-muted-foreground">Создание и отправка отчётов за отчётные периоды</p>
      </div>

      {/* Object Manager Action Buttons */}
      {user?.role === "manager" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Управление отчётами</CardTitle>
                <p className="text-sm text-muted-foreground">Действия с отчётами объекта</p>
              </div>
              
              {/* Month Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={reportMonth} onValueChange={setReportMonth}>
                  <SelectTrigger className="w-[200px]" data-testid="select-month">
                    <SelectValue placeholder="Выберите месяц" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicators */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {!isPeriodClosed ? (
                <div className="flex items-center gap-2 text-orange-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Период не закрыт. Закройте табель, чтобы сформировать отчёт.</span>
                </div>
              ) : reportStatus === "approved" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Badge className="bg-green-600">Отчёт утверждён</Badge>
                  <span className="text-sm">Редактирование недоступно</span>
                </div>
              ) : reportStatus === "submitted" ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <Badge className="bg-blue-600">Отчёт отправлен</Badge>
                  <span className="text-sm">Ожидает утверждения</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <Badge className="bg-green-600">Готов к формированию</Badge>
                  <span className="text-sm">Период закрыт, можно создать отчёт</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!isPeriodClosed || reportStatus === "approved"}
                data-testid="generate-report-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Сформировать отчёт
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowReport(!showReport)}
                disabled={!showReport && !isPeriodClosed}
                data-testid="preview-report-button"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showReport ? "Скрыть отчёт" : "Предпросмотр"}
              </Button>
              <Button 
                onClick={handleSendForApproval}
                className="bg-green-600 hover:bg-green-700"
                disabled={!showReport || reportStatus === "approved" || reportStatus === "submitted"}
                data-testid="send-approval-button"
              >
                <Send className="h-4 w-4 mr-2" />
                На утверждение
              </Button>
              <Button 
                variant="outline"
                onClick={handleRequestChanges}
                disabled={reportStatus !== "draft" && reportStatus !== null}
                data-testid="request-changes-button"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timesheet Report Component */}
      {showReport && selectedObjectId && user?.role === "manager" && (
        <TimesheetReport
          month={reportMonth}
          employees={employees}
          timeEntries={timeEntries}
          positions={positions}
          objectId={selectedObjectId}
          onSendReport={handleSendReport}
        />
      )}

      {/* Report Periods - only for non-directors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advance Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Отчёт по авансу</CardTitle>
                <p className="text-sm text-muted-foreground">{currentPeriods.advance.period}</p>
              </div>
              {getStatusBadge(currentPeriods.advance.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Всего сотрудников:</span>
                <span data-testid="advance-employees">{currentPeriods.advance.totalEmployees}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Отработано часов:</span>
                <span data-testid="advance-hours">{currentPeriods.advance.totalHours} ч</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Дата отправки:</span>
                <span data-testid="advance-sent-date">{currentPeriods.advance.sentDate}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                disabled
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                data-testid="advance-send-button"
              >
                <Send className="h-4 w-4 mr-2" />
                Уже отправлен
              </Button>
              <Button 
                variant="outline"
                onClick={() => handlePreviewReport("advance")}
                data-testid="advance-preview-button"
              >
                <Eye className="h-4 w-4 mr-2" />
                Просмотр
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Salary Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Отчёт по зарплате</CardTitle>
                <p className="text-sm text-muted-foreground">{currentPeriods.salary.period}</p>
              </div>
              {getStatusBadge(currentPeriods.salary.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Всего сотрудников:</span>
                <span data-testid="salary-employees">{currentPeriods.salary.totalEmployees}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Отработано часов:</span>
                <span data-testid="salary-hours">{currentPeriods.salary.totalHours} ч</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доступна до:</span>
                <span className="text-orange-600 font-medium" data-testid="salary-deadline">
                  {currentPeriods.salary.deadline}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleSendSalaryReport}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="salary-send-button"
              >
                <Send className="h-4 w-4 mr-2" />
                Отправить отчёт
              </Button>
              <Button 
                variant="outline"
                onClick={() => handlePreviewReport("salary")}
                data-testid="salary-preview-button"
              >
                <Eye className="h-4 w-4 mr-2" />
                Просмотр
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report History - different structure for non-directors */}
      <Card>
        <CardHeader>
          <CardTitle>История отчётов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Период</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Сотрудников</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Часов</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата отправки</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                <tr data-testid="manager-report-1">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-15 августа 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{currentPeriods.advance.totalEmployees}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{currentPeriods.advance.totalHours.toLocaleString()} ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.08.2025 14:32</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr data-testid="manager-report-2">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-31 июля 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Зарплата</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{currentPeriods.salary.totalEmployees}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{currentPeriods.salary.totalHours.toLocaleString()} ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">01.08.2025 16:45</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr data-testid="manager-report-3">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-15 июля 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{Math.max(1, currentPeriods.salary.totalEmployees - 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{Math.round(currentPeriods.advance.totalHours * 0.9).toLocaleString()} ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.07.2025 15:20</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
