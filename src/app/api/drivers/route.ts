import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const drivers = await prisma.driver.findMany({
      include: {
        _count: {
          select: { loads: true }
        }
      }
    })

    return NextResponse.json(drivers)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const json = await request.json()
    const { name, ...data } = json

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        ...data,
      }
    })

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'Driver',
      description: `Created driver ${name}`
    })

    return NextResponse.json(driver)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
