import { Clock, LogOut, Building } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Object } from "@shared/schema";
import { useObjectStore } from "@/lib/object-store";

export function Header() {
  const { user, logout } = useAuth();
  const { selectedObjectId, setSelectedObjectId } = useObjectStore();

  const { data: objects = [] } = useQuery<Object[]>({
    queryKey: ["/api/objects"],
  });

  const activeObjects = objects.filter(obj => obj.isActive);

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
            {/* Object Selector */}
            <Select value={selectedObjectId || ""} onValueChange={(value) => setSelectedObjectId(value || null)}>
              <SelectTrigger className="w-64" data-testid="object-selector">
                <SelectValue placeholder="Выберите объект" />
              </SelectTrigger>
              <SelectContent className="w-64">
                {activeObjects.map((object) => (
                  <SelectItem key={object.id} value={object.id}>
                    {object.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
