import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const loads = await prisma.load.findMany({
      include: {
        driver: true,
        vehicle: true,
        settlement: true,
        commission: true
      },
      orderBy: { pickupDate: 'desc' }
    });

    // Generate CSV
    const headers = [
      'Load Number',
      'Broker',
      'Status',
      'Pickup Date',
      'Pickup Location',
      'Delivery Location',
      'Driver',
      'Vehicle Unit',
      'Gross Rate ($)',
      'Loaded Miles',
      'Driver Pay ($)',
      'Commission ($)',
      'Fuel Cost ($)'
    ];

    const rows = loads.map(l => [
      `"${l.loadNumber}"`,
      `"${l.broker}"`,
      `"${l.status}"`,
      `"${new Date(l.pickupDate).toISOString().split('T')[0]}"`,
      `"${l.pickupCity ? `${l.pickupCity}, ${l.pickupState}` : l.pickupLocation}"`,
      `"${l.deliveryCity ? `${l.deliveryCity}, ${l.deliveryState}` : l.deliveryLocation}"`,
      `"${l.driver?.name || 'Unassigned'}"`,
      `"${l.vehicle?.unitNumber || 'Unassigned'}"`,
      l.grossRate.toFixed(2),
      l.loadedMiles || 0,
      (l.settlement?.balanceOwed || 0).toFixed(2),
      (l.commission?.amountDue || 0).toFixed(2),
      l.fuelCost.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="truckflow-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
