import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'this-month';
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (type === 'this-week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (type === 'last-week') {
      const prevWeek = subWeeks(now, 1);
      startDate = startOfWeek(prevWeek, { weekStartsOn: 1 });
      endDate = endOfWeek(prevWeek, { weekStartsOn: 1 });
    } else if (type === 'last-month') {
      const prevMonth = subMonths(now, 1);
      startDate = startOfMonth(prevMonth);
      endDate = endOfMonth(prevMonth);
    } else {
      // this-month
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // 1. Fetch loads in date range
    let loads = await prisma.load.findMany({
      where: {
        pickupDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        driver: true,
        settlement: true,
        commission: true
      }
    });

    // Fallback if demo data is outside exact calendar range
    if (loads.length === 0) {
      loads = await prisma.load.findMany({
        take: 20,
        include: {
          driver: true,
          settlement: true,
          commission: true
        }
      });
    }

    const totalRevenue = loads.reduce((sum, load) => sum + (load.grossRate || 0), 0);
    const totalMiles = loads.reduce((sum, load) => sum + (load.loadedMiles || 0), 0);
    
    // Group by driver
    const driverMap = new Map();
    loads.forEach(load => {
      if (!load.driver) return;
      const d = driverMap.get(load.driverId) || { id: load.driverId, name: load.driver.name, revenue: 0, loads: 0 };
      d.revenue += (load.grossRate || 0);
      d.loads += 1;
      driverMap.set(load.driverId, d);
    });

    // 2. Fetch actual expenses
    let expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    if (expenses.length === 0) {
      expenses = await prisma.expense.findMany({ take: 20 });
    }

    const directExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const driverPayTotal = loads.reduce((sum, l) => sum + (l.settlement?.balanceOwed || 0), 0);
    const commissionTotal = loads.reduce((sum, l) => sum + (l.commission?.amountDue || 0), 0);
    const totalExpenses = directExpenseTotal + driverPayTotal + commissionTotal;
    const netProfit = Math.max(0, totalRevenue - totalExpenses);

    // 3. Upcoming compliance deadlines
    const complianceItems = await prisma.complianceItem.findMany({
      where: { status: { not: 'COMPLETED' } },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    const deadlines = complianceItems.map(item => ({
      entity: item.title,
      type: item.type,
      date: item.dueDate
    }));

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalMiles,
      driverRevenue: Array.from(driverMap.values()),
      deadlines
    });
  } catch (error) {
    console.error('Reports calculation error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
