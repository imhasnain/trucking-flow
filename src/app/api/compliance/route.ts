import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.complianceItem.findMany({
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const summary = { overdue: 0, dueSoon: 0, upcoming: 0, completed: 0 };
    
    const processedItems = items.map(item => {
      let status = item.status;
      if (status !== 'COMPLETED') {
        if (new Date(item.dueDate) < now) {
          status = 'OVERDUE';
          summary.overdue++;
        } else if (new Date(item.dueDate) <= sevenDaysFromNow) {
          status = 'DUE_SOON';
          summary.dueSoon++;
        } else {
          status = 'UPCOMING';
          summary.upcoming++;
        }
      } else {
        summary.completed++;
      }
      return { ...item, status };
    });

    return NextResponse.json({ items: processedItems, summary });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch compliance items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { title, type, dueDate, notes, priority, description, assignedTo } = data;

    if (!title || !type || !dueDate) {
      return NextResponse.json({ error: 'Title, type, and due date are required' }, { status: 400 });
    }

    const item = await prisma.complianceItem.create({
      data: {
        title,
        type,
        dueDate: new Date(dueDate),
        description: description || null,
        notes: notes || null,
        priority: priority || 'MEDIUM',
        assignedTo: assignedTo || null,
        status: 'UPCOMING'
      }
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'ComplianceItem',
      entityId: item.id,
      description: `Created compliance item: ${title}`
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating compliance item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
