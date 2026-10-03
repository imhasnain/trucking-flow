import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (loadId && loadId !== 'ALL') where.loadId = loadId;
    if (type && type !== 'ALL') where.type = type;
    if (status && status !== 'ALL') where.status = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        load: {
          select: { id: true, loadNumber: true, broker: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const allDocs = await prisma.document.findMany({ select: { status: true } });

    const summary = {
      total: allDocs.length,
      missing: allDocs.filter(d => d.status === 'MISSING').length,
      uploaded: allDocs.filter(d => d.status === 'UPLOADED').length,
      verified: allDocs.filter(d => d.status === 'VERIFIED').length
    };

    return NextResponse.json({ documents, summary });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
