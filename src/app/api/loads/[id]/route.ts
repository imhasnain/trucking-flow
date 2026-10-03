import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const load = await prisma.load.findUnique({
      where: { id: params.id },
      include: {
        driver: true,
        vehicle: true,
        documents: true,
        settlement: true,
        commission: true,
        invoice: true,
        expenses: true
      }
    });

    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    return NextResponse.json(load);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'DRIVER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const existingLoad = await prisma.load.findUnique({
      where: { id: params.id },
      include: { driver: true, settlement: true, commission: true }
    });
    if (!existingLoad) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    const pickupDate = data.pickupDate ? new Date(data.pickupDate) : existingLoad.pickupDate;
    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : existingLoad.deliveryDate;
    const grossRate = data.grossRate !== undefined ? Number(data.grossRate) : existingLoad.grossRate;
    const loadedMiles = data.loadedMiles !== undefined ? Number(data.loadedMiles) : existingLoad.loadedMiles;
    const ratePerMile = (loadedMiles && loadedMiles > 0) ? Number((grossRate / loadedMiles).toFixed(2)) : existingLoad.ratePerMile;

    const updatedLoad = await prisma.$transaction(async (tx: any) => {
      const load = await tx.load.update({
        where: { id: params.id },
        data: {
          status: data.status || existingLoad.status,
          broker: data.broker ?? existingLoad.broker,
          brokerContact: data.brokerContact ?? existingLoad.brokerContact,
          brokerPhone: data.brokerPhone ?? existingLoad.brokerPhone,
          brokerEmail: data.brokerEmail ?? existingLoad.brokerEmail,
          pickupLocation: data.pickupLocation ?? existingLoad.pickupLocation,
          pickupCity: data.pickupCity ?? existingLoad.pickupCity,
          pickupState: data.pickupState ?? existingLoad.pickupState,
          pickupDate,
          deliveryLocation: data.deliveryLocation ?? existingLoad.deliveryLocation,
          deliveryCity: data.deliveryCity ?? existingLoad.deliveryCity,
          deliveryState: data.deliveryState ?? existingLoad.deliveryState,
          deliveryDate,
          driverId: data.driverId !== undefined ? data.driverId : existingLoad.driverId,
          vehicleId: data.vehicleId !== undefined ? data.vehicleId : existingLoad.vehicleId,
          grossRate,
          ratePerMile,
          loadedMiles,
          deadheadMiles: data.deadheadMiles !== undefined ? Number(data.deadheadMiles) : existingLoad.deadheadMiles,
          accessorials: data.accessorials !== undefined ? Number(data.accessorials) : existingLoad.accessorials,
          lumperFee: data.lumperFee !== undefined ? Number(data.lumperFee) : existingLoad.lumperFee,
          fuelCost: data.fuelCost !== undefined ? Number(data.fuelCost) : existingLoad.fuelCost,
          tolls: data.tolls !== undefined ? Number(data.tolls) : existingLoad.tolls,
          notes: data.notes !== undefined ? data.notes : existingLoad.notes
        }
      });

      // If grossRate or driver changed, update settlement
      if (existingLoad.settlement && (data.grossRate !== undefined || data.driverId !== undefined)) {
        let driverRate = existingLoad.settlement.driverRate;
        if (data.driverId && data.driverId !== existingLoad.driverId) {
          const d = await tx.driver.findUnique({ where: { id: data.driverId } });
          if (d?.payRate) driverRate = d.payRate;
        }
        const driverShare = grossRate * driverRate;
        const balanceOwed = driverShare - existingLoad.settlement.advances - existingLoad.settlement.deductions + existingLoad.settlement.reimbursements;

        await tx.settlement.update({
          where: { id: existingLoad.settlement.id },
          data: {
            driverId: data.driverId || existingLoad.settlement.driverId,
            grossPay: grossRate,
            driverRate,
            driverShare,
            balanceOwed
          }
        });
      }

      // If grossRate changed, update commission
      if (existingLoad.commission && data.grossRate !== undefined) {
        await tx.commission.update({
          where: { id: existingLoad.commission.id },
          data: {
            grossRate,
            amountDue: grossRate * existingLoad.commission.commissionRate
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'Load',
          entityId: load.id,
          description: `Updated load ${load.loadNumber}`
        }
      });

      return load;
    });

    return NextResponse.json(updatedLoad);
  } catch (error: any) {
    console.error('Error updating load:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Unauthorized - Owner only' }, { status: 401 });

    const load = await prisma.load.findUnique({ where: { id: params.id } });
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    await prisma.$transaction(async (tx: any) => {
      // Clean up relations first to prevent foreign key errors
      await tx.document.deleteMany({ where: { loadId: params.id } });
      await tx.settlement.deleteMany({ where: { loadId: params.id } });
      await tx.commission.deleteMany({ where: { loadId: params.id } });
      await tx.invoice.deleteMany({ where: { loadId: params.id } });
      await tx.expense.deleteMany({ where: { loadId: params.id } });
      await tx.load.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          entityType: 'Load',
          entityId: load.id,
          description: `Deleted load ${load.loadNumber}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting load:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
