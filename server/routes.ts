import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertTimeEntrySchema, insertReportSchema, insertSettingSchema, insertObjectSchema, insertPositionSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Ошибка валидации данных" });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    try {
      const { objectId } = req.query;
      let employees = await storage.getEmployees();
      
      // Filter by object if objectId is provided
      if (objectId && typeof objectId === 'string') {
        employees = employees.filter(employee => employee.objectId === objectId);
      }
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения списка сотрудников" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Сотрудник не найден" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения данных сотрудника" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания сотрудника" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const updateData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, updateData);
      if (!employee) {
        return res.status(404).json({ message: "Сотрудник не найден" });
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Ошибка обновления данных сотрудника" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Сотрудник не найден" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления сотрудника" });
    }
  });

  // Time Entries
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { employeeId, startDate, endDate, month } = req.query;
      
      let finalStartDate = startDate as string;
      let finalEndDate = endDate as string;
      
      // If month parameter is provided (YYYY-MM format), set start and end dates for that month
      if (month) {
        const [year, monthNum] = (month as string).split('-');
        const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0);
        
        finalStartDate = monthStart.toISOString().split('T')[0];
        finalEndDate = monthEnd.toISOString().split('T')[0];
      }
      
      const entries = await storage.getTimeEntries(
        employeeId as string,
        finalStartDate,
        finalEndDate
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения данных табеля" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const entryData = insertTimeEntrySchema.parse(req.body);
      const entry = await storage.createTimeEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания записи времени" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const updateData = insertTimeEntrySchema.partial().parse(req.body);
      const entry = await storage.updateTimeEntry(req.params.id, updateData);
      if (!entry) {
        return res.status(404).json({ message: "Запись времени не найдена" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Ошибка обновления записи времени" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Запись времени не найдена" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Ошибка удаления записи времени" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения отчётов" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания отчёта" });
    }
  });

  app.put("/api/reports/:id/send", async (req, res) => {
    try {
      const report = await storage.updateReport(req.params.id, {
        status: "sent",
        sentAt: new Date()
      });
      if (!report) {
        return res.status(404).json({ message: "Отчёт не найден" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Ошибка отправки отчёта" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения настроек" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingData = insertSettingSchema.parse(req.body);
      const setting = await storage.setSetting(settingData);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Ошибка сохранения настройки" });
    }
  });

  // CSV Export/Import
  app.get("/api/employees/export/csv", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const csvHeader = "ФИО,Должность,Статус,Дата увольнения\n";
      const csvData = employees.map(emp => 
        `"${emp.name}","${emp.position}","${emp.status}","${emp.terminationDate || ''}"`
      ).join("\n");
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка экспорта данных" });
    }
  });

  app.post("/api/employees/import/csv", async (req, res) => {
    try {
      const { employees } = req.body;
      const results = [];
      
      for (const emp of employees) {
        try {
          const employeeData = insertEmployeeSchema.parse(emp);
          const employee = await storage.createEmployee(employeeData);
          results.push({ success: true, employee });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: emp });
        }
      }
      
      res.json({ results });
    } catch (error) {
      res.status(400).json({ message: "Ошибка импорта данных" });
    }
  });

  // Objects routes
  app.get("/api/objects", async (req, res) => {
    try {
      const objects = await storage.getObjects();
      res.json(objects);
    } catch (error) {
      console.error("Error fetching objects:", error);
      res.status(500).json({ message: "Ошибка при загрузке объектов" });
    }
  });

  app.get("/api/objects/:id", async (req, res) => {
    try {
      const object = await storage.getObject(req.params.id);
      if (!object) {
        return res.status(404).json({ message: "Объект не найден" });
      }
      res.json(object);
    } catch (error) {
      console.error("Error fetching object:", error);
      res.status(500).json({ message: "Ошибка при загрузке объекта" });
    }
  });

  app.post("/api/objects", async (req, res) => {
    try {
      const validatedData = insertObjectSchema.parse(req.body);
      const object = await storage.createObject(validatedData);
      res.status(201).json(object);
    } catch (error) {
      console.error("Error creating object:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ошибка валидации данных", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при создании объекта" });
    }
  });

  app.put("/api/objects/:id", async (req, res) => {
    try {
      const validatedData = insertObjectSchema.partial().parse(req.body);
      const object = await storage.updateObject(req.params.id, validatedData);
      if (!object) {
        return res.status(404).json({ message: "Объект не найден" });
      }
      res.json(object);
    } catch (error) {
      console.error("Error updating object:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ошибка валидации данных", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при обновлении объекта" });
    }
  });

  app.delete("/api/objects/:id", async (req, res) => {
    try {
      const success = await storage.deleteObject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Объект не найден" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting object:", error);
      res.status(500).json({ message: "Ошибка при удалении объекта" });
    }
  });

  // Positions routes
  app.get("/api/positions", async (req, res) => {
    try {
      const { objectId } = req.query;
      const positions = await storage.getPositions(objectId as string);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Ошибка при загрузке должностей" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Должность не найдена" });
      }
      res.json(position);
    } catch (error) {
      console.error("Error fetching position:", error);
      res.status(500).json({ message: "Ошибка при загрузке должности" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      console.error("Error creating position:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ошибка валидации данных", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при создании должности" });
    }
  });

  app.put("/api/positions/:id", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.partial().parse(req.body);
      const position = await storage.updatePosition(req.params.id, validatedData);
      if (!position) {
        return res.status(404).json({ message: "Должность не найдена" });
      }
      res.json(position);
    } catch (error) {
      console.error("Error updating position:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ошибка валидации данных", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при обновлении должности" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const success = await storage.deletePosition(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Должность не найдена" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting position:", error);
      res.status(500).json({ message: "Ошибка при удалении должности" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
