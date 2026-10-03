import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id: params.id },
      include: {
        load: true
      }
    });
    
    if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({
      ...commission,
      status: commission.paymentStatus
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch commission' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { status, paymentStatus } = data;
    const targetStatus = status || paymentStatus;

    const currentCommission = await prisma.commission.findUnique({
      where: { id: params.id }
    });

    if (!currentCommission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: any = {};
    if (targetStatus) {
      updateData.paymentStatus = targetStatus;
      if (targetStatus === 'APPROVED') {
        updateData.approvedBy = user.name;
        updateData.approvedAt = new Date();
      } else if (targetStatus === 'PAID') {
        updateData.paymentDate = new Date();
      }
    }

    const commission = await prisma.commission.update({
      where: { id: params.id },
      data: updateData
    });

    await createAuditLog({
      user,
      action: targetStatus === 'APPROVED' ? 'APPROVE' : 'UPDATE',
      entityType: 'Commission',
      entityId: params.id,
      description: `Updated commission status to ${targetStatus}`
    });

    return NextResponse.json({
      ...commission,
      status: commission.paymentStatus
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
