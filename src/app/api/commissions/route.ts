import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dispatcher = searchParams.get('dispatcher');
    const status = searchParams.get('status');
    
    const whereClause: any = {};
    if (dispatcher && dispatcher !== 'ALL') whereClause.dispatcherName = dispatcher;
    if (status && status !== 'ALL') whereClause.paymentStatus = status;

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      include: {
        load: {
          select: { id: true, loadNumber: true, grossRate: true, broker: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = commissions.map(c => ({
      ...c,
      status: c.paymentStatus
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Only owners can approve or pay commissions' }, { status: 403 });
    }

    const data = await request.json();
    const { id, status } = data;

    const newPaymentStatus = status === 'PAID' ? 'PAID' : status === 'APPROVED' ? 'APPROVED' : status;

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        paymentStatus: newPaymentStatus,
        paymentDate: newPaymentStatus === 'PAID' ? new Date() : undefined,
        approvedBy: newPaymentStatus === 'APPROVED' || newPaymentStatus === 'PAID' ? user.name : undefined,
        approvedAt: newPaymentStatus === 'APPROVED' || newPaymentStatus === 'PAID' ? new Date() : undefined,
      }
    });

    await createAuditLog({
      user,
      action: newPaymentStatus === 'APPROVED' ? 'APPROVE' : 'UPDATE',
      entityType: 'Commission',
      entityId: id,
      description: `Updated commission status to ${newPaymentStatus}`
    });

    return NextResponse.json({
      ...commission,
      status: commission.paymentStatus
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
