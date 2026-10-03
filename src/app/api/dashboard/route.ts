import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { startOfMonth, endOfMonth, addDays } from 'date-fns';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const thirtyDaysFromNow = addDays(now, 30);

    // 1. Total Revenue (This Month / Delivered or later)
    const revenueLoads = await prisma.load.findMany({
      where: {
        status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
        pickupDate: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        }
      },
      select: { grossRate: true }
    });
    let totalRevenue = revenueLoads.reduce((sum: number, load: any) => sum + (Number(load.grossRate) || 0), 0);
    
    // If no loads in current calendar month (e.g. demo data in past/future), fallback to all active delivered/invoiced/paid loads
    if (totalRevenue === 0) {
      const allDeliveredLoads = await prisma.load.findMany({
        where: { status: { in: ['DELIVERED', 'INVOICED', 'PAID'] } },
        select: { grossRate: true }
      });
      totalRevenue = allDeliveredLoads.reduce((sum: number, load: any) => sum + (Number(load.grossRate) || 0), 0);
    }

    // 2. Expenses (This Month)
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        }
      },
      select: { amount: true }
    });
    let totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
    if (totalExpenses === 0) {
      const allExpenses = await prisma.expense.findMany({ select: { amount: true } });
      totalExpenses = allExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
    }

    // 3. Unpaid Driver Pay
    const unpaidSettlements = await prisma.settlement.findMany({
      where: { paymentStatus: { not: 'PAID' } },
      select: { balanceOwed: true }
    });
    const unpaidDriverPay = unpaidSettlements.reduce((sum: number, s: any) => sum + (Number(s.balanceOwed) || 0), 0);

    // 4. Unpaid Commissions
    const unpaidCommissionsRecords = await prisma.commission.findMany({
      where: { paymentStatus: { not: 'PAID' } },
      select: { amountDue: true }
    });
    const unpaidCommissions = unpaidCommissionsRecords.reduce((sum: number, c: any) => sum + (Number(c.amountDue) || 0), 0);

    // 5. Invoices
    const outstandingInvoicesCount = await prisma.invoice.count({
      where: { paymentStatus: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] } }
    });
    const overdueInvoicesCount = await prisma.invoice.count({
      where: { paymentStatus: 'OVERDUE' }
    });

    // 6. Estimated Net Profit
    const estimatedNetProfit = Math.max(0, totalRevenue - totalExpenses - unpaidDriverPay - unpaidCommissions);

    // 7. Compliance Due in next 30 days
    const upcomingCompliance = await prisma.complianceItem.count({
      where: {
        dueDate: {
          lte: thirtyDaysFromNow
        },
        status: { not: 'COMPLETED' }
      }
    });

    // 8. Missing Documents
    const missingDocumentsCount = await prisma.document.count({
      where: {
        status: 'MISSING'
      }
    });

    // 9. Recent Loads
    const recentLoads = await prisma.load.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: true,
        vehicle: true
      }
    });

    // 10. Alerts
    const alerts: { type: 'danger' | 'warning' | 'info'; message: string }[] = [];
    
    // Expiring insurance
    const expiringInsurance = await prisma.vehicle.count({
      where: {
        insuranceExpiry: {
          lte: thirtyDaysFromNow
        }
      }
    });
    if (expiringInsurance > 0) {
      alerts.push({
        type: 'danger',
        message: `${expiringInsurance} vehicle(s) have insurance expiring soon or expired.`,
      });
    }

    if (overdueInvoicesCount > 0) {
      alerts.push({
        type: 'danger',
        message: `${overdueInvoicesCount} overdue invoice(s) need attention.`,
      });
    }

    if (missingDocumentsCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${missingDocumentsCount} document(s) missing from load records.`,
      });
    }

    if (upcomingCompliance > 0) {
      alerts.push({
        type: 'warning',
        message: `${upcomingCompliance} compliance deadline(s) require action within 30 days.`,
      });
    }

    const pendingSettlements = await prisma.settlement.count({
      where: { paymentStatus: 'PENDING' }
    });
    if (pendingSettlements > 0) {
      alerts.push({
        type: 'info',
        message: `${pendingSettlements} driver settlement(s) awaiting approval.`,
      });
    }

    return NextResponse.json({
      totalRevenue,
      estimatedNetProfit,
      unpaidDriverPay,
      unpaidCommissions,
      outstandingInvoicesCount,
      overdueInvoicesCount,
      upcomingCompliance,
      missingDocumentsCount,
      recentLoads,
      alerts
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
