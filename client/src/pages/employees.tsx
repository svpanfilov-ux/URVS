import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmployeeModal } from "@/components/modals/employee-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Employee, Position } from "@shared/schema";
import type { Object as ObjectType } from "@shared/schema";

// Type for employee/vacancy row in the table
type EmployeeRow = {
  id: string;
  type: 'employee' | 'vacancy';
  employee?: Employee;
  position?: Position;
  name: string;
  positionTitle: string;
  objectId: string;
  workSchedule: string;
  status: string;
};
import { useObjectStore } from "@/lib/object-store";
import { Plus, Upload, Download, Edit, Trash2, Search, FileSpreadsheet } from "lucide-react";

export default function Employees() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedObjectId } = useObjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedObjectId],
    queryFn: () => {
      const url = selectedObjectId ? `/api/employees?objectId=${selectedObjectId}` : '/api/employees';
      return fetch(url).then(res => res.json());
    },
  });

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: positions = [], isLoading: isPositionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions", selectedObjectId],
    enabled: !!selectedObjectId,
    queryFn: () => fetch(`/api/positions?objectId=${selectedObjectId}`).then(r => r.json()),
  });

  // Create combined rows for employees and vacancies
  const createEmployeeRows = (): EmployeeRow[] => {
    const rows: EmployeeRow[] = [];
    
    // Filter positions based on selected object if manager role
    const filteredPositions = positions.filter(position => {
      if (selectedObjectId) {
        return position.objectId === selectedObjectId;
      }
      return true;
    });

    // Create rows for each position
    filteredPositions.forEach(position => {
      // Check how many positions are needed for this position type
      const positionsNeeded = position.positionsCount || 1;
      
      // Find employees assigned to this position
      const assignedEmployees = employees.filter(emp => 
        emp.position === position.title && 
        emp.objectId === position.objectId &&
        emp.status !== 'fired'
      );
      
      // Add employee rows for assigned employees
      assignedEmployees.forEach(employee => {
        rows.push({
          id: employee.id,
          type: 'employee',
          employee,
          position,
          name: employee.name,
          positionTitle: employee.position || 'Не указано',
          objectId: employee.objectId || '',
          workSchedule: employee.workSchedule || position.workSchedule || '5/2',
          status: employee.status
        });
      });
      
      // Add vacancy rows for unassigned positions
      const vacanciesNeeded = Math.max(0, positionsNeeded - assignedEmployees.length);
      for (let i = 0; i < vacanciesNeeded; i++) {
        rows.push({
          id: `vacancy-${position.id}-${i}`,
          type: 'vacancy',
          position,
          name: 'Вакансия',
          positionTitle: position.title,
          objectId: position.objectId,
          workSchedule: position.workSchedule || '5/2',
          status: 'vacancy'
        });
      }
    });

    return rows.sort((a, b) => {
      // Sort by position title first, then employees before vacancies
      if (a.positionTitle !== b.positionTitle) {
        return a.positionTitle.localeCompare(b.positionTitle, 'ru');
      }
      if (a.type !== b.type) {
        return a.type === 'employee' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'ru');
    });
  };

  const employeeRows = createEmployeeRows();

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", selectedObjectId] });
      toast({ title: "Сотрудник добавлен успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при добавлении сотрудника", variant: "destructive" });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", selectedObjectId] });
      toast({ title: "Сотрудник обновлён успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при обновлении сотрудника", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", selectedObjectId] });
      toast({ title: "Сотрудник удалён успешно" });
    },
    onError: () => {
      toast({ title: "Ошибка при удалении сотрудника", variant: "destructive" });
    },
  });

  const handleSaveEmployee = (data: any) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
    setEditingEmployee(null);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этого сотрудника?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const handleExportCSV = () => {
    window.open("/api/employees/export/csv", "_blank");
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/employees', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка импорта';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {
          // Fallback if response is not JSON
          errorMessage = `Ошибка сервера: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast({ 
        title: "Импорт завершён", 
        description: `Импортировано сотрудников: ${result.employeesCount || 'неизвестно'}` 
      });

      // Обновляем кэш сотрудников
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", selectedObjectId] });
      
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

  // Filter employee rows (employees and vacancies)
  const filteredEmployeeRows = employeeRows.filter((row: EmployeeRow) => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Remove grouping - use all filtered employees

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Активный", className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
      not_registered: { label: "Подработка", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
      fired: { label: "Уволен", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
      vacancy: { label: "Вакансия", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.active;
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  // Single table component without grouping  
  const EmployeeTable = ({ rows }: { rows: EmployeeRow[] }) => (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          Должности и сотрудники
          <Badge variant="outline">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ФИО</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Должность</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Объект</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">График работы</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const rowObject = objects.find(obj => obj.id === row.objectId);
                const isVacancy = row.type === 'vacancy';
                return (
                  <tr key={row.id} className={`hover:bg-muted/50 ${isVacancy ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`} data-testid={`row-${row.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        isVacancy ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'
                      }`}>{row.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        isVacancy ? 'text-orange-500 dark:text-orange-300' : 'text-muted-foreground'
                      }`}>{row.positionTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground" data-testid={`row-object-${row.id}`}>
                        {rowObject?.name || "Не указан"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {row.workSchedule || "5/2"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!isVacancy ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(row.employee!)}
                            data-testid={`edit-employee-${row.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(row.id)}
                            data-testid={`delete-employee-${row.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-orange-500 dark:text-orange-400">
                          Требуется найм
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Управление сотрудниками</h2>
          <p className="text-muted-foreground">Добавление, редактирование и управление персоналом</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
            data-testid="add-employee"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить сотрудника
          </Button>
          <Button 
            onClick={handleImportCSV}
            variant="outline"
            disabled={isImporting}
            data-testid="import-csv"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isImporting ? "Импорт CSV..." : "Импорт CSV"}
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            data-testid="export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Format Description */}
      <Card>
        <CardHeader>
          <CardTitle>Формат файла для импорта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Заголовки CSV:</strong> Объект;Сотрудник;Должность;статус;Дата приема;Дата увольнения</p>
            <p><strong>Пример:</strong> ТЦ Европа;Иван Иванов;Менеджер;Активный;2024-01-15;2024-12-31</p>
            <p><strong>Статусы:</strong> Активный, Неактивный, Уволен</p>
            <p><strong>Даты:</strong> Формат ГГГГ-ММ-ДД или оставьте пустым</p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Поиск по ФИО..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-employees"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-status">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="not_registered">Подработка</SelectItem>
                <SelectItem value="fired">Уволен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        className="hidden"
        data-testid="file-input-employees"
      />

      {/* Employee Table */}
      {isLoading || isPositionsLoading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <EmployeeTable rows={filteredEmployeeRows} />
      )}

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />
    </div>
  );
}
