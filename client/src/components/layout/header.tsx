import { Clock, LogOut, Building } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Object } from "@shared/schema";
import { useObjectStore } from "@/lib/object-store";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { selectedObjectId, setSelectedObjectId } = useObjectStore();
  const { user, logout } = useAuth();

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
              УРВС - {user?.name || "Пользователь"} ({user?.role})
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Object Selector - только если пользователь может работать с объектами */}
            {(user?.role === "object_manager" || user?.role === "group_manager" || user?.role === "hr_economist") && (
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
            )}
            
            <ThemeToggle />
            
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выход
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}