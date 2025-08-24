import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("manager"),
  name: text("name").notNull(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("active"), // active, not_registered, fired
  workSchedule: text("work_schedule").notNull().default("5/2"), // 5/2, 2/2, 3/3, 6/1, вахта (7/0)
  objectId: varchar("object_id").references(() => objects.id),
  terminationDate: text("termination_date"),
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
  period: text("period").notNull(), // YYYY-MM format
  type: text("type").notNull(), // advance, salary
  status: text("status").notNull().default("draft"), // draft, sent
  data: text("data").notNull(), // JSON stringified report data
  sentAt: timestamp("sent_at"),
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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectId: varchar("object_id").notNull().references(() => objects.id),
  title: text("title").notNull(),
  workSchedule: text("work_schedule").notNull().default("5/2"),
  paymentType: text("payment_type").notNull().default("hourly"), // hourly, salary
  hourlyRate: integer("hourly_rate"), // rate per hour in rubles
  monthlySalary: integer("monthly_salary"), // monthly salary in rubles
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["active", "not_registered", "fired"]).default("active"),
  workSchedule: z.enum(["5/2", "2/2", "3/3", "6/1", "вахта"]).default("5/2"),
  objectId: z.string().optional(),
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
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
}).extend({
  workSchedule: z.enum(["5/2", "2/2", "3/3", "6/1", "вахта"]).default("5/2"),
  paymentType: z.enum(["hourly", "salary"]).default("hourly"),
  hourlyRate: z.number().positive().optional(),
  monthlySalary: z.number().positive().optional(),
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
