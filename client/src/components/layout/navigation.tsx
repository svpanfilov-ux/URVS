import { 
  Home, 
  Users, 
  UserCheck,
  Calendar, 
  FileText, 
  Settings 
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "dashboard", label: "Главное", icon: Home, path: "/" },
  { id: "employees", label: "Сотрудники", icon: Users, path: "/employees" },
  { id: "staffing", label: "Штатное расписание", icon: UserCheck, path: "/staffing" },
  { id: "timesheet", label: "Табель", icon: Calendar, path: "/timesheet" },
  { id: "reports", label: "Отчёты", icon: FileText, path: "/reports" },
  { id: "settings", label: "Настройки", icon: Settings, path: "/settings" },
];

export function Navigation() {
  const [location, navigate] = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                data-testid={`nav-${item.id}`}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4 mr-2 inline" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
