import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmployeeModal } from "@/components/modals/employee-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Employee } from "@shared/schema";
import { Plus, Upload, Download, Edit, Trash2, Search } from "lucide-react";

export default function Employees() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
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
    // TODO: Implement CSV import functionality
    toast({ title: "Функция импорта CSV будет добавлена", variant: "default" });
  };

  // Filter employees
  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group employees by status
  const activeEmployees = filteredEmployees.filter((emp: Employee) => emp.status === "active");
  const partTimeEmployees = filteredEmployees.filter((emp: Employee) => emp.status === "not_registered");
  const firedEmployees = filteredEmployees.filter((emp: Employee) => emp.status === "fired");

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Активный", className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
      not_registered: { label: "Подработка", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
      fired: { label: "Уволен", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.active;
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const EmployeeTable = ({ employees, title, totalHours }: { employees: Employee[], title: string, totalHours?: string }) => (
    <Card className="mb-6">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">{employees.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ФИО</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Должность</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/50" data-testid={`employee-row-${employee.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                        data-testid={`edit-employee-${employee.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        data-testid={`delete-employee-${employee.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalHours && (
          <div className="px-6 py-3 bg-muted/30 border-t">
            <div className="text-sm text-muted-foreground">
              Итого часов по группе: <span className="font-medium">{totalHours}</span>
            </div>
          </div>
        )}
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
            data-testid="import-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Импорт CSV
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            data-testid="export-csv"
          >
            <Upload className="h-4 w-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

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

      {/* Employee Tables */}
      {isLoading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <>
          <EmployeeTable 
            employees={activeEmployees} 
            title="Активные сотрудники" 
            totalHours="3,840 ч"
          />
          <EmployeeTable 
            employees={partTimeEmployees} 
            title="Подработка" 
            totalHours="240 ч"
          />
          {firedEmployees.length > 0 && (
            <EmployeeTable 
              employees={firedEmployees} 
              title="Уволенные"
            />
          )}
        </>
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
