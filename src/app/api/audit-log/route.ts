import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isOwner } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !isOwner(user)) return new NextResponse("Unauthorized", { status: 401 })

    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(logs)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
