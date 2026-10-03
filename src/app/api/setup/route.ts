import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const userCount = await prisma.user.count();
    const loadCount = await prisma.load.count();

    return NextResponse.json({
      status: 'ok',
      message: 'Database initialized and seeded successfully!',
      stats: {
        users: userCount,
        loads: loadCount,
      },
      credentials: {
        owner: 'sam@truckflow.com / owner123',
        assistant: 'dh@truckflow.com / assistant123',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
