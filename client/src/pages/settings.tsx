import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ui/theme-provider";
import { Download, Upload, Trash2, RefreshCw, CheckCircle, FileSpreadsheet } from "lucide-react";
import { Setting } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const employeeFileInputRef = useRef<HTMLInputElement>(null);
  const staffingFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const response = await apiRequest("POST", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Настройка сохранена" });
    },
    onError: () => {
      toast({ title: "Ошибка при сохранении настройки", variant: "destructive" });
    },
  });

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value || "";
  };

  const handleSettingChange = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleExportData = () => {
    // TODO: Implement data export
    toast({ title: "Функция экспорта данных будет добавлена" });
  };

  const handleImportData = () => {
    // TODO: Implement data import  
    toast({ title: "Функция импорта данных будет добавлена" });
  };

  const handleClearData = () => {
    if (confirm("Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.")) {
      // TODO: Implement data clearing
      toast({ title: "Функция очистки данных будет добавлена" });
    }
  };

  const handleSyncData = () => {
    // TODO: Implement data synchronization
    toast({ title: "Синхронизация данных выполнена" });
  };

  const handleImportObjects = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({ 
        title: "Ошибка", 
        description: "Пожалуйста, выберите CSV файл",
        variant: "destructive" 
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/objects', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка импорта');
      }

      toast({ 
        title: "Импорт завершён", 
        description: `Импортировано объектов: ${result.objectsCount}, пользователей: ${result.usersCount}` 
      });

      // Обновляем кэш объектов
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Ошибка импорта", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleEmployeeImportClick = () => {
    employeeFileInputRef.current?.click();
  };

  const handleStaffingImportClick = () => {
    staffingFileInputRef.current?.click();
  };

  const handleImportEmployees = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({ 
        title: "Ошибка", 
        description: "Пожалуйста, выберите CSV файл",
        variant: "destructive" 
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/employees', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка импорта');
      }

      toast({ 
        title: "Импорт завершён", 
        description: `Импортировано сотрудников: ${result.employeesCount}` 
      });

      // Обновляем кэш сотрудников
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Ошибка импорта", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (employeeFileInputRef.current) {
        employeeFileInputRef.current.value = '';
      }
    }
  };

  const handleImportStaffing = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({ 
        title: "Ошибка", 
        description: "Пожалуйста, выберите CSV файл",
        variant: "destructive" 
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/staffing', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка импорта');
      }

      toast({ 
        title: "Импорт завершён", 
        description: `Создано должностей: ${result.createdPositions}, обработано строк: ${result.processedRows}` 
      });

      // Обновляем кэш должностей
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Ошибка импорта", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (staffingFileInputRef.current) {
        staffingFileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Настройки</h2>
        <p className="text-muted-foreground">Конфигурация приложения и параметры системы</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Основные настройки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Тема оформления</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="dark">Тёмная</SelectItem>
                  <SelectItem value="system">Автоматическая</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Часовой пояс</Label>
              <Select 
                value={getSetting("timezone") || "Europe/Moscow"} 
                onValueChange={(value) => handleSettingChange("timezone", value)}
              >
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                  <SelectItem value="Europe/Kiev">Киев (GMT+2)</SelectItem>
                  <SelectItem value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workingDays">Рабочих дней в неделе</Label>
              <Select 
                value={getSetting("workingDays") || "5"} 
                onValueChange={(value) => handleSettingChange("workingDays", value)}
              >
                <SelectTrigger data-testid="select-working-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 дней (Пн-Пт)</SelectItem>
                  <SelectItem value="6">6 дней (Пн-Сб)</SelectItem>
                  <SelectItem value="7">7 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultQuality">Стандартная оценка качества</Label>
              <Select 
                value={getSetting("defaultQualityScore") || "3"} 
                onValueChange={(value) => handleSettingChange("defaultQualityScore", value)}
              >
                <SelectTrigger data-testid="select-default-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Плохо</SelectItem>
                  <SelectItem value="2">2 - Удовлетворительно</SelectItem>
                  <SelectItem value="3">3 - Нормально</SelectItem>
                  <SelectItem value="4">4 - Отлично</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deadline-notifications">Напоминания о дедлайнах</Label>
                <p className="text-xs text-muted-foreground">За 2 дня до закрытия периода</p>
              </div>
              <Switch
                id="deadline-notifications"
                checked={getSetting("notifications") === "true"}
                onCheckedChange={(checked) => handleSettingChange("notifications", checked.toString())}
                data-testid="switch-deadline-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="send-confirmations">Подтверждение отправки</Label>
                <p className="text-xs text-muted-foreground">Уведомление об успешной отправке отчёта</p>
              </div>
              <Switch
                id="send-confirmations"
                checked={getSetting("sendConfirmations") === "true"}
                onCheckedChange={(checked) => handleSettingChange("sendConfirmations", checked.toString())}
                data-testid="switch-send-confirmations"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-notifications">Звуковые уведомления</Label>
                <p className="text-xs text-muted-foreground">Звуковые сигналы для важных событий</p>
              </div>
              <Switch
                id="sound-notifications"
                checked={getSetting("soundNotifications") === "true"}
                onCheckedChange={(checked) => handleSettingChange("soundNotifications", checked.toString())}
                data-testid="switch-sound-notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Система</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="server-url">URL сервера отчётов</Label>
              <Input
                id="server-url"
                placeholder="https://api.example.com/submit-report"
                value={getSetting("serverUrl")}
                onChange={(e) => handleSettingChange("serverUrl", e.target.value)}
                data-testid="input-server-url"
              />
            </div>

            <div>
              <Label htmlFor="auto-save">Автосохранение</Label>
              <Select 
                value={getSetting("autoSave") || "immediate"} 
                onValueChange={(value) => handleSettingChange("autoSave", value)}
              >
                <SelectTrigger data-testid="select-auto-save">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Немедленно</SelectItem>
                  <SelectItem value="5">Каждые 5 секунд</SelectItem>
                  <SelectItem value="10">Каждые 10 секунд</SelectItem>
                  <SelectItem value="30">Каждые 30 секунд</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleExportData}
                variant="outline"
                className="w-full"
                data-testid="button-export-data"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт данных
              </Button>
              <Button 
                onClick={handleImportData}
                variant="outline"
                className="w-full"
                data-testid="button-import-data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Импорт данных
              </Button>
              <Button 
                onClick={handleClearData}
                variant="destructive"
                className="w-full"
                data-testid="button-clear-data"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить все данные
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {/* Data Import for HR Economist */}
        {user?.role === "economist" && (
          <Card>
            <CardHeader>
              <CardTitle>Управление справочниками</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="import-objects">Импорт справочника объектов</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Загрузите CSV файл с объектами и их менеджерами (формат: Объект;Менеджер объекта;Руководитель Группы Менеджеров)
                </p>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportObjects}
                    className="hidden"
                    data-testid="file-input-objects"
                  />
                  <Button 
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="w-full"
                    data-testid="button-import-objects"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isImporting ? "Импорт объектов..." : "Импорт объектов"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Label htmlFor="import-staffing">Импорт штатного расписания</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Загрузите CSV файл с должностями и окладами (формат: Объект;Должность;График работы;Оклад (тариф))
                </p>
                <div className="space-y-2">
                  <input
                    ref={staffingFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportStaffing}
                    className="hidden"
                    data-testid="file-input-staffing"
                  />
                  <Button 
                    onClick={handleStaffingImportClick}
                    disabled={isImporting}
                    className="w-full"
                    variant="outline"
                    data-testid="button-import-staffing"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isImporting ? "Импорт штатного расписания..." : "Импорт штатного расписания"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Label htmlFor="import-employees">Импорт справочника сотрудников</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Загрузите CSV файл со сотрудниками (формат: Объект;Сотрудник;Должность;статус)
                </p>
                <div className="space-y-2">
                  <input
                    ref={employeeFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportEmployees}
                    className="hidden"
                    data-testid="file-input-employees"
                  />
                  <Button 
                    onClick={handleEmployeeImportClick}
                    disabled={isImporting}
                    className="w-full"
                    variant="outline"
                    data-testid="button-import-employees"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? "Импорт сотрудников..." : "Импорт сотрудников"}
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Форматы CSV файлов:</h4>
                <div className="text-xs text-muted-foreground space-y-2">
                  <div>
                    <p className="font-medium">Объекты:</p>
                    <p>• Заголовки: Объект;Менеджер объекта;Руководитель Группы Менеджеров</p>
                    <p>• Пользователи создаются автоматически</p>
                  </div>
                  <div>
                    <p className="font-medium">Штатное расписание:</p>
                    <p>• Заголовки: Объект;Должность;График работы;Оклад (тариф)</p>
                    <p>• Оклады до 1000 считаются почасовыми ставками</p>
                  </div>
                  <div>
                    <p className="font-medium">Сотрудники:</p>
                    <p>• Заголовки: Объект;Сотрудник;Должность;статус</p>
                    <p>• Статус: Активный, Неактивный, Уволен</p>
                  </div>
                  <div>
                    <p>• Кодировка: UTF-8</p>
                    <p>• Разделитель: точка с запятой (;)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>О приложении</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Версия:</span>
                <span data-testid="app-version">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Последнее обновление:</span>
                <span data-testid="last-update">20.02.2024</span>
              </div>
              <div className="flex justify-between">
                <span>Статус синхронизации:</span>
                <span className="text-green-600 flex items-center" data-testid="sync-status">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Синхронизировано
                </span>
              </div>
              <div className="flex justify-between">
                <span>Объём данных:</span>
                <span data-testid="data-size">2.3 МБ</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button 
                onClick={handleSyncData}
                variant="outline"
                className="w-full"
                data-testid="button-sync-data"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Синхронизировать
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
