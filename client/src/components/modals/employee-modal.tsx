import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Employee } from "@shared/schema";

const employeeSchema = z.object({
  name: z.string().min(1, "ФИО обязательно"),
  position: z.string().min(1, "Должность обязательна"),
  status: z.enum(["active", "not_registered", "fired"]),
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

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      position: "",
      status: "active",
      terminationDate: "",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        position: employee.position,
        status: employee.status as "active" | "not_registered" | "fired",
        terminationDate: employee.terminationDate || "",
      });
      setShowTerminationDate(employee.status === "fired");
    } else {
      form.reset({
        name: "",
        position: "",
        status: "active",
        terminationDate: "",
      });
      setShowTerminationDate(false);
    }
  }, [employee, form]);

  const watchStatus = form.watch("status");

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent data-testid="employee-modal">
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
                  <FormLabel>ФИО</FormLabel>
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
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Должность</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите должность" 
                      data-testid="input-employee-position"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-employee-status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="not_registered">Подработка</SelectItem>
                      <SelectItem value="fired">Уволен</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
