import { Clock, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Clock className="text-green-600 text-2xl" />
            <h1 className="text-xl font-semibold text-foreground">
              Система управления рабочим временем
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <span className="text-xs text-muted-foreground">(Менеджер)</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="logout-button"
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
