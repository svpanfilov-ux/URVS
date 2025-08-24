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
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Объект</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Менеджер</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Месяц</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Сотрудников</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Вакансий</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата и время отправки</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {/* Mock historical data */}
                <tr data-testid="report-history-1">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Магазин "Продукты №1"</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Иванов И.И.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Февраль 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">28</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">2</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.02.2024 14:32</td>
                </tr>
                <tr data-testid="report-history-2">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Склад "Центральный"</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Петров П.П.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Январь 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Зарплата</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">26</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">1</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">01.02.2024 16:45</td>
                </tr>
                <tr data-testid="report-history-3">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Офис "Администрация"</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Сидоров С.С.</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Январь 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Аванс</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">12</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">0</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge("sent")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">16.01.2024 15:20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
