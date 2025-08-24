import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useObjectStore } from "@/lib/object-store";
import { Position, Object as ObjectType } from "@shared/schema";
import { Users, Building2, Clock, Briefcase, DollarSign, CalendarDays, Plus, Edit, Trash2 } from "lucide-react";

export default function Staffing() {
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedObjectId } = useObjectStore();

  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", selectedObjectId],
    queryFn: () => {
      const url = selectedObjectId ? `/api/positions?objectId=${selectedObjectId}` : '/api/positions';
      return fetch(url).then(res => res.json());
    },
  });

  const selectedObject = objects.find(obj => obj.id === selectedObjectId);

  // Filter positions based on search
  const filteredPositions = positions.filter(pos => {
    const matchesSearch = pos.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
      return `${position.hourlyRate} ₽/час`;
    } else if (position.paymentType === "salary" && position.monthlySalary) {
      return `${position.monthlySalary.toLocaleString()} ₽/мес`;
    }
    return "Не указано";
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
              placeholder="Поиск должностей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="search-input"
            />
          </div>
          <Button variant="default" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить должность
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">Оклад</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredPositions.filter(pos => pos.paymentType === "salary").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions List */}
      {filteredPositions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Должности ({filteredPositions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPositions.map((position) => (
                <div key={position.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-base text-foreground mb-2">
                        {position.title}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {getWorkScheduleBadge(position.workSchedule)}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {formatSalary(position)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={position.paymentType === "hourly" ? "secondary" : "default"} 
                            className="text-xs"
                          >
                            {position.paymentType === "hourly" ? "Почасовая" : "Оклад"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? "Должности не найдены" : "Штатное расписание пусто"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Попробуйте изменить поисковый запрос"
                : "Добавьте должности для этого объекта"}
            </p>
            <Button variant="default" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Добавить первую должность
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}