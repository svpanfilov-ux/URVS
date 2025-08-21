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
  type InsertSetting
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private employees: Map<string, Employee>;
  private timeEntries: Map<string, TimeEntry>;
  private reports: Map<string, Report>;
  private settings: Map<string, Setting>;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.timeEntries = new Map();
    this.reports = new Map();
    this.settings = new Map();

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

    // Create sample employees
    const sampleEmployees = [
      { name: "Иванов Иван Иванович", position: "Менеджер по продажам", status: "active" },
      { name: "Петров Пётр Петрович", position: "Кассир", status: "active" },
      { name: "Сидоров Семён Семёнович", position: "Помощник", status: "not_registered" },
    ];

    sampleEmployees.forEach(emp => {
      const employee: Employee = {
        id: randomUUID(),
        ...emp,
        terminationDate: null,
        createdAt: new Date()
      };
      this.employees.set(employee.id, employee);
    });

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
}

export const storage = new MemStorage();
