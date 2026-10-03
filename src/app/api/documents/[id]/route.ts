import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { load: true }
    });

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching document' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status } = await request.json();
    
    const doc = await prisma.document.update({
      where: { id: params.id },
      data: { status }
    });

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'Document',
      entityId: doc.id,
      description: `Verified document: ${doc.name}`
    });

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating document' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await prisma.document.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.document.delete({
      where: { id: params.id }
    });

    await createAuditLog({
      user,
      action: 'DELETE',
      entityType: 'Document',
      entityId: params.id,
      description: `Deleted document: ${doc.name}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting document' }, { status: 500 });
  }
}
