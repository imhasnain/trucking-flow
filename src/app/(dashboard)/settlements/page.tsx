'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Loading } from '@/components/ui/loading'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DollarSign, Check, Clock, Download } from 'lucide-react'
import { formatCurrency, getStatusColor } from '@/lib/utils'

interface Settlement {
  id: string
  load: { id: string; loadNumber: string }
  driver: { id: string; name: string }
  grossPay: number
  driverRate: number
  driverShare: number
  deductions: number
  balanceOwed: number
  status: string
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDriver, setFilterDriver] = useState('ALL')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchData()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settlements')
      if (res.ok) {
        const data = await res.json()
        setSettlements(data)
      }
    } catch (error) {
      console.error('Error fetching settlements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/settlements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const isOwner = currentUser?.role === 'OWNER'

  const filteredSettlements = settlements.filter(s => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false
    if (filterDriver !== 'ALL' && s.driver.id !== filterDriver) return false
    return true
  })

  const totalOwed = settlements.filter(s => s.status !== 'PAID').reduce((sum, s) => sum + s.balanceOwed, 0)
  const pendingApproval = settlements.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.balanceOwed, 0)
  const paidThisMonth = settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.balanceOwed, 0)

  const uniqueDrivers = Array.from(new Set(settlements.map(s => s.driver.id))).map(id => {
    return settlements.find(s => s.driver.id === id)?.driver
  })

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Driver Settlements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Owed</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOwed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingApproval)}</div>
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
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          className="border rounded-md p-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>

        <select 
          className="border rounded-md p-2"
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
        >
          <option value="ALL">All Drivers</option>
          {uniqueDrivers.map(d => d && (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Load #</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Share</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSettlements.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.load.loadNumber}</TableCell>
                <TableCell>{s.driver.name}</TableCell>
                <TableCell>{formatCurrency(s.grossPay)}</TableCell>
                <TableCell>{s.driverRate > 1 ? s.driverRate : Math.round(s.driverRate * 100)}%</TableCell>
                <TableCell>{formatCurrency(s.driverShare)}</TableCell>
                <TableCell className="text-red-500">-{formatCurrency(s.deductions)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(s.balanceOwed)}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isOwner && s.status === 'PENDING' && (
                      <Button size="sm" onClick={() => handleStatusUpdate(s.id, 'APPROVED')}>
                        Approve
                      </Button>
                    )}
                    {isOwner && s.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(s.id, 'PAID')}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
