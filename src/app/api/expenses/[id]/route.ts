import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner, canEdit } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { load: true, vehicle: true }
    });

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching expense' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !canEdit(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    if (data.date) data.date = new Date(data.date);
    if (data.amount !== undefined) data.amount = Number(data.amount);
    
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data
    });

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'Expense',
      entityId: expense.id,
      description: `Updated expense: ${expense.description}`
    });

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) return NextResponse.json({ error: 'Unauthorized - Owner only' }, { status: 401 });

    const expense = await prisma.expense.findUnique({ where: { id: params.id } });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await prisma.expense.delete({
      where: { id: params.id }
    });

    await createAuditLog({
      user,
      action: 'DELETE',
      entityType: 'Expense',
      entityId: params.id,
      description: `Deleted expense: ${expense.description}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting expense' }, { status: 500 });
  }
}
