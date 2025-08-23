import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useObjectStore } from "@/lib/object-store";
import { Employee, Object as ObjectType } from "@shared/schema";
import { Users, Building2, UserCheck, UserX, Clock } from "lucide-react";

export default function Staffing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { selectedObjectId } = useObjectStore();

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedObjectId],
    queryFn: () => {
      const url = selectedObjectId ? `/api/employees?objectId=${selectedObjectId}` : '/api/employees';
      return fetch(url).then(res => res.json());
    },
  });

  const selectedObject = objects.find(obj => obj.id === selectedObjectId);

  // Filter employees based on search and status
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group employees by status and position
  const activeEmployees = filteredEmployees.filter(emp => emp.status === "active");
  const notRegisteredEmployees = filteredEmployees.filter(emp => emp.status === "not_registered");
  const firedEmployees = filteredEmployees.filter(emp => emp.status === "fired");

  // Group by positions for organizational chart
  const groupByPosition = (emps: Employee[]) => {
    return emps.reduce((acc, emp) => {
      if (!acc[emp.position]) {
        acc[emp.position] = [];
      }
      acc[emp.position].push(emp);
      return acc;
    }, {} as Record<string, Employee[]>);
  };

  const activeByPosition = groupByPosition(activeEmployees);
  const notRegisteredByPosition = groupByPosition(notRegisteredEmployees);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Активен</Badge>;
      case "not_registered":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Не оформлен</Badge>;
      case "fired":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Уволен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  if (!selectedObjectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Выберите объект</h3>
            <p className="text-sm text-muted-foreground">Для просмотра штатного расписания выберите объект в заголовке</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Штатное расписание</h1>
          {selectedObject && (
            <p className="text-muted-foreground">{selectedObject.name}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Поиск по имени или должности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="status-filter">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="not_registered">Не оформленные</SelectItem>
              <SelectItem value="fired">Уволенные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Не оформленные</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{notRegisteredEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уволенные</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{firedEmployees.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees by Position */}
      {Object.keys(activeByPosition).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Активные сотрудники
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(activeByPosition).map(([position, emps]) => (
              <div key={position} className="space-y-3">
                <h3 className="font-medium text-base text-foreground border-b pb-2">
                  {position} ({emps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {emps.map((emp) => (
                    <div key={emp.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{emp.name}</p>
                          <div className="flex gap-2 mt-2">
                            {getStatusBadge(emp.status)}
                            {getWorkScheduleBadge(emp.workSchedule)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Not Registered Employees by Position */}
      {Object.keys(notRegisteredByPosition).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Не оформленные сотрудники
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(notRegisteredByPosition).map(([position, emps]) => (
              <div key={position} className="space-y-3">
                <h3 className="font-medium text-base text-foreground border-b pb-2">
                  {position} ({emps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {emps.map((emp) => (
                    <div key={emp.id} className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{emp.name}</p>
                          <div className="flex gap-2 mt-2">
                            {getStatusBadge(emp.status)}
                            {getWorkScheduleBadge(emp.workSchedule)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fired Employees */}
      {firedEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Уволенные сотрудники ({firedEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {firedEmployees.map((emp) => (
                <div key={emp.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/20 opacity-75">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                      {emp.terminationDate && (
                        <p className="text-xs text-red-600 mt-1">
                          Уволен: {emp.terminationDate}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(emp.status)}
                        {getWorkScheduleBadge(emp.workSchedule)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сотрудники не найдены</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter
                ? "Попробуйте изменить параметры поиска или фильтра"
                : "В выбранном объекте пока нет сотрудников"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}