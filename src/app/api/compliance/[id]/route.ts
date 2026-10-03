import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const item = await prisma.complianceItem.findUnique({
      where: { id: params.id }
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching item' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.status === 'COMPLETED') data.completedDate = new Date();
    
    const item = await prisma.complianceItem.update({
      where: { id: params.id },
      data
    });

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'ComplianceItem',
      entityId: item.id,
      description: `Updated compliance item: ${item.title}`
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const item = await prisma.complianceItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    await prisma.complianceItem.delete({
      where: { id: params.id }
    });

    await createAuditLog({
      user,
      action: 'DELETE',
      entityType: 'ComplianceItem',
      entityId: params.id,
      description: `Deleted compliance item: ${item.title}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting item' }, { status: 500 });
  }
}
