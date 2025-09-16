import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useObjectStore } from "@/lib/object-store";
import { useAuth } from "@/hooks/useAuth";
import { Position, Object as ObjectType, User } from "@shared/schema";
import { Plus, Upload, Download, Edit, Check, X, Search } from "lucide-react";

export default function Staffing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjectFilter, setSelectedObjectFilter] = useState<string>("all");
  const [editingPositions, setEditingPositions] = useState<Record<string, any>>({});
  const [isImporting, setIsImporting] = useState(false);
  const staffingFileInputRef = useRef<HTMLInputElement>(null);
  
  const { selectedObjectId } = useObjectStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user can edit staffing (only HR economist can edit)
  const canEdit = user?.role === "economist";

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/positions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Позиция обновлена успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении позиции", variant: "destructive" });
    },
  });

  const createPositionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/positions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Позиция добавлена успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при добавлении позиции", variant: "destructive" });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Позиция удалена успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении позиции", variant: "destructive" });
    },
  });

  // Filter positions
  const filteredPositions = positions.filter((position: Position) => {
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObject = selectedObjectFilter === "all" || position.objectId === selectedObjectFilter;
    return matchesSearch && matchesObject;
  });

  const handleEditPosition = (position: Position) => {
    setEditingPositions({
      ...editingPositions,
      [position.id]: {
        objectId: position.objectId,
        title: position.title,
        workSchedule: position.workSchedule,
        paymentType: position.paymentType,
        hourlyRate: position.hourlyRate || "",
        monthlySalary: position.monthlySalary || "",
        positionsCount: position.positionsCount,
      }
    });
  };

  const handleSavePosition = (positionId: string) => {
    const editData = editingPositions[positionId];
    if (!editData) return;

    updatePositionMutation.mutate({
      id: positionId,
      data: {
        ...editData,
        hourlyRate: editData.hourlyRate ? Number(editData.hourlyRate) : null,
        monthlySalary: editData.monthlySalary ? Number(editData.monthlySalary) : null,
        positionsCount: Number(editData.positionsCount),
      }
    });

    setEditingPositions(prev => {
      const newState = { ...prev };
      delete newState[positionId];
      return newState;
    });
  };

  const handleCancelEdit = (positionId: string) => {
    setEditingPositions(prev => {
      const newState = { ...prev };
      delete newState[positionId];
      return newState;
    });
  };

  const handleAddNewPosition = () => {
    const newId = `new-${Date.now()}`;
    setEditingPositions({
      ...editingPositions,
      [newId]: {
        objectId: selectedObjectId || "",
        title: "",
        workSchedule: "5/2",
        paymentType: "salary",
        hourlyRate: "",
        monthlySalary: "",
        positionsCount: 1,
      }
    });
  };

  const handleSaveNewPosition = (newId: string) => {
    const editData = editingPositions[newId];
    if (!editData || !editData.objectId || !editData.title) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    createPositionMutation.mutate({
      ...editData,
      hourlyRate: editData.hourlyRate ? Number(editData.hourlyRate) : null,
      monthlySalary: editData.monthlySalary ? Number(editData.monthlySalary) : null,
      positionsCount: Number(editData.positionsCount),
      hoursPerShift: 8,
      isActive: true,
    });

    setEditingPositions(prev => {
      const newState = { ...prev };
      delete newState[newId];
      return newState;
    });
  };

  const handleImportStaffing = () => {
    staffingFileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      // Get token from localStorage for authorization
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch('/api/import/staffing', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка импорта';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {
          errorMessage = `Ошибка сервера: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast({ 
        title: "Импорт завершён", 
        description: `Импортировано позиций: ${result.positionsCount || 'неизвестно'}` 
      });

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

  const handleExportStaffing = async () => {
    try {
      // Get token from localStorage for authorization
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch('/api/positions/export/csv', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка экспорта';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {
          errorMessage = `Ошибка сервера: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staffing-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ 
        title: "Экспорт завершён", 
        description: "Файл штатного расписания сохранён" 
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: "Ошибка экспорта", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    }
  };

  const getObjectName = (objectId: string) => {
    const obj = objects.find(o => o.id === objectId);
    return obj?.name || "Не указан";
  };

  const formatSalary = (position: Position) => {
    if (position.paymentType === "salary" && position.monthlySalary) {
      return `${position.monthlySalary.toLocaleString()} руб/мес`;
    } else if (position.paymentType === "hourly" && position.hourlyRate) {
      return `${position.hourlyRate} руб/час`;
    }
    return "Не указан";
  };

  const getPaymentTypeLabel = (type: string) => {
    return type === "salary" ? "Оклад" : "Почасовая";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Штатное Расписание</h1>
        {canEdit && (
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddNewPosition}
              data-testid="button-add-position"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить позицию
            </Button>
            <Button 
              variant="outline" 
              onClick={handleImportStaffing}
              disabled={isImporting}
              data-testid="button-import-staffing"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Импорт..." : "Импорт"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportStaffing}
              data-testid="button-export-staffing"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск по должности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-position"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <Select value={selectedObjectFilter} onValueChange={setSelectedObjectFilter}>
            <SelectTrigger data-testid="select-object-filter">
              <SelectValue placeholder="Все объекты" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все объекты</SelectItem>
              {objects.map((object) => (
                <SelectItem key={object.id} value={object.id}>
                  {object.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staffing Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            Штатное расписание
            <Badge variant="outline">{filteredPositions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium text-muted-foreground">Объект</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Должность</TableHead>
                  <TableHead className="font-medium text-muted-foreground">График работы</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Оклад (тариф)</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Количество ставок</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Тип оплат</TableHead>
                  {canEdit && (
                    <TableHead className="font-medium text-muted-foreground">Действия</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* New positions in edit mode */}
                {Object.entries(editingPositions).filter(([id]) => id.startsWith('new-')).map(([newId, editData]) => (
                  <TableRow key={newId} className="bg-blue-50 dark:bg-blue-950/20">
                    {/* Объект */}
                    <TableCell>
                      <Select 
                        value={editData.objectId} 
                        onValueChange={(value) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { ...prev[newId], objectId: value } 
                        }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Выберите объект" />
                        </SelectTrigger>
                        <SelectContent>
                          {objects.map((object) => (
                            <SelectItem key={object.id} value={object.id}>
                              {object.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Должность */}
                    <TableCell>
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { ...prev[newId], title: e.target.value } 
                        }))}
                        placeholder="Введите должность"
                        className="h-8"
                      />
                    </TableCell>

                    {/* График работы */}
                    <TableCell>
                      <Select 
                        value={editData.workSchedule} 
                        onValueChange={(value) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { ...prev[newId], workSchedule: value } 
                        }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5/2">5/2</SelectItem>
                          <SelectItem value="2/2">2/2</SelectItem>
                          <SelectItem value="3/3">3/3</SelectItem>
                          <SelectItem value="6/1">6/1</SelectItem>
                          <SelectItem value="вахта (7/0)">вахта (7/0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Оклад (тариф) */}
                    <TableCell>
                      <Input
                        type="number"
                        value={editData.paymentType === "salary" ? editData.monthlySalary : editData.hourlyRate}
                        onChange={(e) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { 
                            ...prev[newId], 
                            [editData.paymentType === "salary" ? "monthlySalary" : "hourlyRate"]: e.target.value,
                            [editData.paymentType === "salary" ? "hourlyRate" : "monthlySalary"]: ""
                          } 
                        }))}
                        placeholder={editData.paymentType === "salary" ? "Месячный оклад" : "Часовая ставка"}
                        className="h-8"
                      />
                    </TableCell>

                    {/* Количество ставок */}
                    <TableCell>
                      <Select 
                        value={editData.positionsCount.toString()} 
                        onValueChange={(value) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { ...prev[newId], positionsCount: parseInt(value) } 
                        }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Тип оплат */}
                    <TableCell>
                      <Select 
                        value={editData.paymentType} 
                        onValueChange={(value) => setEditingPositions(prev => ({ 
                          ...prev, 
                          [newId]: { 
                            ...prev[newId], 
                            paymentType: value,
                            hourlyRate: "",
                            monthlySalary: ""
                          } 
                        }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary">Оклад</SelectItem>
                          <SelectItem value="hourly">Почасовая</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Действия */}
                    {canEdit && (
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSaveNewPosition(newId)}
                            data-testid={`save-new-position-${newId}`}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCancelEdit(newId)}
                            data-testid={`cancel-new-position-${newId}`}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {/* Existing positions */}
                {filteredPositions.map((position) => {
                  const isEditing = editingPositions[position.id];
                  const editData = editingPositions[position.id];

                  return (
                    <TableRow key={position.id} className="hover:bg-muted/50" data-testid={`position-row-${position.id}`}>
                      {/* Объект */}
                      <TableCell>
                        {isEditing ? (
                          <Select 
                            value={editData.objectId} 
                            onValueChange={(value) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { ...prev[position.id], objectId: value } 
                            }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {objects.map((object) => (
                                <SelectItem key={object.id} value={object.id}>
                                  {object.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-foreground" data-testid={`position-object-${position.id}`}>
                            {getObjectName(position.objectId)}
                          </div>
                        )}
                      </TableCell>

                      {/* Должность */}
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.title}
                            onChange={(e) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { ...prev[position.id], title: e.target.value } 
                            }))}
                            className="h-8"
                          />
                        ) : (
                          <div className="text-sm font-medium text-foreground">{position.title}</div>
                        )}
                      </TableCell>

                      {/* График работы */}
                      <TableCell>
                        {isEditing ? (
                          <Select 
                            value={editData.workSchedule} 
                            onValueChange={(value) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { ...prev[position.id], workSchedule: value } 
                            }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5/2">5/2</SelectItem>
                              <SelectItem value="2/2">2/2</SelectItem>
                              <SelectItem value="3/3">3/3</SelectItem>
                              <SelectItem value="6/1">6/1</SelectItem>
                              <SelectItem value="вахта (7/0)">вахта (7/0)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">{position.workSchedule}</div>
                        )}
                      </TableCell>

                      {/* Оклад (тариф) */}
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editData.paymentType === "salary" ? editData.monthlySalary : editData.hourlyRate}
                            onChange={(e) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { 
                                ...prev[position.id], 
                                [editData.paymentType === "salary" ? "monthlySalary" : "hourlyRate"]: e.target.value,
                                [editData.paymentType === "salary" ? "hourlyRate" : "monthlySalary"]: ""
                              } 
                            }))}
                            className="h-8"
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">{formatSalary(position)}</div>
                        )}
                      </TableCell>

                      {/* Количество ставок */}
                      <TableCell>
                        {isEditing ? (
                          <Select 
                            value={editData.positionsCount.toString()} 
                            onValueChange={(value) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { ...prev[position.id], positionsCount: parseInt(value) } 
                            }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-center font-medium text-foreground">{position.positionsCount}</div>
                        )}
                      </TableCell>

                      {/* Тип оплат */}
                      <TableCell>
                        {isEditing ? (
                          <Select 
                            value={editData.paymentType} 
                            onValueChange={(value) => setEditingPositions(prev => ({ 
                              ...prev, 
                              [position.id]: { 
                                ...prev[position.id], 
                                paymentType: value,
                                hourlyRate: value === "salary" ? "" : editData.hourlyRate,
                                monthlySalary: value === "hourly" ? "" : editData.monthlySalary
                              } 
                            }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="salary">Оклад</SelectItem>
                              <SelectItem value="hourly">Почасовая</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">{getPaymentTypeLabel(position.paymentType)}</div>
                        )}
                      </TableCell>

                      {/* Действия */}
                      {canEdit && (
                        <TableCell>
                          {isEditing ? (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleSavePosition(position.id)}
                                data-testid={`save-position-${position.id}`}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleCancelEdit(position.id)}
                                data-testid={`cancel-position-${position.id}`}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditPosition(position)}
                              data-testid={`edit-position-${position.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {filteredPositions.length === 0 && Object.keys(editingPositions).filter(id => id.startsWith('new-')).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input for import */}
      <input
        ref={staffingFileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  );
}