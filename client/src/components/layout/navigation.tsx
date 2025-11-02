import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  Briefcase,
  Building2,
  UserCheck
} from "lucide-react";
import { useLocation, Link } from "wouter";
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
  { id: "dashboard", label: "Главное", icon: Home, path: "/", roles: ["manager", "economist"] },
  { id: "employees", label: "Сотрудники", icon: Users, path: "/employees", roles: ["manager", "economist"] },
  { id: "timesheet", label: "Табель", icon: Calendar, path: "/timesheet", roles: ["manager"] },
  { id: "staffing", label: "Штатное расписание", icon: Briefcase, path: "/staffing", roles: ["manager", "economist"] },
  { id: "objects", label: "Объекты", icon: Building2, path: "/objects", roles: ["economist"] },
  { id: "managers", label: "Менеджеры", icon: UserCheck, path: "/managers", roles: ["economist"] },
  { id: "reports", label: "Отчёты", icon: FileText, path: "/reports", roles: ["manager", "economist"] },
  { id: "settings", label: "Настройки", icon: Settings, path: "/settings", roles: ["economist"] },
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
              <Link
                key={item.id}
                href={item.path}
                data-testid={`nav-${item.id}`}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center cursor-pointer",
                  isActive
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}