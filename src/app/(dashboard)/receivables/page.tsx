'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Loading } from '@/components/ui/loading'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DollarSign, AlertCircle, Check, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  load: { id: string; loadNumber: string }
  broker: string | { id: string; name: string }
  invoiceDate: string
  dueDate: string
  amount: number
  status: string
  daysOverdue: number
}

export default function ReceivablesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentDialog, setPaymentDialog] = useState<{open: boolean, id: string | null}>({open: false, id: null})
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/receivables')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching receivables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!paymentDialog.id) return
    try {
      const res = await fetch(`/api/receivables/${paymentDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', amountReceived: parseFloat(paymentAmount) }),
      })
      if (res.ok) {
        setPaymentDialog({open: false, id: null})
        setPaymentAmount('')
        fetchData()
      } else {
        alert('Failed to update payment')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const totalOutstanding = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const overdueAmount = invoices.filter(i => i.daysOverdue > 0 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const paidThisMonth = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0) // Simplified
  
  const current = invoices.filter(i => i.daysOverdue <= 0 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const aging1_30 = invoices.filter(i => i.daysOverdue > 0 && i.daysOverdue <= 30 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const aging31_60 = invoices.filter(i => i.daysOverdue > 30 && i.daysOverdue <= 60 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const aging61_90 = invoices.filter(i => i.daysOverdue > 60 && i.daysOverdue <= 90 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const aging90Plus = invoices.filter(i => i.daysOverdue > 90 && i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0)

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paid This Month</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Days to Pay</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">--</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aging Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <div className="flex-1 min-w-[120px] p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-sm text-gray-500">Current</div>
              <div className="font-semibold">{formatCurrency(current)}</div>
            </div>
            <div className="flex-1 min-w-[120px] p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-sm text-yellow-700">1-30 Days</div>
              <div className="font-semibold text-yellow-700">{formatCurrency(aging1_30)}</div>
            </div>
            <div className="flex-1 min-w-[120px] p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-sm text-orange-700">31-60 Days</div>
              <div className="font-semibold text-orange-700">{formatCurrency(aging31_60)}</div>
            </div>
            <div className="flex-1 min-w-[120px] p-4 bg-red-50 rounded-lg text-center">
              <div className="text-sm text-red-700">61-90 Days</div>
              <div className="font-semibold text-red-700">{formatCurrency(aging61_90)}</div>
            </div>
            <div className="flex-1 min-w-[120px] p-4 bg-red-100 rounded-lg text-center">
              <div className="text-sm text-red-800">90+ Days</div>
              <div className="font-semibold text-red-800">{formatCurrency(aging90Plus)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Load #</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead>Inv. Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((i) => (
              <TableRow key={i.id} className={i.daysOverdue > 0 && i.status !== 'PAID' ? 'bg-red-50' : ''}>
                <TableCell>{i.invoiceNumber}</TableCell>
                <TableCell>{i.load.loadNumber}</TableCell>
                <TableCell>{typeof i.broker === 'string' ? i.broker : (i.broker?.name || 'N/A')}</TableCell>
                <TableCell>{formatDate(i.invoiceDate)}</TableCell>
                <TableCell>{formatDate(i.dueDate)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(i.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={i.status} />
                </TableCell>
                <TableCell>
                  {i.status !== 'PAID' && i.daysOverdue > 0 ? (
                    <span className="text-red-600 font-bold">{i.daysOverdue} days</span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {i.status !== 'PAID' && (
                    <Button size="sm" onClick={() => setPaymentDialog({open: true, id: i.id})}>
                      Mark Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={paymentDialog.open} onClose={() => setPaymentDialog({open: false, id: null})}>
        
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount Received</label>
              <input
                type="number"
                step="0.01"
                className="w-full border p-2 rounded"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleMarkPaid} className="w-full">
              Confirm Payment
            </Button>
          </div>
        
      </Dialog>
    </div>
  )
}
