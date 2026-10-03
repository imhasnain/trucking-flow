import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: {
        load: { select: { id: true, loadNumber: true } },
        vehicle: { select: { id: true, unitNumber: true } }
      }
    });

    const summary = {
      total: expenses.reduce((acc, exp) => acc + exp.amount, 0),
      fuel: expenses.filter(e => e.category === 'FUEL').reduce((acc, exp) => acc + exp.amount, 0),
      maintenance: expenses.filter(e => e.category === 'MAINTENANCE').reduce((acc, exp) => acc + exp.amount, 0),
      insurance: expenses.filter(e => e.category === 'INSURANCE').reduce((acc, exp) => acc + exp.amount, 0),
      other: expenses.filter(e => !['FUEL', 'MAINTENANCE', 'INSURANCE'].includes(e.category)).reduce((acc, exp) => acc + exp.amount, 0)
    };

    return NextResponse.json({ expenses, summary });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { description, category, amount, date, vendor, reference, loadId, vehicleId, isOverhead, notes } = data;

    if (!description || !amount || !date) {
      return NextResponse.json({ error: 'Description, amount, and date are required' }, { status: 400 });
    }
    
    const expense = await prisma.expense.create({
      data: {
        description,
        category: category || 'OTHER',
        amount: Number(amount),
        date: new Date(date),
        vendor: vendor || null,
        reference: reference || null,
        loadId: loadId || null,
        vehicleId: vehicleId || null,
        isOverhead: Boolean(isOverhead),
        notes: notes || null
      }
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'Expense',
      entityId: expense.id,
      description: `Created expense: ${description} ($${amount})`
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 });
  }
}
