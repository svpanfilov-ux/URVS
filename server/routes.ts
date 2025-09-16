import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmployeeSchema, insertTimeEntrySchema, insertReportSchema, insertSettingSchema, insertObjectSchema, insertPositionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { randomUUID } from "crypto";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Authorization middleware
interface AuthRequest extends Request {
  user?: any;
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token || !token.startsWith('session-')) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }
    
    const userId = token.replace('session-', '');
    const user = await storage.getUsers().then(users => users.find(u => u.id === userId));
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Недействительный токен" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Ошибка авторизации" });
  }
}

function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Недостаточно прав доступа" });
    }
    
    next();
  };
}

// Multer configuration for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// CSV parsing function for objects
function parseObjectsCSV(csvContent: string): { objects: string; manager: string; groupManager: string }[] {
  const lines = csvContent.trim().split('\n');
  const data: { objects: string; manager: string; groupManager: string }[] = [];
  
  // Skip header line and process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [objects, manager, groupManager] = line.split(';').map(s => s.trim());
    
    if (objects && manager && groupManager) {
      data.push({ objects, manager, groupManager });
    }
  }
  
  return data;
}

// CSV parsing function for employees
function parseEmployeesCSV(csvContent: string): { objectName: string; employeeName: string; position: string; status: string }[] {
  const lines = csvContent.trim().split('\n');
  const data: { objectName: string; employeeName: string; position: string; status: string }[] = [];
  
  // Skip header line and process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [objectName, employeeName, position, status] = line.split(';').map(s => s.trim());
    
    if (objectName && employeeName && position && status) {
      data.push({ objectName, employeeName, position, status });
    }
  }
  
  return data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Пользователь заблокирован" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role,
          isActive: user.isActive
        },
        token: `session-${user.id}`
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Ошибка валидации данных" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Ошибка при загрузке пользователей" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ошибка валидации данных", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при обновлении пользователя" });
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

  // Normalize work schedule from detailed description to basic enum value
  function normalizeWorkSchedule(schedule: string): string {
    if (!schedule) return "5/2";
    
    const normalized = schedule.toLowerCase().trim();
    
    if (normalized.includes("5/2")) return "5/2";
    if (normalized.includes("2/2")) return "2/2";
    if (normalized.includes("3/3")) return "3/3";
    if (normalized.includes("6/1")) return "6/1";
    if (normalized.includes("вахта") || normalized.includes("7/0")) return "вахта";
    
    // Default fallback
    return "5/2";
  }

  // Get work schedules for object
  app.get("/api/objects/:objectId/work-schedules", async (req, res) => {
    try {
      const { objectId } = req.params;
      
      // Get unique work schedules from employees and positions for this object
      const employees = await storage.getEmployees();
      const positions = await storage.getPositions();
      
      const objectEmployees = employees.filter(emp => emp.objectId === objectId);
      const objectPositions = positions.filter(pos => pos.objectId === objectId);
      
      const schedules = new Set<string>();
      
      // Add normalized schedules from existing employees
      objectEmployees.forEach(emp => {
        if (emp.workSchedule) {
          schedules.add(normalizeWorkSchedule(emp.workSchedule));
        }
      });
      
      // Add normalized schedules from existing positions
      objectPositions.forEach(pos => {
        if (pos.workSchedule) {
          schedules.add(normalizeWorkSchedule(pos.workSchedule));
        }
      });
      
      // If no schedules found, return default options
      if (schedules.size === 0) {
        schedules.add("5/2");
        schedules.add("2/2");
        schedules.add("3/3");
        schedules.add("6/1");
        schedules.add("вахта");
      }
      
      const scheduleList = Array.from(schedules).sort();
      res.json(scheduleList);
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      res.status(500).json({ message: "Ошибка при загрузке графиков работы" });
    }
  });

  // Import objects from CSV
  app.post("/api/import/objects", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parsedData = parseObjectsCSV(csvContent);

      if (parsedData.length === 0) {
        return res.status(400).json({ message: "CSV файл пуст или имеет неверный формат" });
      }

      let objectsCount = 0;
      let usersCount = 0;

      for (const row of parsedData) {
        // Function to create username from name
        const createUsername = (name: string): string => {
          return name.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_а-яё]/gi, '')
            .substring(0, 20);
        };

        // Find or create manager
        let manager = await storage.getUserByUsername(createUsername(row.manager));
        if (!manager) {
          manager = await storage.createUser({
            username: createUsername(row.manager),
            password: "temp123", // Default password, should be changed on first login
            name: row.manager,
            role: "manager",
            isActive: true
          });
          usersCount++;
        }

        // Find or create group manager
        let groupManager = await storage.getUserByUsername(createUsername(row.groupManager));
        if (!groupManager) {
          groupManager = await storage.createUser({
            username: createUsername(row.groupManager),
            password: "temp123", // Default password, should be changed on first login
            name: row.groupManager,
            role: "manager",
            isActive: true
          });
          usersCount++;
        }

        // Create or update object
        const objectCode = row.objects.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
        
        try {
          await storage.createObject({
            name: row.objects,
            code: objectCode,
            description: `Импортировано из CSV`,
            managerId: manager.id,
            groupManagerId: groupManager.id,
            status: "active"
          });
          objectsCount++;
        } catch (error) {
          // Object might already exist, try to update it
          const existingObjects = await storage.getObjects();
          const existingObject = existingObjects.find(obj => obj.name === row.objects || obj.code === objectCode);
          
          if (existingObject) {
            await storage.updateObject(existingObject.id, {
              managerId: manager.id,
              groupManagerId: groupManager.id,
              status: "active"
            });
          }
        }
      }

      res.json({
        message: "Импорт завершён успешно",
        objectsCount,
        usersCount
      });

    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ 
        message: "Ошибка при импорте", 
        error: error instanceof Error ? error.message : "Неизвестная ошибка" 
      });
    }
  });

  // Import staffing schedule from CSV
  app.post("/api/import/staffing", requireAuth, requireRole("economist"), upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не найден" });
    }

    try {
      const fileContent = req.file.buffer.toString('utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "Файл пуст" });
      }

      // Remove BOM if present and parse header
      const header = lines[0].replace(/^\uFEFF/, '').split(';');
      const dataLines = lines.slice(1);

      // Expected columns: Объект;Должность;График работы;Оклад (тариф);Количество ставок;Тип оплат
      const expectedColumns = ['Объект', 'Должность', 'График работы', 'Оклад (тариф)', 'Количество ставок', 'Тип оплат'];
      if (header.length < 6) {
        return res.status(400).json({ 
          message: `Неправильный формат файла. Ожидается: ${expectedColumns.join(';')}` 
        });
      }

      const objects = await storage.getObjects();
      const objectMap = new Map();
      objects.forEach(obj => {
        objectMap.set(obj.name, obj.id);
      });

      const staffingData = new Map(); // objectId -> position -> { workSchedule, salary, count }
      let processedRows = 0;
      let skippedRows = 0;

      for (const line of dataLines) {
        const columns = line.split(';');
        if (columns.length < 6) continue;

        const [objectName, position, workSchedule, salaryStr, positionsCountStr, paymentTypeStr] = columns.map(col => col.trim());
        
        if (!objectName || !position || !salaryStr || !positionsCountStr || !paymentTypeStr) continue;

        const objectId = objectMap.get(objectName);
        if (!objectId) {
          console.warn(`Object not found: ${objectName}`);
          skippedRows++;
          continue;
        }

        // Parse salary (remove spaces and convert to number)
        const salary = parseInt(salaryStr.replace(/\s/g, '').replace(',', ''));
        if (isNaN(salary)) {
          console.warn(`Invalid salary: ${salaryStr}`);
          skippedRows++;
          continue;
        }

        // Parse positions count
        const positionsCount = parseInt(positionsCountStr.replace(/\s/g, ''));
        if (isNaN(positionsCount) || positionsCount < 1) {
          console.warn(`Invalid positions count: ${positionsCountStr}`);
          skippedRows++;
          continue;
        }

        // Parse payment type
        const paymentType = paymentTypeStr.toLowerCase().includes('оклад') ? 'salary' : 'hourly';

        // Create unique position entry
        if (!staffingData.has(objectId)) {
          staffingData.set(objectId, new Map());
        }
        
        const objectPositions = staffingData.get(objectId);
        const positionKey = `${position}_${workSchedule}_${paymentType}_${salary}`;
        
        if (!objectPositions.has(positionKey)) {
          objectPositions.set(positionKey, {
            title: position,
            workSchedule: workSchedule || "5/2",
            salary: salary,
            paymentType: paymentType,
            count: positionsCount
          });
        } else {
          objectPositions.get(positionKey).count += positionsCount;
        }
        
        processedRows++;
      }

      // Create positions in database
      let createdPositions = 0;
      for (const [objectId, positions] of Array.from(staffingData.entries())) {
        for (const [, positionData] of Array.from((positions as Map<string, any>).entries())) {
          try {
            // Use the payment type from CSV data
            let hourlyRate = null;
            let monthlySalary = null;

            if (positionData.paymentType === "hourly") {
              hourlyRate = positionData.salary;
            } else {
              monthlySalary = positionData.salary;
            }

            await storage.createPosition({
              objectId,
              title: positionData.title,
              workSchedule: normalizeWorkSchedule(positionData.workSchedule) as "5/2" | "2/2" | "3/3" | "6/1" | "вахта",
              paymentType: positionData.paymentType as "hourly" | "salary",
              hoursPerShift: 8,
              hourlyRate: hourlyRate,
              monthlySalary: monthlySalary,
              positionsCount: positionData.count,
              isActive: true
            });
            createdPositions++;
          } catch (error) {
            console.error("Error creating position:", error);
          }
        }
      }

      res.json({ 
        message: "Импорт штатного расписания завершён успешно",
        processedRows,
        skippedRows,
        positionsCount: createdPositions
      });
    } catch (error) {
      console.error("Error importing staffing:", error);
      res.status(500).json({ message: "Ошибка при импорте файла" });
    }
  });

  // Export positions to CSV
  app.get("/api/positions/export/csv", requireAuth, requireRole("economist"), async (req, res) => {
    try {
      const positions = await storage.getPositions();
      const objects = await storage.getObjects();
      
      // Create object lookup map
      const objectMap = new Map();
      objects.forEach(obj => {
        objectMap.set(obj.id, obj.name);
      });

      const csvHeader = "Объект;Должность;График работы;Оклад (тариф);Количество ставок;Тип оплат\n";
      const csvData = positions.map(pos => {
        const objectName = objectMap.get(pos.objectId) || "Не указан";
        const salary = pos.paymentType === "salary" ? pos.monthlySalary || 0 : pos.hourlyRate || 0;
        const paymentType = pos.paymentType === "salary" ? "Оклад" : "Почасовая";
        
        return `"${objectName}";"${pos.title}";"${pos.workSchedule}";"${salary}";"${pos.positionsCount}";"${paymentType}"`;
      }).join("\n");
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="staffing_schedule.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error exporting positions:", error);
      res.status(500).json({ message: "Ошибка экспорта данных" });
    }
  });

  // Import employees from CSV
  app.post("/api/import/employees", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parsedData = parseEmployeesCSV(csvContent);

      if (parsedData.length === 0) {
        return res.status(400).json({ message: "CSV файл пуст или имеет неверный формат" });
      }

      let employeesCount = 0;
      const existingObjects = await storage.getObjects();

      for (const row of parsedData) {
        // Find the object by name
        const object = existingObjects.find(obj => obj.name === row.objectName);
        
        if (!object) {
          console.warn(`Object not found: ${row.objectName}`);
          continue;
        }

        // Map status from Russian to English
        let statusMapped: "active" | "not_registered" | "fired" = "active";
        switch (row.status.toLowerCase()) {
          case "активный":
            statusMapped = "active";
            break;
          case "неактивный":
            statusMapped = "not_registered";
            break;
          case "уволен":
            statusMapped = "fired";
            break;
          default:
            statusMapped = "active";
        }

        try {
          await storage.createEmployee({
            name: row.employeeName,
            position: row.position,
            status: statusMapped,
            workSchedule: "5/2", // Default work schedule
            objectId: object.id,
            terminationDate: statusMapped === "fired" ? new Date().toISOString().split('T')[0] : null
          });
          employeesCount++;
        } catch (error) {
          console.error(`Error creating employee ${row.employeeName}:`, error);
          // Continue processing other employees
        }
      }

      res.json({
        message: "Импорт сотрудников завершён успешно",
        employeesCount
      });

    } catch (error) {
      console.error("Employee import error:", error);
      res.status(500).json({ 
        message: "Ошибка при импорте сотрудников", 
        error: error instanceof Error ? error.message : "Неизвестная ошибка" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
