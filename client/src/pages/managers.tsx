import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Plus, FileSpreadsheet, Edit, Trash2, Upload } from "lucide-react";

export default function Managers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const employeeFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: objects = [] } = useQuery<any[]>({
    queryKey: ["/api/objects"],
  });

  const handleEmployeeImportClick = () => {
    employeeFileInputRef.current?.click();
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

  // Filter only manager users
  const managers = users.filter(user => user.role === "manager");

  const getObjectsForManager = (managerId: string) => {
    return objects.filter(obj => obj.managerId === managerId);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "manager":
        return <Badge variant="default">Менеджер</Badge>;
      case "economist":
        return <Badge variant="secondary">Экономист</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Менеджеры</h2>
          <p className="text-muted-foreground">Управление менеджерами и импорт сотрудников</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={handleEmployeeImportClick}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700"
            data-testid="import-employees"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Импорт сотрудников..." : "Импорт сотрудников"}
          </Button>
        </div>
      </div>

      {/* Import Input */}
      <input
        ref={employeeFileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportEmployees}
        className="hidden"
        data-testid="file-input-employees"
      />

      {/* Format Description */}
      <Card>
        <CardHeader>
          <CardTitle>Формат файла для импорта сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Заголовки CSV:</strong> Объект;Сотрудник;Должность;статус</p>
            <p><strong>Пример:</strong> ТЦ Европа;Иван Иванов;Продавец-консультант;активный</p>
            <p><strong>Возможные статусы:</strong> активный, подработка, уволен</p>
          </div>
        </CardContent>
      </Card>

      {/* Managers Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            Список менеджеров
            <Badge variant="outline">{managers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ФИО</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Логин</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Назначенные объекты</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {managers.map((manager) => {
                    const managerObjects = getObjectsForManager(manager.id);
                    return (
                      <tr key={manager.id} className="hover:bg-muted/50" data-testid={`manager-row-${manager.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{manager.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">{manager.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(manager.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground" data-testid={`manager-objects-${manager.id}`}>
                            {managerObjects.length > 0 ? (
                              <div className="space-y-1">
                                {managerObjects.map((obj) => (
                                  <Badge key={obj.id} variant="outline" className="mr-1">
                                    {obj.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "Объекты не назначены"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={manager.isActive ? "default" : "secondary"}>
                            {manager.isActive ? "Активный" : "Неактивный"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Users Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            Все пользователи системы
            <Badge variant="outline">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ФИО</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Логин</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата создания</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Активный" : "Неактивный"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}