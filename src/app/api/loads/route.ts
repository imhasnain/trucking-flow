import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { loadNumber: { contains: search } },
        { broker: { contains: search } },
        { pickupCity: { contains: search } },
        { deliveryCity: { contains: search } },
        { pickupLocation: { contains: search } },
        { deliveryLocation: { contains: search } }
      ];
    }
    
    if (status && status !== 'ALL') where.status = status;
    if (driverId && driverId !== 'ALL') where.driverId = driverId;

    const [loads, total] = await Promise.all([
      prisma.load.findMany({
        where,
        include: { driver: true, vehicle: true, settlement: true, invoice: true, documents: true },
        orderBy: { pickupDate: 'desc' },
      }),
      prisma.load.count({ where })
    ]);

    return NextResponse.json({ loads, total });
  } catch (error) {
    console.error('Loads GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'DRIVER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    if (!data.loadNumber || !data.broker || !data.pickupLocation || !data.deliveryLocation || !data.pickupDate || data.grossRate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert dates
    const pickupDate = new Date(data.pickupDate);
    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
    
    // Normalize status
    let status = data.status || 'BOOKED';
    if (status === 'Available') status = 'BOOKED';
    if (status === 'Dispatched' || status === 'EnRoute') status = 'IN_TRANSIT';
    if (status === 'Delivered') status = 'DELIVERED';
    if (status === 'Invoiced') status = 'INVOICED';
    if (status === 'Paid') status = 'PAID';

    const grossRate = Number(data.grossRate) || 0;
    const loadedMiles = Number(data.loadedMiles) || 0;
    const deadheadMiles = Number(data.deadheadMiles) || 0;
    const ratePerMile = loadedMiles > 0 ? Number((grossRate / loadedMiles).toFixed(2)) : null;

    // Validate driver pay rate
    let driverPayRate = 0.30; // default 30%
    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (driver && driver.payRate) driverPayRate = driver.payRate;
    }

    const load = await prisma.$transaction(async (tx: any) => {
      const newLoad = await tx.load.create({
        data: {
          loadNumber: data.loadNumber,
          status,
          broker: data.broker,
          brokerContact: data.brokerContact,
          brokerPhone: data.brokerPhone,
          brokerEmail: data.brokerEmail,
          pickupLocation: data.pickupLocation,
          pickupCity: data.pickupCity,
          pickupState: data.pickupState,
          pickupDate,
          deliveryLocation: data.deliveryLocation,
          deliveryCity: data.deliveryCity,
          deliveryState: data.deliveryState,
          deliveryDate,
          driverId: data.driverId || null,
          vehicleId: data.vehicleId || null,
          grossRate,
          ratePerMile,
          loadedMiles,
          deadheadMiles,
          accessorials: Number(data.accessorials) || 0,
          lumperFee: Number(data.lumperFee) || 0,
          fuelCost: Number(data.fuelCost) || 0,
          tolls: Number(data.tolls) || 0,
          notes: data.notes
        }
      });

      // Auto-create Driver Settlement if driver is assigned
      if (data.driverId) {
        const driverShare = grossRate * driverPayRate;
        await tx.settlement.create({
          data: {
            loadId: newLoad.id,
            driverId: data.driverId,
            grossPay: grossRate,
            driverRate: driverPayRate,
            driverShare,
            balanceOwed: driverShare,
            paymentStatus: 'PENDING'
          }
        });
      }

      // Auto-create Commission for Michael
      await tx.commission.create({
        data: {
          loadId: newLoad.id,
          dispatcherName: 'Michael',
          commissionRate: 0.10,
          grossRate,
          amountDue: grossRate * 0.10,
          paymentStatus: 'PENDING'
        }
      });

      // Auto-create placeholder documents for load tracking
      await tx.document.createMany({
        data: [
          { name: `Rate Confirmation - ${newLoad.loadNumber}`, type: 'RATE_CONFIRMATION', status: 'MISSING', loadId: newLoad.id },
          { name: `BOL - ${newLoad.loadNumber}`, type: 'BOL', status: 'MISSING', loadId: newLoad.id },
          { name: `POD - ${newLoad.loadNumber}`, type: 'POD', status: 'MISSING', loadId: newLoad.id },
        ]
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'Load',
          entityId: newLoad.id,
          description: `Created load ${newLoad.loadNumber} ($${grossRate})`
        }
      });

      return newLoad;
    });

    return NextResponse.json(load, { status: 201 });
  } catch (error: any) {
    console.error('Loads POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
