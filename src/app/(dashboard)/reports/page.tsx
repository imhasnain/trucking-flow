'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('this-month')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?type=${dateRange}`)
      .then(res => res.json())
      .then(data => {
        setReportData(data)
        setLoading(false)
      })
  }, [dateRange])

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    window.open(`/api/reports/export?type=${dateRange}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex gap-2">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="this-week">This Week</option>
            <option value="last-week">Last Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
          </select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {loading || !reportData ? (
        <div>Loading reports...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.netProfit || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Miles</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalMiles?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Driver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.driverRevenue?.map((dr: any) => (
                    <div key={dr.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium leading-none">{dr.name}</p>
                        <p className="text-sm text-muted-foreground">{dr.loads} loads</p>
                      </div>
                      <div className="font-medium">{formatCurrency(dr.revenue)}</div>
                    </div>
                  ))}
                  {(!reportData.driverRevenue || reportData.driverRevenue.length === 0) && (
                    <div className="text-sm text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Compliance Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.deadlines?.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{d.entity}</span>
                        <span className="text-xs text-muted-foreground">{d.type}</span>
                      </div>
                      <span className="text-sm text-red-500 font-medium">{formatDate(d.date)}</span>
                    </div>
                  ))}
                  {(!reportData.deadlines || reportData.deadlines.length === 0) && (
                    <div className="text-sm text-muted-foreground">No upcoming deadlines</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
