import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["manager", "economist"] }).notNull().default("manager"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("active"), // active, not_registered, fired
  workSchedule: text("work_schedule").notNull().default("5/2"), // 5/2, 2/2, 3/3, 6/1, вахта (7/0)
  objectId: varchar("object_id").notNull().references(() => objects.id),
  paymentType: text("payment_type").notNull().default("hourly"), // hourly, salary
  hourlyRate: integer("hourly_rate"), // rate per hour in rubles (from position)
  monthlySalary: integer("monthly_salary"), // monthly salary in rubles (from position)
  paymentMethod: text("payment_method").notNull().default("card"), // card (на карту), cash (ведомость)
  hireDate: text("hire_date"), // дата приема
  terminationDate: text("termination_date"), // дата увольнения
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  hours: integer("hours"), // 0-24 or null for special statuses
  dayType: text("day_type").notNull().default("work"), // work, sick, vacation, absence, fired
  qualityScore: integer("quality_score").default(3), // 1-4 scale
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  period: text("period").notNull(), // YYYY-MM format
  type: text("type").notNull(), // advance, salary
  status: text("status").notNull().default("draft"), // draft, sent, approved, rejected
  submittedBy: varchar("submitted_by").references(() => users.id), // менеджер объекта
  reviewedBy: varchar("reviewed_by").references(() => users.id), // экономист
  data: text("data").notNull(), // JSON stringified report data
  comments: text("comments"), // комментарии экономиста
  sentAt: timestamp("sent_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Бюджеты ФОТ по объектам
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  budgetAmount: integer("budget_amount").notNull(), // бюджет ФОТ в копейках
  createdAt: timestamp("created_at").defaultNow(),
});

// Дополнительные выплаты (больничные, отпускные, премии и др.)
export const additionalPayments = pgTable("additional_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  period: text("period").notNull(), // YYYY-MM format
  type: text("type", { enum: ["sick_leave", "vacation", "bonus", "other"] }).notNull(),
  amount: integer("amount").notNull(), // сумма в копейках
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id), // кто создал запись
  createdAt: timestamp("created_at").defaultNow(),
});

// Статусы периодов табеля для контроля доступа
export const timesheetPeriods = pgTable("timesheet_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  period: text("period").notNull(), // YYYY-MM format
  status: text("status").notNull().default("open"), // open (открыт для редактирования), closed (закрыт менеджером)
  closedBy: varchar("closed_by").references(() => users.id), // кто закрыл период
  closedAt: timestamp("closed_at"), // когда закрыт период
  reportStatus: text("report_status"), // null (нет отчёта), draft (черновик), requested (запрошен), submitted (отправлен), rejected (отклонён), approved (утверждён)
  reportId: varchar("report_id").references(() => reports.id), // связь с отчётом
  requestedBy: varchar("requested_by").references(() => users.id), // кто запросил отчёт
  requestedAt: timestamp("requested_at"), // когда запросили отчёт
  rejectionComment: text("rejection_comment"), // комментарий при отклонении
  rejectedBy: varchar("rejected_by").references(() => users.id), // кто отклонил
  rejectedAt: timestamp("rejected_at"), // когда отклонили
  approvedBy: varchar("approved_by").references(() => users.id), // кто утвердил
  approvedAt: timestamp("approved_at"), // когда утвердили
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const objects = pgTable("objects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  managerId: varchar("manager_id").references(() => users.id), // менеджер объекта
  groupManagerId: varchar("group_manager_id").references(() => users.id), // руководитель группы
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  closedAt: text("closed_at"), // дата закрытия объекта
  createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  title: text("title").notNull(),
  workSchedule: text("work_schedule").notNull().default("5/2"),
  hoursPerShift: integer("hours_per_shift").notNull().default(8), // hours per shift
  paymentType: text("payment_type").notNull().default("hourly"), // hourly, salary
  hourlyRate: integer("hourly_rate"), // rate per hour in rubles
  monthlySalary: integer("monthly_salary"), // monthly salary in rubles
  positionsCount: integer("positions_count").notNull().default(1), // number of positions per shift
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["manager", "economist"]).default("manager"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["active", "not_registered", "fired"]).default("active"),
  workSchedule: z.enum(["5/2", "2/2", "3/3", "6/1", "вахта"]).default("5/2"),
  paymentType: z.enum(["hourly", "salary"]).default("hourly"),
  paymentMethod: z.enum(["card", "cash"]).default("card"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertObjectSchema = createInsertSchema(objects).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["active", "closed"]).default("active"),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
}).extend({
  workSchedule: z.enum(["5/2", "2/2", "3/3", "6/1", "вахта"]).default("5/2"),
  hoursPerShift: z.number().positive().default(8),
  paymentType: z.enum(["hourly", "salary"]).default("hourly"),
  hourlyRate: z.number().positive().optional(),
  monthlySalary: z.number().positive().optional(),
  positionsCount: z.number().positive().default(1),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export const insertAdditionalPaymentSchema = createInsertSchema(additionalPayments).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["sick_leave", "vacation", "bonus", "other"]),
});

export const insertTimesheetPeriodSchema = createInsertSchema(timesheetPeriods).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["open", "closed"]).default("open"),
  reportStatus: z.enum(["draft", "requested", "submitted", "rejected", "approved"]).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Object = typeof objects.$inferSelect;
export type InsertObject = z.infer<typeof insertObjectSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type AdditionalPayment = typeof additionalPayments.$inferSelect;
export type InsertAdditionalPayment = z.infer<typeof insertAdditionalPaymentSchema>;

export type TimesheetPeriod = typeof timesheetPeriods.$inferSelect;
export type InsertTimesheetPeriod = z.infer<typeof insertTimesheetPeriodSchema>;

// Additional types for frontend
export interface DashboardStats {
  daysToAdvanceDeadline: number;
  daysToSalaryDeadline: number;
  activeEmployees: number;
  totalEmployees: number;
  monthlyNormHours: number;
  actualHours: number;
  deviation: number;
}

export interface TimesheetData {
  employeeId: string;
  employeeName: string;
  position: string;
  status: string;
  entries: { [date: string]: TimeEntry };
  totalHours: number;
}

export interface ReportData {
  period: string;
  type: 'advance' | 'salary';
  employees: TimesheetData[];
  totalHours: number;
  totalEmployees: number;
  startDate: string;
  endDate: string;
}
