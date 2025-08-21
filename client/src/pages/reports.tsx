import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Send, FileText } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports"],
  });

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

  // Mock data for current periods
  const currentPeriods = {
    advance: {
      period: "1-15 февраля 2024",
      status: "sent",
      totalEmployees: 28,
      totalHours: 1920,
      sentDate: "16.02.2024 14:32",
    },
    salary: {
      period: "1-29 февраля 2024", 
      status: "draft",
      totalEmployees: 28,
      totalHours: 4080,
      deadline: "1 марта 2024",
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Формирование отчётов</h2>
        <p className="text-muted-foreground">Создание и отправка отчётов за отчётные периоды</p>
      </div>

      {/* Report Periods */}
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

      {/* Report History */}
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
                {/* Mock historical data */}
                <tr data-testid="report-history-1">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-15 февраля 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">28</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">1,920 ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.02.2024 14:32</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr data-testid="report-history-2">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-31 января 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Зарплата</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">26</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">4,160 ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">01.02.2024 16:45</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr data-testid="report-history-3">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">1-15 января 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">26</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">2,080 ч</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.01.2024 15:20</td>
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
