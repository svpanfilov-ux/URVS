import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useObjectStore } from "@/lib/object-store";
import { useAuth } from "@/hooks/useAuth";
import { Position, Object as ObjectType, insertPositionSchema, InsertPosition } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Building2, Clock, Briefcase, CalendarDays, Plus, Edit, Trash2, Upload, FileSpreadsheet, Search } from "lucide-react";

const positionFormSchema = insertPositionSchema.extend({
  objectId: z.string().min(1, "Выберите объект"),
});

export default function Staffing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjectFilter, setSelectedObjectFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const staffingFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { selectedObjectId } = useObjectStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user can edit staffing (only HR economist can edit)
  const canEdit = user?.role === "hr_economist";

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const form = useForm<z.infer<typeof positionFormSchema>>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      objectId: "",
      title: "",
      workSchedule: "5/2",
      paymentType: "salary",
      hourlyRate: null,
      monthlySalary: null,
      positionsCount: 1,
      isActive: true,
    },
  });

  // Get work schedules for selected object
  const selectedObjectIdForSchedules = form.watch("objectId");
  const { data: workSchedules = [] } = useQuery<string[]>({
    queryKey: ["/api/objects", selectedObjectIdForSchedules, "work-schedules"],
    queryFn: () => {
      if (!selectedObjectIdForSchedules) return Promise.resolve([]);
      return fetch(`/api/objects/${selectedObjectIdForSchedules}/work-schedules`).then(res => res.json());
    },
    enabled: !!selectedObjectIdForSchedules,
  });

  const createPositionMutation = useMutation({
    mutationFn: async (data: InsertPosition) => {
      const response = await apiRequest("POST", "/api/positions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Должность добавлена" });
    },
    onError: () => {
      toast({ title: "Ошибка при добавлении должности", variant: "destructive" });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPosition> }) => {
      const response = await apiRequest("PUT", `/api/positions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      setIsDialogOpen(false);
      setEditingPosition(null);
      form.reset();
      toast({ title: "Должность обновлена" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении должности", variant: "destructive" });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Должность удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении должности", variant: "destructive" });
    },
  });

  // Filter positions based on search and object
  const filteredPositions = positions.filter(pos => {
    const matchesSearch = pos.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObject = selectedObjectFilter === "all" || pos.objectId === selectedObjectFilter;
    return matchesSearch && matchesObject;
  });

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.reset({
      objectId: position.objectId,
      title: position.title,
      workSchedule: position.workSchedule,
      paymentType: position.paymentType,
      hourlyRate: position.hourlyRate,
      monthlySalary: position.monthlySalary,
      positionsCount: position.positionsCount,
      isActive: position.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту должность?")) {
      deletePositionMutation.mutate(id);
    }
  };

  const onSubmit = (data: z.infer<typeof positionFormSchema>) => {
    if (editingPosition) {
      updatePositionMutation.mutate({
        id: editingPosition.id,
        data,
      });
    } else {
      createPositionMutation.mutate(data);
    }
  };

  const handleStaffingImportClick = () => {
    staffingFileInputRef.current?.click();
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

  const getObjectName = (objectId: string) => {
    const object = objects.find(obj => obj.id === objectId);
    return object?.name || "Неизвестный объект";
  };

  const getWorkScheduleBadge = (schedule: string) => {
    const scheduleMap: Record<string, string> = {
      "5/2": "5/2",
      "2/2": "2/2", 
      "3/3": "3/3",
      "6/1": "6/1",
      "вахта": "Вахта"
    };
    return <Badge variant="outline" className="text-xs">{scheduleMap[schedule] || schedule}</Badge>;
  };

  const formatSalary = (position: Position) => {
    if (position.paymentType === "hourly" && position.hourlyRate) {
      return `${(position.hourlyRate / 100).toFixed(2)} ₽/час`;
    } else if (position.paymentType === "salary" && position.monthlySalary) {
      return `${position.monthlySalary.toLocaleString()} ₽/мес`;
    }
    return "Не указано";
  };

  // Calculate totals
  const totalPositions = filteredPositions.reduce((sum, pos) => sum + pos.positionsCount, 0);
  const totalSalaryBudget = filteredPositions.reduce((sum, pos) => {
    if (pos.paymentType === "salary" && pos.monthlySalary) {
      return sum + (pos.monthlySalary * pos.positionsCount);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Штатное расписание</h1>
          <p className="text-muted-foreground">Управление должностями и позициями по объектам</p>
        </div>
        {canEdit && (
          <div className="flex items-center space-x-2">
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
              variant="outline"
              data-testid="button-import-staffing"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {isImporting ? "Импорт..." : "Импорт CSV"}
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-position">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить должность
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPosition ? "Редактировать должность" : "Добавить должность"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPosition ? "Изменить параметры существующей должности" : "Создать новую должность в штатном расписании"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="objectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Объект</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-position-object">
                                <SelectValue placeholder="Выберите объект" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {objects.map((object) => (
                                <SelectItem key={object.id} value={object.id}>
                                  {object.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Должность</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название должности" {...field} data-testid="input-position-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workSchedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>График работы</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-position-schedule">
                                <SelectValue placeholder="Выберите график работы" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workSchedules.length > 0 ? (
                                workSchedules.map((schedule) => (
                                  <SelectItem key={schedule} value={schedule}>
                                    {schedule === "вахта" ? "вахта (7/0)" : schedule}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="5/2">5/2</SelectItem>
                                  <SelectItem value="2/2">2/2</SelectItem>
                                  <SelectItem value="3/3">3/3</SelectItem>
                                  <SelectItem value="6/1">6/1</SelectItem>
                                  <SelectItem value="вахта">вахта (7/0)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип оплаты</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="salary">Оклад</SelectItem>
                              <SelectItem value="hourly">Почасовая</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("paymentType") === "salary" && (
                      <FormField
                        control={form.control}
                        name="monthlySalary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Месячный оклад (₽)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="50000" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                data-testid="input-monthly-salary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("paymentType") === "hourly" && (
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Почасовая ставка (₽)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="300.00" 
                                {...field}
                                value={field.value ? (field.value / 100).toFixed(2) : ""}
                                onChange={(e) => field.onChange(e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                                data-testid="input-hourly-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="positionsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Количество позиций</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="1" 
                              {...field}
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-positions-count"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingPosition(null);
                          form.reset();
                        }}
                        data-testid="button-cancel-position"
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPositionMutation.isPending || updatePositionMutation.isPending}
                        data-testid="button-save-position"
                      >
                        {editingPosition ? "Сохранить" : "Добавить"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры и поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Поиск по должности</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Введите название должности..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-positions"
                />
              </div>
            </div>

            <div>
              <Label>Объект</Label>
              <Select value={selectedObjectFilter} onValueChange={setSelectedObjectFilter}>
                <SelectTrigger data-testid="select-filter-object">
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

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedObjectFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего должностей</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPositions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего позиций</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalPositions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Почасовая оплата</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredPositions.filter(pos => pos.paymentType === "hourly").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Месячный ФОТ</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalSalaryBudget.toLocaleString()} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Должности ({filteredPositions.length})</CardTitle>
          <CardDescription>
            Полный список должностей и их характеристики
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Должность</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>График</TableHead>
                <TableHead>Тип оплаты</TableHead>
                <TableHead>Тариф</TableHead>
                <TableHead className="text-center">Количество</TableHead>
                {canEdit && <TableHead className="text-right">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.id} data-testid={`position-row-${position.id}`}>
                  <TableCell className="font-medium">{position.title}</TableCell>
                  <TableCell>{getObjectName(position.objectId)}</TableCell>
                  <TableCell>{getWorkScheduleBadge(position.workSchedule)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={position.paymentType === "hourly" ? "secondary" : "default"} 
                      className="text-xs"
                    >
                      {position.paymentType === "hourly" ? "Почасовая" : "Оклад"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatSalary(position)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {position.positionsCount}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(position)}
                          data-testid={`button-edit-${position.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(position.id)}
                          data-testid={`button-delete-${position.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredPositions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Должности не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}