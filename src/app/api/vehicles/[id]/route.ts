import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isOwner } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        loads: true,
        expenses: true,
        documents: true
      }
    })

    if (!vehicle) return new NextResponse("Not Found", { status: 404 })

    return NextResponse.json(vehicle)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const json = await request.json()
    
    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: json
    })

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'Vehicle',
      description: `Updated vehicle unit ${vehicle.unitNumber}`
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !isOwner(user)) return new NextResponse("Unauthorized", { status: 401 })

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' }
    })

    await createAuditLog({
      user,
      action: 'DELETE',
      entityType: 'Vehicle',
      description: `Soft deleted vehicle unit ${vehicle.unitNumber}`
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
