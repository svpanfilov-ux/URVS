import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Building, Users, Shield, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface DemoAccount {
  username: string;
  password: string;
  role: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive" | "outline";
}

const demoAccounts: DemoAccount[] = [
  {
    username: "admin",
    password: "admin", 
    role: "hr_economist",
    name: "Экономист по з/п",
    description: "Администратор системы, управление пользователями, бюджетами, отчетами",
    icon: <Shield className="h-4 w-4" />,
    variant: "default"
  },
  {
    username: "director",
    password: "director",
    role: "director", 
    name: "Директор",
    description: "Просмотр дашборда по всем объектам, финансовая аналитика",
    icon: <Eye className="h-4 w-4" />,
    variant: "destructive"
  },
  {
    username: "manager1",
    password: "manager1",
    role: "object_manager",
    name: "Менеджер объекта",
    description: "Управление сотрудниками, табелем, штатным расписанием объекта",
    icon: <Building className="h-4 w-4" />,
    variant: "secondary"
  },
  {
    username: "groupmgr", 
    password: "groupmgr",
    role: "group_manager",
    name: "Руководитель группы",
    description: "Контроль объектов подчиненных менеджеров",
    icon: <Users className="h-4 w-4" />,
    variant: "outline"
  }
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      setError(error.message || "Ошибка входа в систему");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  const handleDemoLogin = (account: DemoAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
    loginMutation.mutate({ username: account.username, password: account.password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Вход в УРВС
            </CardTitle>
            <p className="text-muted-foreground">Система управления рабочим временем</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  required
                  data-testid="input-username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  data-testid="input-password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 animate-spin" />
                    Вход...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Войти
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Демо-аккаунты</CardTitle>
            <p className="text-muted-foreground">Выберите роль для быстрого входа</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoAccounts.map((account) => (
              <div 
                key={account.username}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleDemoLogin(account)}
                data-testid={`demo-${account.role}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {account.icon}
                    <h3 className="font-medium">{account.name}</h3>
                  </div>
                  <Badge variant={account.variant} className="text-xs">
                    {account.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{account.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Логин: <code className="bg-muted px-1 rounded">{account.username}</code></span>
                  <span>Пароль: <code className="bg-muted px-1 rounded">{account.password}</code></span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}