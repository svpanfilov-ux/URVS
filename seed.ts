import { db } from './src/lib/db'
import bcrypt from 'bcryptjs'

async function seed() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create users
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await db.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'Администратор',
        role: 'ECONOMIST',
        isActive: true
      }
    })

    const managerUser = await db.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        password: hashedPassword,
        name: 'Менеджер',
        role: 'MANAGER',
        isActive: true
      }
    })

    console.log('✅ Created users:', { adminUser, managerUser })

    // Create objects
    const object1 = await db.object.upsert({
      where: { code: 'OC001' },
      update: {},
      create: {
        name: 'Офисный центр "Солнечный"',
        code: 'OC001',
        description: 'Современный офисный центр в центре города',
        managerId: managerUser.id,
        status: 'ACTIVE'
      }
    })

    const object2 = await db.object.upsert({
      where: { code: 'ZH002' },
      update: {},
      create: {
        name: 'ЖК "Новые горизонты"',
        code: 'ZH002',
        description: 'Жилой комплекс премиум-класса',
        managerId: managerUser.id,
        status: 'ACTIVE'
      }
    })

    const object3 = await db.object.upsert({
      where: { code: 'TK003' },
      update: {},
      create: {
        name: 'Торговый комплекс "Атлант"',
        code: 'TK003',
        description: 'Крупный торговый центр',
        managerId: managerUser.id,
        status: 'ACTIVE'
      }
    })

    console.log('✅ Created objects:', { object1, object2, object3 })

    // Create positions
    await db.position.createMany({
      data: [
        {
          objectId: object1.id,
          title: 'Старший охранник',
          workSchedule: '5/2',
          hoursPerShift: 12,
          paymentType: 'HOURLY',
          hourlyRate: 200,
          positionsCount: 1,
          isActive: true
        },
        {
          objectId: object1.id,
          title: 'Охранник',
          workSchedule: '5/2',
          hoursPerShift: 12,
          paymentType: 'HOURLY',
          hourlyRate: 150,
          positionsCount: 3,
          isActive: true
        },
        {
          objectId: object2.id,
          title: 'Старший охранник',
          workSchedule: '2/2',
          hoursPerShift: 12,
          paymentType: 'HOURLY',
          hourlyRate: 220,
          positionsCount: 1,
          isActive: true
        },
        {
          objectId: object2.id,
          title: 'Охранник',
          workSchedule: '2/2',
          hoursPerShift: 12,
          paymentType: 'HOURLY',
          hourlyRate: 170,
          positionsCount: 4,
          isActive: true
        }
      ]
    })

    console.log('✅ Created positions')

    // Create employees
    await db.employee.createMany({
      data: [
        {
          name: 'Иванов Иван Иванович',
          position: 'Старший охранник',
          status: 'ACTIVE',
          workSchedule: '5/2',
          objectId: object1.id,
          paymentType: 'HOURLY',
          hourlyRate: 200,
          paymentMethod: 'CARD',
          hireDate: '2024-01-15'
        },
        {
          name: 'Петров Петр Петрович',
          position: 'Охранник',
          status: 'ACTIVE',
          workSchedule: '5/2',
          objectId: object1.id,
          paymentType: 'HOURLY',
          hourlyRate: 150,
          paymentMethod: 'CARD',
          hireDate: '2024-02-01'
        },
        {
          name: 'Сидоров Сидор Сидорович',
          position: 'Охранник',
          status: 'NOT_REGISTERED',
          workSchedule: '2/2',
          objectId: object2.id,
          paymentType: 'HOURLY',
          hourlyRate: 170,
          paymentMethod: 'CASH',
          hireDate: '2024-03-10'
        },
        {
          name: 'Кузнецов Кузьма Кузьмич',
          position: 'Старший охранник',
          status: 'FIRED',
          workSchedule: '2/2',
          objectId: object2.id,
          paymentType: 'HOURLY',
          hourlyRate: 220,
          paymentMethod: 'CARD',
          hireDate: '2023-12-01',
          terminationDate: '2024-06-15'
        }
      ]
    })

    console.log('✅ Created employees')

    // Create some sample time entries for current month
    const currentDate = new Date()
    const currentMonth = currentDate.toISOString().slice(0, 7) // YYYY-MM format
    
    const employees = await db.employee.findMany({
      where: { status: 'ACTIVE' }
    })

    for (const employee of employees) {
      // Create time entries for the first 15 days of current month
      for (let day = 1; day <= 15; day++) {
        const date = `${currentMonth}-${day.toString().padStart(2, '0')}`
        const dayOfWeek = new Date(date).getDay()
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue
        
        await db.timeEntry.create({
          data: {
            employeeId: employee.id,
            date: date,
            hours: 12,
            dayType: 'WORK',
            qualityScore: 4
          }
        })
      }
    }

    console.log('✅ Created time entries')

    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

seed()