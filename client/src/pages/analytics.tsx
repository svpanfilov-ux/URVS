import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSkeleton } from "@/components/skeletons/analytics-skeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye, TrendingUp, Building, Users, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Object, Employee } from "@shared/schema";

interface ObjectAnalytics {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  activeEmployees: number;
  plannedHours: number;
  actualHours: number;
  efficiency: number;
  budgetPlanned: number;
  budgetActual: number;
  budgetStatus: "under" | "over" | "on_track";
}

export default function Analytics() {
  const { user } = useAuth();

  const { data: objects = [], isLoading: objectsLoading } = useQuery<Object[]>({
    queryKey: ["/api/objects"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const isLoading = objectsLoading || employeesLoading;
  const hasData = objects.length > 0 || employees.length > 0;
  const showSkeleton = useDelayedLoading(isLoading, hasData, 10);

  // Фиктивная аналитика для демонстрации - в реальной системе это бы приходило с API
  const generateAnalytics = (): ObjectAnalytics[] => {
    return objects.filter(obj => obj.isActive).map(object => {
      const objectEmployees = employees.filter(emp => emp.objectId === object.id);
      const activeCount = objectEmployees.filter(emp => emp.status === "active").length;
      
      // Мок данные для демонстрации концепции
      const plannedHours = activeCount * 160; // 160 часов в месяц на сотрудника
      const actualHours = Math.round(plannedHours * (0.85 + Math.random() * 0.3));
      const efficiency = Math.round((actualHours / plannedHours) * 100);
      
      const budgetPlanned = activeCount * 50000; // 50к на сотрудника
      const budgetActual = Math.round(budgetPlanned * (0.9 + Math.random() * 0.2));
      
      let budgetStatus: "under" | "over" | "on_track" = "on_track";
      if (budgetActual < budgetPlanned * 0.95) budgetStatus = "under";
      if (budgetActual > budgetPlanned * 1.05) budgetStatus = "over";

      return {
        id: object.id,
        name: object.name,
        code: object.code,
        employeeCount: objectEmployees.length,
        activeEmployees: activeCount,
        plannedHours,
        actualHours,
        efficiency,
        budgetPlanned,
        budgetActual,
        budgetStatus
      };
    });
  };

  const analytics = generateAnalytics();
  const totalEmployees = analytics.reduce((sum, obj) => sum + obj.activeEmployees, 0);
  const totalPlannedHours = analytics.reduce((sum, obj) => sum + obj.plannedHours, 0);
  const totalActualHours = analytics.reduce((sum, obj) => sum + obj.actualHours, 0);
  const totalBudgetPlanned = analytics.reduce((sum, obj) => sum + obj.budgetPlanned, 0);
  const totalBudgetActual = analytics.reduce((sum, obj) => sum + obj.budgetActual, 0);
  const overallEfficiency = Math.round((totalActualHours / totalPlannedHours) * 100);

  const getBudgetVariant = (status: string) => {
    switch (status) {
      case "under": return "secondary";
      case "over": return "destructive";
      default: return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  if (showSkeleton) {
    return <AnalyticsSkeleton />;
  }

  if (user?.role !== "director" && user?.role !== "hr_economist") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Доступ ограничен</h3>
          <p className="text-sm text-muted-foreground">Раздел аналитики доступен только директору и HR-экономисту</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика</h1>
          <p className="text-muted-foreground">Сводный отчет по всем объектам компании</p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Август 2025</span>
        </div>
      </div>

      {/* Общие показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные объекты</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
            <p className="text-xs text-muted-foreground">из {objects.length} всего</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">по всем объектам</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Эффективность</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              {totalActualHours} из {totalPlannedHours} часов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Исполнение бюджета</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((totalBudgetActual / totalBudgetPlanned) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalBudgetActual)} из {formatCurrency(totalBudgetPlanned)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детализация по объектам */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация по объектам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((obj) => (
              <div 
                key={obj.id} 
                className="p-4 border rounded-lg"
                data-testid={`object-analytics-${obj.code}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{obj.name}</h3>
                    <p className="text-sm text-muted-foreground">{obj.code}</p>
                  </div>
                  <Badge 
                    variant={getBudgetVariant(obj.budgetStatus) as any}
                    data-testid={`budget-status-${obj.code}`}
                  >
                    {obj.budgetStatus === "under" && "Экономия"}
                    {obj.budgetStatus === "over" && "Перерасход"}
                    {obj.budgetStatus === "on_track" && "В рамках бюджета"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Сотрудники</p>
                    <p className="font-medium">{obj.activeEmployees} активных</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Эффективность</p>
                    <p className="font-medium">{obj.efficiency}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Часы план/факт</p>
                    <p className="font-medium">{obj.actualHours}/{obj.plannedHours}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Бюджет</p>
                    <p className="font-medium">{formatCurrency(obj.budgetActual)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}