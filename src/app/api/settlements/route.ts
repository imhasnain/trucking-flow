import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    
    const whereClause: any = {};
    if (driverId && driverId !== 'ALL') whereClause.driverId = driverId;
    if (status && status !== 'ALL') whereClause.paymentStatus = status;

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: {
        load: {
          select: { id: true, loadNumber: true, grossRate: true }
        },
        driver: {
          select: { id: true, name: true, payRate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Normalize response with both paymentStatus and status for frontend compatibility
    const formatted = settlements.map(s => ({
      ...s,
      status: s.paymentStatus
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Only owners can approve or pay settlements' }, { status: 403 });
    }

    const data = await request.json();
    const { id, status } = data;

    const newPaymentStatus = status === 'PAID' ? 'PAID' : status === 'APPROVED' ? 'APPROVED' : status;

    const settlement = await prisma.settlement.update({
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
      entityType: 'Settlement',
      entityId: id,
      description: `Updated settlement status to ${newPaymentStatus}`
    });

    return NextResponse.json({
      ...settlement,
      status: settlement.paymentStatus
    });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}
