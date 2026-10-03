'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, Users, FileText, AlertTriangle, 
  Truck, Plus, Receipt, Shield, ArrowRight, AlertCircle, Info, FileWarning
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <AlertCircle className="mr-2" />
          <span>Error loading dashboard: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {/* Row 1: Primary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(data?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Net Profit (This Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(data?.estimatedNetProfit || 0)}</div>
          </CardContent>
        </Card>

        <Card className={`border-t-4 shadow-sm ${data?.unpaidDriverPay > 0 ? 'border-t-yellow-500' : 'border-t-slate-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Driver Pay</CardTitle>
            <Users className={`h-4 w-4 ${data?.unpaidDriverPay > 0 ? 'text-yellow-500' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(data?.unpaidDriverPay || 0)}</div>
          </CardContent>
        </Card>

        <Card className={`border-t-4 shadow-sm ${data?.outstandingInvoicesCount > 0 ? 'border-t-red-500' : 'border-t-slate-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle>
            <Receipt className={`h-4 w-4 ${data?.outstandingInvoicesCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data?.outstandingInvoicesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Secondary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-800">{formatCurrency(data?.unpaidCommissions || 0)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${data?.overdueInvoicesCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-800">{data?.overdueInvoicesCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Compliance (30d)</CardTitle>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-800">{data?.upcomingCompliance || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Missing Documents</CardTitle>
            <FileWarning className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-800">{data?.missingDocumentsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Alerts */}
        <div className="space-y-6 lg:col-span-1">
          {/* Alerts Section */}
          {data?.alerts && data.alerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Alerts</h2>
              <div className="space-y-2">
                {data.alerts.map((alert: any, idx: number) => {
                  let alertClasses = "";
                  let Icon = Info;
                  if (alert.type === 'danger') {
                    alertClasses = "bg-red-50 border-red-200 text-red-700";
                    Icon = AlertCircle;
                  } else if (alert.type === 'warning') {
                    alertClasses = "bg-yellow-50 border-yellow-200 text-yellow-800";
                    Icon = AlertTriangle;
                  } else if (alert.type === 'info') {
                    alertClasses = "bg-blue-50 border-blue-200 text-blue-700";
                    Icon = Info;
                  }
                  
                  return (
                    <div key={idx} className={`flex items-start p-3 border rounded-lg ${alertClasses}`}>
                      <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/loads/new" passHref>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">Add Load</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              </Link>
              <Link href="/expenses/new" passHref>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">Add Expense</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              </Link>
              <Link href="/documents" passHref>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">Upload Doc</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              </Link>
              <Link href="/reports" passHref>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">Reports</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Loads Table */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Loads</CardTitle>
              <Link href="/loads" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {data?.recentLoads && data.recentLoads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-md">Load #</th>
                        <th className="px-4 py-3">Broker</th>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right rounded-tr-md">Gross Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.recentLoads.map((load: any) => (
                        <tr key={load.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <Link href={`/loads/${load.id}`} className="text-blue-600 hover:underline">
                              {load.loadNumber || load.id.substring(0, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{load.broker || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {load.driver?.name || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={load.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(load.grossRate || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Truck className="h-12 w-12 mb-4 opacity-20" />
                  <p>No recent loads found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
