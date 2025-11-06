import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const objects = await db.object.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        groupManager: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        _count: {
          select: {
            employees: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(objects)
  } catch (error) {
    console.error('Error fetching objects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch objects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const object = await db.object.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        managerId: data.managerId,
        groupManagerId: data.groupManagerId,
        status: data.status || 'ACTIVE'
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        groupManager: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json(object, { status: 201 })
  } catch (error) {
    console.error('Error creating object:', error)
    return NextResponse.json(
      { error: 'Failed to create object' },
      { status: 500 }
    )
  }
}