import { 
  type User, 
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type TimeEntry,
  type InsertTimeEntry,
  type Report,
  type InsertReport,
  type Setting,
  type InsertSetting,
  type Object,
  type InsertObject,
  type Position,
  type InsertPosition
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(employeeId?: string, startDate?: string, endDate?: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  // Reports
  getReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;

  // Objects
  getObjects(): Promise<Object[]>;
  getObject(id: string): Promise<Object | undefined>;
  createObject(object: InsertObject): Promise<Object>;
  updateObject(id: string, object: Partial<InsertObject>): Promise<Object | undefined>;
  deleteObject(id: string): Promise<boolean>;

  // Positions
  getPositions(objectId?: string): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private employees: Map<string, Employee>;
  private timeEntries: Map<string, TimeEntry>;
  private reports: Map<string, Report>;
  private settings: Map<string, Setting>;
  private objects: Map<string, Object>;
  private positions: Map<string, Position>;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.timeEntries = new Map();
    this.reports = new Map();
    this.settings = new Map();
    this.objects = new Map();
    this.positions = new Map();

    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin", // In production, this should be hashed
      role: "manager",
      name: "Иванов И.И."
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample objects first
    const sampleObjects = [
      { name: "Торговый центр Мега", code: "TC_MEGA", description: "Основной торговый объект", isActive: true },
      { name: "Магазин на Ленинском", code: "MAG_LENIN", description: "Филиал на проспекте Ленинском", isActive: true },
      { name: "Склад центральный", code: "SKLAD_01", description: "Центральный склад компании", isActive: false },
    ];

    const objectIds: string[] = [];
    sampleObjects.forEach(obj => {
      const object: Object = {
        id: randomUUID(),
        ...obj,
        createdAt: new Date()
      };
      this.objects.set(object.id, object);
      objectIds.push(object.id);
    });

    // Create sample positions for each object
    const samplePositions = [
      // Торговый центр Мега
      { objectId: objectIds[0], title: "Менеджер по продажам", workSchedule: "5/2", paymentType: "salary", monthlySalary: 45000, positionsCount: 2 },
      { objectId: objectIds[0], title: "Кассир", workSchedule: "2/2", paymentType: "hourly", hourlyRate: 250, positionsCount: 4 },
      { objectId: objectIds[0], title: "Охранник", workSchedule: "2/2", paymentType: "hourly", hourlyRate: 200, positionsCount: 3 },
      { objectId: objectIds[0], title: "Уборщица", workSchedule: "5/2", paymentType: "hourly", hourlyRate: 180, positionsCount: 2 },
      
      // Магазин на Ленинском
      { objectId: objectIds[1], title: "Продавец-консультант", workSchedule: "6/1", paymentType: "salary", monthlySalary: 35000, positionsCount: 3 },
      { objectId: objectIds[1], title: "Кассир", workSchedule: "5/2", paymentType: "hourly", hourlyRate: 220, positionsCount: 2 },
      { objectId: objectIds[1], title: "Администратор", workSchedule: "5/2", paymentType: "salary", monthlySalary: 40000, positionsCount: 1 },
      
      // Склад центральный
      { objectId: objectIds[2], title: "Кладовщик", workSchedule: "5/2", paymentType: "salary", monthlySalary: 38000, positionsCount: 2 },
      { objectId: objectIds[2], title: "Грузчик", workSchedule: "2/2", paymentType: "hourly", hourlyRate: 300, positionsCount: 6 },
      { objectId: objectIds[2], title: "Водитель", workSchedule: "5/2", paymentType: "hourly", hourlyRate: 280, positionsCount: 3 },
    ];

    samplePositions.forEach(pos => {
      const position: Position = {
        id: randomUUID(),
        ...pos,
        hourlyRate: pos.hourlyRate || null,
        monthlySalary: pos.monthlySalary || null,
        positionsCount: pos.positionsCount || 1,
        isActive: true,
        createdAt: new Date()
      };
      this.positions.set(position.id, position);
    });

    // Create sample employees and assign to objects
    const sampleEmployees = [
      // Торговый центр Мега
      { name: "Иванов Иван Иванович", position: "Менеджер по продажам", status: "active", workSchedule: "5/2", objectId: objectIds[0] },
      { name: "Петров Пётр Петрович", position: "Кассир", status: "active", workSchedule: "2/2", objectId: objectIds[0] },
      { name: "Смирнов Алексей Николаевич", position: "Охранник", status: "active", workSchedule: "2/2", objectId: objectIds[0] },
      
      // Магазин на Ленинском  
      { name: "Сидоров Семён Семёнович", position: "Продавец-консультант", status: "active", workSchedule: "6/1", objectId: objectIds[1] },
      { name: "Козлова Мария Петровна", position: "Кассир", status: "not_registered", workSchedule: "5/2", objectId: objectIds[1] },
      
      // Склад центральный
      { name: "Николаев Дмитрий Игоревич", position: "Кладовщик", status: "active", workSchedule: "5/2", objectId: objectIds[2] },
      { name: "Федорова Анна Сергеевна", position: "Грузчик", status: "fired", workSchedule: "2/2", objectId: objectIds[2], terminationDate: "2025-08-15" },
    ];

    sampleEmployees.forEach(emp => {
      const employee: Employee = {
        id: randomUUID(),
        ...emp,
        objectId: emp.objectId || null,
        terminationDate: emp.terminationDate || null,
        createdAt: new Date()
      };
      this.employees.set(employee.id, employee);
    });

    // Add sample time entries for July 2025 (previous month) for autofill demonstration
    const employeeIds = Array.from(this.employees.keys());
    if (employeeIds.length > 0) {
      // Generate July 2025 data for the first employee (5/2 schedule)
      const firstEmployeeId = employeeIds[0];
      for (let day = 1; day <= 31; day++) {
        const date = `2025-07-${day.toString().padStart(2, '0')}`;
        const dayOfWeek = new Date(2025, 6, day).getDay(); // 0 = Sunday, 6 = Saturday
        
        // 5/2 schedule: work on weekdays (Monday-Friday)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const timeEntry: TimeEntry = {
            id: randomUUID(),
            employeeId: firstEmployeeId,
            date,
            hours: 8,
            dayType: "work",
            qualityScore: 3,
            comment: null,
            createdAt: new Date()
          };
          this.timeEntries.set(timeEntry.id, timeEntry);
        }
      }

      // Generate July 2025 data for the second employee (2/2 schedule)
      if (employeeIds.length > 1) {
        const secondEmployeeId = employeeIds[1];
        let workDayCount = 0;
        let isWorkPeriod = true;
        
        for (let day = 1; day <= 31; day++) {
          const date = `2025-07-${day.toString().padStart(2, '0')}`;
          
          // 2/2 schedule: 2 work days, then 2 rest days
          if (isWorkPeriod && workDayCount < 2) {
            const timeEntry: TimeEntry = {
              id: randomUUID(),
              employeeId: secondEmployeeId,
              date,
              hours: 12,
              dayType: "work",
              qualityScore: 3,
              comment: null,
              createdAt: new Date()
            };
            this.timeEntries.set(timeEntry.id, timeEntry);
          }
          
          workDayCount++;
          if (workDayCount === 2) {
            workDayCount = 0;
            isWorkPeriod = !isWorkPeriod;
          }
        }
      }
    }

    // Initialize default settings
    const defaultSettings = [
      { key: "theme", value: "light" },
      { key: "defaultQualityScore", value: "3" },
      { key: "serverUrl", value: "https://api.example.com/submit-report" },
      { key: "workingDays", value: "5" },
      { key: "autoSave", value: "immediate" },
      { key: "notifications", value: "true" }
    ];

    defaultSettings.forEach(setting => {
      const newSetting: Setting = {
        id: randomUUID(),
        ...setting,
        updatedAt: new Date()
      };
      this.settings.set(newSetting.id, newSetting);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: insertUser.role || "manager" };
    this.users.set(id, user);
    return user;
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).sort((a, b) => {
      // Sort by status: active first, then not_registered, then fired
      const statusOrder = { active: 1, not_registered: 2, fired: 3 };
      return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      status: insertEmployee.status || "active",
      workSchedule: insertEmployee.workSchedule || "5/2",
      objectId: insertEmployee.objectId || null,
      terminationDate: insertEmployee.terminationDate ?? null,
      createdAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updatedEmployee = { ...employee, ...updateData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Time Entries
  async getTimeEntries(employeeId?: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    let entries = Array.from(this.timeEntries.values());

    if (employeeId) {
      entries = entries.filter(entry => entry.employeeId === employeeId);
    }

    if (startDate) {
      entries = entries.filter(entry => entry.date >= startDate);
    }

    if (endDate) {
      entries = entries.filter(entry => entry.date <= endDate);
    }

    return entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const entry: TimeEntry = { 
      ...insertEntry, 
      id,
      hours: insertEntry.hours ?? null,
      dayType: insertEntry.dayType || "work",
      qualityScore: insertEntry.qualityScore ?? 3,
      comment: insertEntry.comment || null,
      createdAt: new Date()
    };
    this.timeEntries.set(id, entry);
    return entry;
  }

  async updateTimeEntry(id: string, updateData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const entry = this.timeEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry = { ...entry, ...updateData };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Reports
  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      b.createdAt!.getTime() - a.createdAt!.getTime()
    );
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = { 
      ...insertReport, 
      id,
      status: insertReport.status || "draft",
      sentAt: insertReport.sentAt || null,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updateData: Partial<InsertReport>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport = { ...report, ...updateData };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.key === key);
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    const existing = Array.from(this.settings.values()).find(s => s.key === insertSetting.key);
    
    if (existing) {
      existing.value = insertSetting.value;
      existing.updatedAt = new Date();
      this.settings.set(existing.id, existing);
      return existing;
    } else {
      const id = randomUUID();
      const setting: Setting = { 
        ...insertSetting, 
        id,
        updatedAt: new Date()
      };
      this.settings.set(id, setting);
      return setting;
    }
  }

  // Objects
  async getObjects(): Promise<Object[]> {
    return Array.from(this.objects.values());
  }

  async getObject(id: string): Promise<Object | undefined> {
    return this.objects.get(id);
  }

  async createObject(insertObject: InsertObject): Promise<Object> {
    const id = randomUUID();
    const object: Object = { 
      ...insertObject, 
      id,
      description: insertObject.description || null,
      isActive: insertObject.isActive ?? true,
      createdAt: new Date()
    };
    this.objects.set(id, object);
    return object;
  }

  async updateObject(id: string, updateData: Partial<InsertObject>): Promise<Object | undefined> {
    const object = this.objects.get(id);
    if (!object) return undefined;

    const updatedObject = { ...object, ...updateData };
    this.objects.set(id, updatedObject);
    return updatedObject;
  }

  async deleteObject(id: string): Promise<boolean> {
    return this.objects.delete(id);
  }

  // Positions
  async getPositions(objectId?: string): Promise<Position[]> {
    let positions = Array.from(this.positions.values());
    if (objectId) {
      positions = positions.filter(pos => pos.objectId === objectId);
    }
    return positions.sort((a, b) => a.title.localeCompare(b.title));
  }

  async getPosition(id: string): Promise<Position | undefined> {
    return this.positions.get(id);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const position: Position = { 
      ...insertPosition, 
      id,
      hourlyRate: insertPosition.hourlyRate || null,
      monthlySalary: insertPosition.monthlySalary || null,
      isActive: insertPosition.isActive ?? true,
      createdAt: new Date()
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePosition(id: string, updateData: Partial<InsertPosition>): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;

    const updatedPosition = { ...position, ...updateData };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }

  async deletePosition(id: string): Promise<boolean> {
    return this.positions.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
