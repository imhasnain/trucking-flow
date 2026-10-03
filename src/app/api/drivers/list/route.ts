import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const drivers = await prisma.driver.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, payRate: true }
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Drivers list GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
