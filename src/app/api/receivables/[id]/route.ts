import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        load: true
      }
    });
    
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({
      ...invoice,
      status: invoice.paymentStatus
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { status, paymentStatus, amountReceived } = data;
    const targetStatus = status || paymentStatus;

    const currentInvoice = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!currentInvoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: any = {};
    if (targetStatus) updateData.paymentStatus = targetStatus;
    if (amountReceived !== undefined) updateData.amountReceived = Number(amountReceived);
    if (targetStatus === 'PAID') {
      updateData.dateReceived = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData
    });

    if (targetStatus === 'PAID') {
      await prisma.load.update({
        where: { id: currentInvoice.loadId },
        data: { status: 'PAID' }
      });
    }

    await createAuditLog({
      user,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: params.id,
      description: `Updated invoice ${invoice.invoiceNumber} payment to ${targetStatus || 'updated'}`
    });

    return NextResponse.json({
      ...invoice,
      status: invoice.paymentStatus
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
