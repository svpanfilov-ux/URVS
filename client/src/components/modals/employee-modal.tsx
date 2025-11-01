import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Employee, Position, Object as ObjectType } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useObjectStore } from "@/lib/object-store";

const employeeSchema = z.object({
  name: z.string().min(1, "ФИО обязательно"),
  objectId: z.string().min(1, "Объект обязателен"),
  position: z.string().min(1, "Должность обязательна"),
  status: z.enum(["active", "not_registered", "fired"]),
  workSchedule: z.enum(["5/2", "2/2", "3/3", "6/1", "вахта (7/0)"]),
  paymentType: z.enum(["hourly", "salary"]),
  hourlyRate: z.number().optional(),
  monthlySalary: z.number().optional(),
  paymentMethod: z.enum(["card", "cash"]),
  terminationDate: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => void;
  employee?: Employee | null;
}

export function EmployeeModal({ isOpen, onClose, onSave, employee }: EmployeeModalProps) {
  const [showTerminationDate, setShowTerminationDate] = useState(false);
  const { user } = useAuth();
  const { selectedObjectId } = useObjectStore();

  // Загрузка объектов
  const { data: objects = [] } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  // Фильтрация объектов для менеджера
  const availableObjects = user?.role === "manager"
    ? objects.filter(obj => obj.managerId === user.id)
    : objects.filter(obj => obj.status === "active");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      objectId: "",
      position: "",
      status: "active",
      workSchedule: "5/2",
      paymentType: "hourly",
      hourlyRate: undefined,
      monthlySalary: undefined,
      paymentMethod: "card",
      terminationDate: "",
    },
  });

  const watchObjectId = form.watch("objectId");

  // Загрузка должностей для выбранного объекта
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", watchObjectId],
    enabled: !!watchObjectId,
    queryFn: () => fetch(`/api/positions?objectId=${watchObjectId}`).then(r => r.json()),
  });

  // Автозаполнение при первом открытии для менеджера
  useEffect(() => {
    if (isOpen && !employee && user?.role === "manager" && selectedObjectId) {
      form.setValue("objectId", selectedObjectId);
    }
  }, [isOpen, employee, user, selectedObjectId, form]);

  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        objectId: employee.objectId || "",
        position: employee.position,
        status: employee.status as "active" | "not_registered" | "fired",
        workSchedule: (employee.workSchedule || "5/2") as "5/2" | "2/2" | "3/3" | "6/1" | "вахта (7/0)",
        paymentType: (employee.paymentType || "hourly") as "hourly" | "salary",
        hourlyRate: employee.hourlyRate || undefined,
        monthlySalary: employee.monthlySalary || undefined,
        paymentMethod: (employee.paymentMethod || "card") as "card" | "cash",
        terminationDate: employee.terminationDate || "",
      });
      setShowTerminationDate(employee.status === "fired");
    } else {
      const defaultObjectId = user?.role === "manager" && selectedObjectId ? selectedObjectId : "";
      form.reset({
        name: "",
        objectId: defaultObjectId,
        position: "",
        status: "active",
        workSchedule: "5/2",
        paymentType: "hourly",
        hourlyRate: undefined,
        monthlySalary: undefined,
        paymentMethod: "card",
        terminationDate: "",
      });
      setShowTerminationDate(false);
    }
  }, [employee, form, isOpen, user, selectedObjectId]);

  const watchStatus = form.watch("status");
  const watchPosition = form.watch("position");

  // Автоматическое заполнение данных из должности
  useEffect(() => {
    if (watchPosition && positions.length > 0) {
      const selectedPosition = positions.find(p => p.title === watchPosition);
      if (selectedPosition) {
        // Всегда обновляем данные из выбранной должности
        form.setValue("workSchedule", selectedPosition.workSchedule as any);
        form.setValue("paymentType", selectedPosition.paymentType as any);
        if (selectedPosition.paymentType === "hourly") {
          form.setValue("hourlyRate", selectedPosition.hourlyRate || undefined);
          form.setValue("monthlySalary", undefined);
        } else {
          form.setValue("monthlySalary", selectedPosition.monthlySalary || undefined);
          form.setValue("hourlyRate", undefined);
        }
      }
    }
  }, [watchPosition, positions, form]);

  useEffect(() => {
    setShowTerminationDate(watchStatus === "fired");
    if (watchStatus !== "fired") {
      form.setValue("terminationDate", "");
    }
  }, [watchStatus, form]);

  const onSubmit = (data: EmployeeFormData) => {
    onSave(data);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const watchPaymentType = form.watch("paymentType");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="employee-modal">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Редактировать сотрудника" : "Добавить сотрудника"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите ФИО" 
                      data-testid="input-employee-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Объект *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={user?.role === "manager"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-object">
                        <SelectValue placeholder="Выберите объект" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableObjects.map(obj => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Должность *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!watchObjectId || positions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-position">
                        <SelectValue placeholder={
                          !watchObjectId 
                            ? "Сначала выберите объект" 
                            : positions.length === 0 
                              ? "Нет доступных должностей" 
                              : "Выберите должность"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.title}>
                          {pos.title} ({pos.paymentType === "salary" 
                            ? `${pos.monthlySalary} ₽/мес` 
                            : `${pos.hourlyRate} ₽/час`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {!watchObjectId && (
                    <p className="text-sm text-muted-foreground">
                      Выберите объект, чтобы увидеть доступные должности из штатного расписания
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип сотрудника *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-status">
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Штатный (активный)</SelectItem>
                      <SelectItem value="not_registered">Подработчик (не зарегистрирован)</SelectItem>
                      <SelectItem value="fired">Уволен</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    {watchStatus === "active" && "Занимает вакансию, участвует в плановом и фактическом ФОТ"}
                    {watchStatus === "not_registered" && "Не занимает вакансию, учитывается только в фактическом ФОТ"}
                    {watchStatus === "fired" && "Уволенный сотрудник"}
                  </p>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>График работы</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee-schedule">
                          <SelectValue placeholder="Выберите график" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5/2">5/2</SelectItem>
                        <SelectItem value="2/2">2/2</SelectItem>
                        <SelectItem value="3/3">3/3</SelectItem>
                        <SelectItem value="6/1">6/1</SelectItem>
                        <SelectItem value="вахта (7/0)">вахта (7/0)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Можно изменить график для конкретного сотрудника
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип оплаты</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salary">Оклад</SelectItem>
                        <SelectItem value="hourly">Почасовая</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchPaymentType === "salary" && (
              <FormField
                control={form.control}
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Месячный оклад (₽)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        disabled
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Автоматически из должности
                    </p>
                  </FormItem>
                )}
              />
            )}

            {watchPaymentType === "hourly" && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Часовая ставка (₽)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        disabled
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Автоматически из должности
                    </p>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Способ выплаты *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Выберите способ выплаты" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="card">На карту</SelectItem>
                      <SelectItem value="cash">Ведомость</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Используется при формировании отчёта по зарплате
                  </p>
                </FormItem>
              )}
            />

            {showTerminationDate && (
              <FormField
                control={form.control}
                name="terminationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата увольнения</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        data-testid="input-termination-date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                data-testid="button-save-employee"
                className="bg-green-600 hover:bg-green-700"
              >
                Сохранить
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
