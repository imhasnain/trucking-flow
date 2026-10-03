import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const note = await prisma.researchNote.findUnique({
      where: { id: params.id }
    })

    if (!note) return new NextResponse("Not Found", { status: 404 })

    return NextResponse.json(note)
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
    if (!user || !canEdit(user)) return new NextResponse("Unauthorized", { status: 401 })

    const json = await request.json()
    
    const note = await prisma.researchNote.update({
      where: { id: params.id },
      data: json
    })

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'ResearchNote',
      description: `Updated note: ${note.title}`
    })

    return NextResponse.json(note)
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
    if (!user || !canEdit(user)) return new NextResponse("Unauthorized", { status: 401 })

    const note = await prisma.researchNote.delete({
      where: { id: params.id }
    })

    await createAuditLog({
      user,
      action: 'DELETE',
      entityType: 'ResearchNote',
      description: `Deleted note: ${note.title}`
    })

    return NextResponse.json(note)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
