import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settlement = await prisma.settlement.findUnique({
      where: { id: params.id },
      include: {
        load: true,
        driver: true
      }
    });
    
    if (!settlement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({
      ...settlement,
      status: settlement.paymentStatus
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settlement' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { status, paymentStatus, advances, deductions, reimbursements } = data;
    const targetStatus = status || paymentStatus;

    const currentSettlement = await prisma.settlement.findUnique({
      where: { id: params.id }
    });

    if (!currentSettlement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (targetStatus === 'PAID' && currentSettlement.paymentStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Must be APPROVED before PAID' }, { status: 400 });
    }

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
    if (advances !== undefined) updateData.advances = Number(advances);
    if (deductions !== undefined) updateData.deductions = Number(deductions);
    if (reimbursements !== undefined) updateData.reimbursements = Number(reimbursements);

    if (advances !== undefined || deductions !== undefined || reimbursements !== undefined) {
      const adv = updateData.advances ?? currentSettlement.advances;
      const ded = updateData.deductions ?? currentSettlement.deductions;
      const reimb = updateData.reimbursements ?? currentSettlement.reimbursements;
      updateData.balanceOwed = currentSettlement.driverShare - adv - ded + reimb;
    }

    const settlement = await prisma.settlement.update({
      where: { id: params.id },
      data: updateData
    });

    await createAuditLog({
      user,
      action: targetStatus === 'APPROVED' ? 'APPROVE' : 'UPDATE',
      entityType: 'Settlement',
      entityId: params.id,
      description: `Updated settlement status to ${targetStatus || 'updated'}`
    });

    return NextResponse.json({
      ...settlement,
      status: settlement.paymentStatus
    });
  } catch (error) {
    console.error('Error updating single settlement:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}
