import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const vehicles = await prisma.vehicle.findMany({
      include: {
        _count: {
          select: { loads: true }
        }
      }
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const json = await request.json()
    
    if (!json.unitNumber) {
      return new NextResponse("Unit Number is required", { status: 400 })
    }

    const existing = await prisma.vehicle.findUnique({
      where: { unitNumber: json.unitNumber }
    })
    
    if (existing) {
      return new NextResponse("Unit Number already exists", { status: 400 })
    }

    const vehicle = await prisma.vehicle.create({
      data: json
    })

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'Vehicle',
      description: `Created vehicle unit ${vehicle.unitNumber}`
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
