import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users,
  employees, 
  timeEntries, 
  reports, 
  settings,
  objects,
  positions,
  budgets,
  additionalPayments,
  timesheetStatus,
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
  type InsertPosition,
  type Budget,
  type InsertBudget,
  type AdditionalPayment,
  type InsertAdditionalPayment,
  type TimesheetStatus,
  type InsertTimesheetStatus
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  // Employees - with role-based access control
  async getEmployees(objectId?: string, userId?: string, userRole?: string): Promise<Employee[]> {
    let query = db.select().from(employees);

    if (userRole === "object_manager" && objectId) {
      query = query.where(eq(employees.objectId, objectId));
    } else if (userRole === "group_manager" && userId) {
      // Get objects managed by this group manager
      const managedObjects = await db.select().from(objects).where(eq(objects.groupManagerId, userId));
      if (managedObjects.length > 0) {
        const objectIds = managedObjects.map(obj => obj.id);
        query = query.where(employees.objectId.in(objectIds));
      }
    }
    // director and hr_economist see all employees

    return await query.orderBy(employees.name);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount! > 0;
  }

  // Time Entries - with access control
  async getTimeEntries(period?: string, objectId?: string, userId?: string, userRole?: string): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries).innerJoin(employees, eq(timeEntries.employeeId, employees.id));

    if (period) {
      const [year, month] = period.split('-');
      query = query.where(
        and(
          timeEntries.date.like(`${year}-${month.padStart(2, '0')}-%`)
        )
      );
    }

    if (userRole === "object_manager" && objectId) {
      query = query.where(eq(employees.objectId, objectId));
    } else if (userRole === "group_manager" && userId) {
      const managedObjects = await db.select().from(objects).where(eq(objects.groupManagerId, userId));
      if (managedObjects.length > 0) {
        const objectIds = managedObjects.map(obj => obj.id);
        query = query.where(employees.objectId.in(objectIds));
      }
    }

    const results = await query.orderBy(timeEntries.date, employees.name);
    return results.map(r => r.time_entries);
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db.insert(timeEntries).values(insertTimeEntry).returning();
    return timeEntry;
  }

  async updateTimeEntry(id: string, updateData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db.update(timeEntries).set(updateData).where(eq(timeEntries.id, id)).returning();
    return timeEntry || undefined;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return result.rowCount! > 0;
  }

  // Reports
  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(reports.createdAt);
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async updateReport(id: string, updateData: Partial<InsertReport>): Promise<Report | undefined> {
    const [report] = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    return report || undefined;
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount! > 0;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.key);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    const [setting] = await db.insert(settings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: insertSetting.value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  // Objects - with access control
  async getObjects(userId?: string, userRole?: string): Promise<Object[]> {
    if (userRole === "object_manager" && userId) {
      return await db.select().from(objects).where(eq(objects.managerId, userId));
    } else if (userRole === "group_manager" && userId) {
      return await db.select().from(objects).where(eq(objects.groupManagerId, userId));
    }
    // director and hr_economist see all objects
    return await db.select().from(objects).orderBy(objects.name);
  }

  async getObject(id: string): Promise<Object | undefined> {
    const [object] = await db.select().from(objects).where(eq(objects.id, id));
    return object || undefined;
  }

  async createObject(insertObject: InsertObject): Promise<Object> {
    const [object] = await db.insert(objects).values(insertObject).returning();
    return object;
  }

  async updateObject(id: string, updateData: Partial<InsertObject>): Promise<Object | undefined> {
    const [object] = await db.update(objects).set(updateData).where(eq(objects.id, id)).returning();
    return object || undefined;
  }

  async deleteObject(id: string): Promise<boolean> {
    const result = await db.delete(objects).where(eq(objects.id, id));
    return result.rowCount! > 0;
  }

  // Positions
  async getPositions(objectId?: string): Promise<Position[]> {
    let query = db.select().from(positions);
    if (objectId) {
      query = query.where(eq(positions.objectId, objectId));
    }
    return await query.orderBy(positions.title);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db.insert(positions).values(insertPosition).returning();
    return position;
  }

  async updatePosition(id: string, updateData: Partial<InsertPosition>): Promise<Position | undefined> {
    const [position] = await db.update(positions).set(updateData).where(eq(positions.id, id)).returning();
    return position || undefined;
  }

  async deletePosition(id: string): Promise<boolean> {
    const result = await db.delete(positions).where(eq(positions.id, id));
    return result.rowCount! > 0;
  }

  // Budgets
  async getBudgets(objectId?: string): Promise<Budget[]> {
    let query = db.select().from(budgets);
    if (objectId) {
      query = query.where(eq(budgets.objectId, objectId));
    }
    return await query.orderBy(budgets.year, budgets.month);
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(insertBudget).returning();
    return budget;
  }

  async updateBudget(id: string, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [budget] = await db.update(budgets).set(updateData).where(eq(budgets.id, id)).returning();
    return budget || undefined;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id));
    return result.rowCount! > 0;
  }

  // Additional Payments
  async getAdditionalPayments(objectId?: string, period?: string): Promise<AdditionalPayment[]> {
    let query = db.select().from(additionalPayments);
    
    const conditions = [];
    if (objectId) conditions.push(eq(additionalPayments.objectId, objectId));
    if (period) conditions.push(eq(additionalPayments.period, period));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(additionalPayments.createdAt);
  }

  async createAdditionalPayment(insertPayment: InsertAdditionalPayment): Promise<AdditionalPayment> {
    const [payment] = await db.insert(additionalPayments).values(insertPayment).returning();
    return payment;
  }

  // Timesheet Status
  async getTimesheetStatus(objectId: string, period: string): Promise<TimesheetStatus | undefined> {
    const [status] = await db.select().from(timesheetStatus)
      .where(and(eq(timesheetStatus.objectId, objectId), eq(timesheetStatus.period, period)));
    return status || undefined;
  }

  async createTimesheetStatus(insertStatus: InsertTimesheetStatus): Promise<TimesheetStatus> {
    const [status] = await db.insert(timesheetStatus).values(insertStatus).returning();
    return status;
  }

  async updateTimesheetStatus(objectId: string, period: string, updateData: Partial<InsertTimesheetStatus>): Promise<TimesheetStatus | undefined> {
    const [status] = await db.update(timesheetStatus)
      .set(updateData)
      .where(and(eq(timesheetStatus.objectId, objectId), eq(timesheetStatus.period, period)))
      .returning();
    return status || undefined;
  }
}