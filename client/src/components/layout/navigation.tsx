import { 
  Home, 
  Users, 
  UserCheck,
  Calendar, 
  FileText, 
  Settings,
  Eye,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { id: "dashboard", label: "Главное", icon: Home, path: "/", roles: ["object_manager", "hr_economist", "director", "group_manager"] },
  { id: "staffing", label: "Штатное расписание", icon: UserCheck, path: "/staffing", roles: ["object_manager", "hr_economist", "group_manager"] },
  { id: "employees", label: "Сотрудники", icon: Users, path: "/employees", roles: ["object_manager", "hr_economist", "group_manager"] },
  { id: "timesheet", label: "Табель", icon: Calendar, path: "/timesheet", roles: ["object_manager", "hr_economist", "group_manager"] },
  { id: "reports", label: "Отчёты", icon: FileText, path: "/reports", roles: ["object_manager", "hr_economist", "director", "group_manager"] },
  { id: "analytics", label: "Аналитика", icon: BarChart3, path: "/analytics", roles: ["director", "hr_economist"] },
  { id: "settings", label: "Настройки", icon: Settings, path: "/settings", roles: ["hr_economist"] },
];

export function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = allNavItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <a
                key={item.id}
                href={item.path}
                data-testid={`nav-${item.id}`}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center",
                  isActive
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}