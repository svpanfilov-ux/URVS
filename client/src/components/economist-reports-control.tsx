import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle, XCircle, Send, AlertCircle, Lock, Calendar, Download, FileSpreadsheet } from "lucide-react";
import { Object as ObjectType, TimesheetPeriod } from "@shared/schema";
import * as XLSX from "xlsx";

interface ObjectReportStatus {
  object: ObjectType;
  period: TimesheetPeriod | null;
  isPastDeadline: boolean;
}

export function EconomistReportsControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");

  // Fetch all objects
  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  // Fetch period statuses for all objects
  const { data: allPeriods = [], refetch: refetchPeriods } = useQuery<TimesheetPeriod[]>({
    queryKey: ["/api/timesheet-periods/all", selectedPeriod],
    queryFn: async () => {
      // Return empty array if no objects yet
      if (objects.length === 0) {
        return [];
      }
      
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      if (!token) {
        throw new Error("No auth token");
      }

      // Fetch periods for each object with authorization header
      const promises = objects.map(obj =>
        fetch(`/api/timesheet-periods/${obj.id}/${selectedPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(r => r.json())
          .catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    },
    gcTime: 0, // Не кешировать вообще
    staleTime: 0, // Данные устаревают сразу
    refetchOnMount: "always", // Всегда загружать при монтировании
    refetchOnWindowFocus: true, // Обновление при возврате на вкладку
  });

  // Refetch periods when objects load or period changes
  useEffect(() => {
    if (objects.length > 0) {
      refetchPeriods();
    }
  }, [objects.length, selectedPeriod, refetchPeriods]);

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

  // Selected reports for export
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  // Toggle single report selection
  const toggleReportSelection = (objectId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(objectId)) {
      newSelected.delete(objectId);
    } else {
      newSelected.add(objectId);
    }
    setSelectedReports(newSelected);
  };

  // Toggle select all/none
  const toggleSelectAll = () => {
    if (selectedReports.size === objectStatuses.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(objectStatuses.map(s => s.object.id)));
    }
  };

  // Export functions
  const exportToExcel = async (objectIds: string[]) => {
    try {
      // Get auth token
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      if (!token) {
        toast({ 
          title: "Ошибка авторизации", 
          description: "Токен не найден",
          variant: "destructive" 
        });
        return;
      }

      // Fetch reports data for selected objects
      const reportsPromises = objectIds.map(async (objectId) => {
        try {
          const response = await fetch(`/api/reports/${objectId}/${selectedPeriod}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) return null;
          const report = await response.json();
          return { objectId, report };
        } catch (error) {
          console.error(`Failed to fetch report for ${objectId}:`, error);
          return null;
        }
      });

      const reportsData = (await Promise.all(reportsPromises)).filter(Boolean);

      if (reportsData.length === 0) {
        toast({ 
          title: "Нет данных для экспорта", 
          description: "Выбранные отчёты недоступны",
          variant: "destructive" 
        });
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add a sheet for each report
      reportsData.forEach(({ objectId, report }: any) => {
        const object = objects.find(o => o.id === objectId);
        if (!object || !report?.data) return;

        const reportData = JSON.parse(report.data);
        const sheetData: any[][] = [];

        // Header
        sheetData.push([`Отчёт по объекту: ${object.name}`]);
        sheetData.push([`Период: ${selectedPeriod}`]);
        sheetData.push([]); // Empty row

        // Table header
        sheetData.push([
          "ФИО",
          "Должность",
          "Ставка/Оклад",
          "План (ч)",
          "Факт (ч)",
          "Всего (₽)",
          "Аванс (₽)",
          "ЗП (₽)",
          "Способ выплаты"
        ]);

        // Table rows
        if (reportData.employees && Array.isArray(reportData.employees)) {
          reportData.employees.forEach((emp: any) => {
            sheetData.push([
              emp.name || "",
              emp.position || "",
              emp.paymentType === "salary" 
                ? `${emp.rate?.toLocaleString() || 0} ₽/мес`
                : `${emp.rate?.toLocaleString() || 0} ₽/ч`,
              emp.plannedHours || 0,
              emp.actualHours || 0,
              emp.totalSalary || 0,
              emp.advanceSalary || 0,
              emp.mainSalary || 0,
              emp.paymentMethod === "card" ? "Карта" : "Ведомость"
            ]);
          });
        }

        // Totals
        if (reportData.totals) {
          sheetData.push([]); // Empty row
          sheetData.push([
            "ИТОГО:",
            "",
            "",
            reportData.totals.plannedHours || 0,
            reportData.totals.actualHours || 0,
            reportData.totals.actualFOT || 0,
            (reportData.totals.advanceCard || 0) + (reportData.totals.advanceCash || 0),
            (reportData.totals.salaryCard || 0) + (reportData.totals.salaryCash || 0),
            ""
          ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Set column widths
        ws['!cols'] = [
          { wch: 30 }, // ФИО
          { wch: 25 }, // Должность
          { wch: 15 }, // Ставка
          { wch: 10 }, // План
          { wch: 10 }, // Факт
          { wch: 12 }, // Всего
          { wch: 12 }, // Аванс
          { wch: 12 }, // ЗП
          { wch: 15 }, // Способ выплаты
        ];

        XLSX.utils.book_append_sheet(wb, ws, object.name.substring(0, 31)); // Excel sheet name limit
      });

      // Download file
      const fileName = objectIds.length === 1 
        ? `Отчёт_${objects.find(o => o.id === objectIds[0])?.name}_${selectedPeriod}.xlsx`
        : `Отчёты_${selectedPeriod}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      toast({ 
        title: "Экспорт завершён", 
        description: `Загружено ${reportsData.length} отчёт(ов)` 
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({ 
        title: "Ошибка экспорта", 
        description: "Не удалось экспортировать отчёты",
        variant: "destructive" 
      });
    }
  };

  const handleExportSelected = () => {
    if (selectedReports.size === 0) {
      toast({ 
        title: "Выберите отчёты", 
        description: "Отметьте отчёты для экспорта",
        variant: "destructive" 
      });
      return;
    }
    exportToExcel(Array.from(selectedReports));
  };

  const handleExportAll = () => {
    const allObjectIds = objectStatuses.map(s => s.object.id);
    exportToExcel(allObjectIds);
  };

  // Check if report is past deadline
  const isPastDeadline = (period: string, reportStatus: string | null | undefined): boolean => {
    const [year, month] = period.split('-').map(Number);
    const now = new Date();
    
    // If report is already submitted or approved, it's not overdue
    if (reportStatus && ["submitted", "approved"].includes(reportStatus)) {
      return false;
    }
    
    // Get the last day of the period month
    const lastDayOfMonth = new Date(year, month, 0);
    
    // If we're in a month after the period month, it's past deadline
    if (now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() >= month)) {
      // If we're past the last day of the period month, it's overdue
      return now > lastDayOfMonth;
    }
    
    return false;
  };

  // Combine objects with their period status
  const objectStatuses: ObjectReportStatus[] = objects.map(obj => {
    const period = allPeriods.find(p => p.objectId === obj.id) || null;
    return {
      object: obj,
      period,
      isPastDeadline: isPastDeadline(selectedPeriod, period?.reportStatus),
    };
  });

  // Get status text and color
  const getTimesheetStatus = (period: TimesheetPeriod | null) => {
    if (!period || period.status === "open") {
      return { text: "Открыт", variant: "secondary" as const, icon: AlertCircle };
    }
    return { text: "Закрыт", variant: "default" as const, icon: Lock };
  };

  const getReportStatus = (period: TimesheetPeriod | null) => {
    if (!period || !period.reportStatus) {
      return { 
        text: "Не сформирован", 
        variant: "outline" as const, 
        color: "text-gray-500",
        icon: AlertCircle 
      };
    }

    switch (period.reportStatus) {
      case "draft":
        return { 
          text: "Сформирован, не отправлен", 
          variant: "secondary" as const,
          color: "text-blue-600",
          icon: Send 
        };
      case "requested":
        return { 
          text: "Запрошен", 
          variant: "default" as const,
          color: "text-orange-600",
          icon: Calendar 
        };
      case "submitted":
        return { 
          text: "Отправлен, ожидает проверки", 
          variant: "default" as const,
          color: "text-yellow-600",
          icon: AlertCircle 
        };
      case "rejected":
        return { 
          text: "На доработке", 
          variant: "destructive" as const,
          color: "text-red-600",
          icon: XCircle 
        };
      case "approved":
        return { 
          text: "Утверждён", 
          variant: "default" as const,
          color: "text-green-600",
          icon: CheckCircle 
        };
      default:
        return { 
          text: "Неизвестен", 
          variant: "outline" as const,
          color: "text-gray-500",
          icon: AlertCircle 
        };
    }
  };

  // Request report mutation
  const requestReportMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const response = await apiRequest("POST", `/api/timesheet-periods/${periodId}/request`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-periods/all", selectedPeriod] });
      toast({ title: "Отчёт запрошен", description: "Менеджер получит уведомление" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка при запросе отчёта", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Reject report mutation
  const rejectReportMutation = useMutation({
    mutationFn: async ({ periodId, comment }: { periodId: string; comment: string }) => {
      const response = await apiRequest("POST", `/api/timesheet-periods/${periodId}/reject`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-periods/all", selectedPeriod] });
      setRejectDialogOpen(false);
      setRejectionComment("");
      toast({ 
        title: "Отчёт отклонён", 
        description: "Табель открыт для редактирования. Менеджер получит уведомление" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка при отклонении отчёта", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Approve report mutation
  const approveReportMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const response = await apiRequest("POST", `/api/timesheet-periods/${periodId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-periods/all", selectedPeriod] });
      toast({ 
        title: "Отчёт утверждён", 
        description: "Табель заблокирован для редактирования" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка при утверждении отчёта", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleReject = (periodId: string) => {
    setSelectedPeriodId(periodId);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedPeriodId || !rejectionComment.trim()) {
      toast({ 
        title: "Укажите причину отклонения", 
        variant: "destructive" 
      });
      return;
    }
    rejectReportMutation.mutate({ periodId: selectedPeriodId, comment: rejectionComment });
  };

  // Can request if status is null, draft, or rejected
  const canRequest = (period: TimesheetPeriod | null) => {
    return !period?.reportStatus || ["draft", "rejected"].includes(period.reportStatus);
  };

  // Can reject if status is submitted
  const canReject = (period: TimesheetPeriod | null) => {
    return period?.reportStatus === "submitted";
  };

  // Can approve if status is submitted
  const canApprove = (period: TimesheetPeriod | null) => {
    return period?.reportStatus === "submitted";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Контроль отчётов по объектам
            </CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]" data-testid="select-period">
                <SelectValue />
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
          
          {/* Export buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportSelected}
              disabled={selectedReports.size === 0}
              data-testid="button-export-selected"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Экспорт выбранных ({selectedReports.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportAll}
              disabled={objectStatuses.length === 0}
              data-testid="button-export-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт всех ({objectStatuses.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReports.size === objectStatuses.length && objectStatuses.length > 0}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>Статус табеля</TableHead>
                <TableHead>Статус отчёта</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectStatuses.map(({ object, period, isPastDeadline }) => {
                const timesheetStatus = getTimesheetStatus(period);
                const reportStatus = getReportStatus(period);
                const TimesheetIcon = timesheetStatus.icon;
                const ReportIcon = reportStatus.icon;

                return (
                  <TableRow 
                    key={object.id} 
                    className={isPastDeadline ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                    data-testid={`row-object-${object.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedReports.has(object.id)}
                        onCheckedChange={() => toggleReportSelection(object.id)}
                        data-testid={`checkbox-${object.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{object.name}</TableCell>
                    <TableCell>
                      <Badge variant={timesheetStatus.variant} className="gap-1" data-testid={`badge-timesheet-${object.id}`}>
                        <TimesheetIcon className="h-3 w-3" />
                        {timesheetStatus.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={reportStatus.variant} className={`gap-1 ${reportStatus.color}`} data-testid={`badge-report-${object.id}`}>
                          <ReportIcon className="h-3 w-3" />
                          {reportStatus.text}
                        </Badge>
                        {isPastDeadline && (
                          <span title="Просрочен">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canRequest(period) && period?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestReportMutation.mutate(period.id)}
                            disabled={requestReportMutation.isPending}
                            data-testid={`button-request-${object.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Запросить
                          </Button>
                        )}
                        {canReject(period) && period?.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(period.id)}
                            disabled={rejectReportMutation.isPending}
                            data-testid={`button-reject-${object.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Отклонить
                          </Button>
                        )}
                        {canApprove(period) && period?.id && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveReportMutation.mutate(period.id)}
                            disabled={approveReportMutation.isPending}
                            data-testid={`button-approve-${object.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Утвердить
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {objectStatuses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Нет данных для отображения
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Отклонить отчёт</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения отчёта. Табель будет открыт для редактирования.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Опишите, что необходимо исправить..."
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            rows={4}
            data-testid="input-rejection-comment"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-reject"
            >
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectSubmit}
              disabled={rejectReportMutation.isPending || !rejectionComment.trim()}
              data-testid="button-submit-reject"
            >
              Отклонить отчёт
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
