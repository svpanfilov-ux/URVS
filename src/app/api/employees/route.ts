import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const objectId = searchParams.get('objectId')
    const status = searchParams.get('status')

    const whereClause: any = {}
    
    if (objectId) {
      whereClause.objectId = objectId
    }
    
    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        object: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            timeEntries: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const employee = await db.employee.create({
      data: {
        name: data.name,
        position: data.position,
        status: data.status || 'ACTIVE',
        workSchedule: data.workSchedule || '5/2',
        objectId: data.objectId,
        paymentType: data.paymentType || 'HOURLY',
        hourlyRate: data.hourlyRate,
        monthlySalary: data.monthlySalary,
        paymentMethod: data.paymentMethod || 'CARD',
        hireDate: data.hireDate,
        terminationDate: data.terminationDate
      },
      include: {
        object: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}