import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const broker = searchParams.get('broker');
    
    const whereClause: any = {};
    if (status && status !== 'ALL') whereClause.paymentStatus = status;
    if (broker && broker !== 'ALL') whereClause.broker = { contains: broker };

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        load: {
          select: { id: true, loadNumber: true, grossRate: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    
    const now = new Date();
    const invoicesWithDaysOverdue = invoices.map(inv => {
      const dueDate = new Date(inv.dueDate);
      const isPaid = inv.paymentStatus === 'PAID';
      const isOverdue = now > dueDate && !isPaid;
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      const daysOverdue = isOverdue ? diffDays : 0;
      const computedStatus = isPaid ? 'PAID' : (daysOverdue > 0 ? 'OVERDUE' : inv.paymentStatus);

      return {
        ...inv,
        daysOverdue,
        status: computedStatus
      };
    });

    return NextResponse.json(invoicesWithDaysOverdue);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const data = await request.json();
    const { loadId, broker, amount, dueDate, invoiceDate, invoiceNumber, factoringCompany, notes } = data;

    if (!loadId || !broker || !amount || !dueDate || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing required invoice fields' }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        loadId,
        broker,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        invoiceNumber,
        paymentStatus: 'UNPAID',
        factoringCompany,
        notes
      }
    });

    // Update load status to INVOICED if it is not already PAID
    await prisma.load.update({
      where: { id: loadId },
      data: { status: 'INVOICED' }
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Created invoice ${invoiceNumber} for load`
    });

    return NextResponse.json({
      ...invoice,
      status: invoice.paymentStatus
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Unauthorized - Owner approval required' }, { status: 403 });
    }

    const data = await request.json();
    const { id, status, amountReceived } = data;

    const currentInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!currentInvoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const received = amountReceived !== undefined ? Number(amountReceived) : currentInvoice.amount;
    const newStatus = status || (received >= currentInvoice.amount ? 'PAID' : 'PARTIAL');

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        paymentStatus: newStatus,
        amountReceived: received,
        dateReceived: newStatus === 'PAID' ? new Date() : undefined
      }
    });

    if (newStatus === 'PAID') {
      await prisma.load.update({
        where: { id: currentInvoice.loadId },
        data: { status: 'PAID' }
      });
    }

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      description: `Updated invoice ${invoice.invoiceNumber} to ${newStatus}`
    });

    return NextResponse.json({
      ...invoice,
      status: invoice.paymentStatus
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
