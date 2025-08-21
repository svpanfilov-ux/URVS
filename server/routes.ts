import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertTimeEntrySchema, insertReportSchema, insertSettingSchema } from "@shared/schema";
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
      const employees = await storage.getEmployees();
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
      const { employeeId, startDate, endDate } = req.query;
      const entries = await storage.getTimeEntries(
        employeeId as string,
        startDate as string,
        endDate as string
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
          results.push({ success: false, error: error.message, data: emp });
        }
      }
      
      res.json({ results });
    } catch (error) {
      res.status(400).json({ message: "Ошибка импорта данных" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
