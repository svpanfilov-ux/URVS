import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Object as ObjectType } from "@shared/schema";
import { FileSpreadsheet, Edit, Check, X } from "lucide-react";

export default function Objects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const objectFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ObjectType>>({});

  const { data: objects = [], isLoading } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const updateObjectMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<ObjectType> }) => {
      const response = await apiRequest("PUT", `/api/objects/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      toast({ title: "Объект обновлен успешно" });
      setEditingId(null);
      setEditForm({});
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении объекта", variant: "destructive" });
    },
  });

  const handleObjectImportClick = () => {
    objectFileInputRef.current?.click();
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
        description: `Создано объектов: ${result.objectsCount}, создано пользователей: ${result.usersCount}` 
      });

      // Обновляем кэш объектов
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Ошибка импорта", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      if (objectFileInputRef.current) {
        objectFileInputRef.current.value = '';
      }
    }
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "Не назначен";
    const manager = users.find(user => user.id === managerId);
    return manager?.name || "Не назначен";
  };

  const getGroupManagerName = (groupManagerId: string | null) => {
    if (!groupManagerId) return "Не назначен";
    const groupManager = users.find(user => user.id === groupManagerId);
    return groupManager?.name || "Не назначен";
  };

  const handleEditStart = (object: ObjectType) => {
    setEditingId(object.id);
    setEditForm({
      name: object.name,
      code: object.code,
      description: object.description,
      managerId: object.managerId,
      groupManagerId: object.groupManagerId,
      isActive: object.isActive
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = () => {
    if (!editingId) return;
    
    // Нормализуем данные перед отправкой
    const updates = {
      ...editForm,
      managerId: editForm.managerId || null,
      groupManagerId: editForm.groupManagerId || null,
      name: editForm.name?.trim(),
      code: editForm.code?.trim(),
      description: editForm.description?.trim() || null
    };
    
    updateObjectMutation.mutate({
      id: editingId,
      updates
    });
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Объекты</h2>
          <p className="text-muted-foreground">Управление объектами и их менеджерами</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={handleObjectImportClick}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700"
            data-testid="import-objects"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isImporting ? "Импорт объектов..." : "Импорт объектов"}
          </Button>
        </div>
      </div>

      {/* Import Input */}
      <input
        ref={objectFileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportObjects}
        className="hidden"
        data-testid="file-input-objects"
      />

      {/* Format Description */}
      <Card>
        <CardHeader>
          <CardTitle>Формат файла для импорта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Заголовки CSV:</strong> Объект;Менеджер объекта;Руководитель Группы Менеджеров</p>
            <p><strong>Пример:</strong> ТЦ Европа;Иван Иванов;Петр Петров</p>
            <p><strong>Примечание:</strong> Пользователи-менеджеры создаются автоматически при импорте</p>
          </div>
        </CardContent>
      </Card>

      {/* Objects Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            Список объектов
            <Badge variant="outline">{objects.length}</Badge>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Код</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Менеджер объекта</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Руководитель группы</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Описание</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {objects.map((object) => {
                    const isEditing = editingId === object.id;
                    return (
                      <tr key={object.id} className="hover:bg-muted/50" data-testid={`object-row-${object.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Input
                              value={editForm.name || ""}
                              onChange={(e) => handleFormChange("name", e.target.value)}
                              className="text-sm"
                              data-testid={`edit-name-${object.id}`}
                            />
                          ) : (
                            <div className="text-sm font-medium text-foreground">{object.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Input
                              value={editForm.code || ""}
                              onChange={(e) => handleFormChange("code", e.target.value)}
                              className="text-sm"
                              data-testid={`edit-code-${object.id}`}
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">{object.code}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Select
                              value={editForm.managerId || ""}
                              onValueChange={(value) => handleFormChange("managerId", value)}
                            >
                              <SelectTrigger className="w-full text-sm" data-testid={`edit-manager-${object.id}`}>
                                <SelectValue placeholder="Выберите менеджера" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Не назначен</SelectItem>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-muted-foreground" data-testid={`object-manager-${object.id}`}>
                              {getManagerName(object.managerId)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Select
                              value={editForm.groupManagerId || ""}
                              onValueChange={(value) => handleFormChange("groupManagerId", value)}
                            >
                              <SelectTrigger className="w-full text-sm" data-testid={`edit-group-manager-${object.id}`}>
                                <SelectValue placeholder="Выберите руководителя" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Не назначен</SelectItem>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-muted-foreground" data-testid={`object-group-manager-${object.id}`}>
                              {getGroupManagerName(object.groupManagerId)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Input
                              value={editForm.description || ""}
                              onChange={(e) => handleFormChange("description", e.target.value)}
                              className="text-sm"
                              placeholder="Описание объекта"
                              data-testid={`edit-description-${object.id}`}
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">{object.description || "—"}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Select
                              value={editForm.isActive ? "true" : "false"}
                              onValueChange={(value) => handleFormChange("isActive", value === "true")}
                            >
                              <SelectTrigger className="w-full text-sm" data-testid={`edit-status-${object.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Активный</SelectItem>
                                <SelectItem value="false">Неактивный</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={object.isActive ? "default" : "secondary"}>
                              {object.isActive ? "Активный" : "Неактивный"}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={handleEditSave}
                                  disabled={updateObjectMutation.isPending}
                                  data-testid={`save-edit-${object.id}`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleEditCancel}
                                  disabled={updateObjectMutation.isPending}
                                  data-testid={`cancel-edit-${object.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStart(object)}
                                data-testid={`edit-object-${object.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
    </div>
  );
}