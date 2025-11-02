import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, objects, positions } from "@shared/schema";

async function seed() {
  console.log("🌱 Starting database seeding...");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  try {
    // Create demo users
    console.log("Creating demo users...");
    const [admin, manager1, manager2] = await db.insert(users).values([
      {
        username: "admin",
        password: "admin",
        role: "economist",
        name: "Экономист по з/п",
        isActive: true
      },
      {
        username: "manager1",
        password: "manager1",
        role: "manager",
        name: "Менеджер объекта 1",
        isActive: true
      },
      {
        username: "manager2",
        password: "manager2",
        role: "manager",
        name: "Менеджер объекта 2",
        isActive: true
      }
    ]).returning();

    console.log("✅ Created users:", { admin: admin.username, manager1: manager1.username, manager2: manager2.username });

    // Create sample objects
    console.log("Creating sample objects...");
    const objectsData = await db.insert(objects).values([
      {
        name: "ПортЭнерго",
        code: "PORT_ENERGO",
        description: "Тестовый объект ПортЭнерго для демонстрации системы",
        managerId: manager1.id,
        status: "active"
      },
      {
        name: "ОП Соликамск СКРУ-1",
        code: "SOLK_SKRU_1",
        description: "Производственный объект в Соликамске",
        managerId: manager1.id,
        status: "active"
      },
      {
        name: "ОП Соликамск СКРУ-3",
        code: "SOLK_SKRU_3",
        description: "Производственный объект в Соликамске",
        managerId: manager2.id,
        status: "active"
      },
      {
        name: "УПГП Урай",
        code: "UPGP_URAY",
        description: "Газоперерабатывающее предприятие в Урае",
        status: "active"
      },
      {
        name: "УПГП Белозерное",
        code: "UPGP_BELOZ",
        description: "Газоперерабатывающее предприятие Белозерное",
        status: "active"
      }
    ]).returning();

    console.log(`✅ Created ${objectsData.length} objects`);

    // Create sample positions for each object
    console.log("Creating sample positions...");
    const positionsData = [];

    // ПортЭнерго
    positionsData.push(
      { objectId: objectsData[0].id, title: "Менеджер", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 65000, positionsCount: 1 },
      { objectId: objectsData[0].id, title: "Инженер-энергетик", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 75000, positionsCount: 2 },
      { objectId: objectsData[0].id, title: "Электромонтер", workSchedule: "2/2" as const, paymentType: "hourly" as const, hourlyRate: 450, positionsCount: 4 },
      { objectId: objectsData[0].id, title: "Слесарь-ремонтник", workSchedule: "5/2" as const, paymentType: "hourly" as const, hourlyRate: 380, positionsCount: 2 }
    );

    // ОП Соликамск СКРУ-1
    positionsData.push(
      { objectId: objectsData[1].id, title: "Менеджер", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 55000, positionsCount: 2 },
      { objectId: objectsData[1].id, title: "Уборщик производственных и служебных помещений", workSchedule: "5/2" as const, paymentType: "hourly" as const, hourlyRate: 250, positionsCount: 4 },
      { objectId: objectsData[1].id, title: "Оператор", workSchedule: "2/2" as const, paymentType: "hourly" as const, hourlyRate: 400, positionsCount: 6 },
      { objectId: objectsData[1].id, title: "Слесарь", workSchedule: "5/2" as const, paymentType: "hourly" as const, hourlyRate: 350, positionsCount: 3 }
    );

    // ОП Соликамск СКРУ-3
    positionsData.push(
      { objectId: objectsData[2].id, title: "Менеджер", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 55000, positionsCount: 2 },
      { objectId: objectsData[2].id, title: "Уборщик производственных и служебных помещений", workSchedule: "5/2" as const, paymentType: "hourly" as const, hourlyRate: 250, positionsCount: 3 },
      { objectId: objectsData[2].id, title: "Оператор", workSchedule: "2/2" as const, paymentType: "hourly" as const, hourlyRate: 400, positionsCount: 8 }
    );

    // УПГП Урай
    positionsData.push(
      { objectId: objectsData[3].id, title: "Инженер", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 75000, positionsCount: 3 },
      { objectId: objectsData[3].id, title: "Оператор установки", workSchedule: "2/2" as const, paymentType: "hourly" as const, hourlyRate: 420, positionsCount: 8 }
    );

    // УПГП Белозерное
    positionsData.push(
      { objectId: objectsData[4].id, title: "Инженер", workSchedule: "5/2" as const, paymentType: "salary" as const, monthlySalary: 70000, positionsCount: 2 },
      { objectId: objectsData[4].id, title: "Электромонтер", workSchedule: "5/2" as const, paymentType: "hourly" as const, hourlyRate: 380, positionsCount: 3 }
    );

    await db.insert(positions).values(positionsData);
    console.log(`✅ Created ${positionsData.length} positions`);

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
