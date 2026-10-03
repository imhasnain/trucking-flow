import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (category && category !== 'ALL') where.category = category
    if (status) where.status = status

    const notes = await prisma.researchNote.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const json = await request.json()
    
    if (!json.title || !json.content) {
      return new NextResponse("Title and content are required", { status: 400 })
    }

    const note = await prisma.researchNote.create({
      data: json
    })

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'ResearchNote',
      description: `Created note: ${note.title}`
    })

    return NextResponse.json(note)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
