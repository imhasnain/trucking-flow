import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'Active' },
      select: { id: true, unitNumber: true }
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Vehicles list GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
