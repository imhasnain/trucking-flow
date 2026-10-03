'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Loading } from '@/components/ui/loading'
import { DollarSign, Check, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Commission {
  id: string
  load: { id: string; loadNumber: string }
  dispatcherName?: string
  dispatcher?: { id: string; name: string }
  grossRate: number
  commissionRate: number
  amountDue: number
  status: string
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
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
      const res = await fetch('/api/commissions')
      if (res.ok) {
        const data = await res.json()
        setCommissions(data)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/commissions/${id}`, {
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

  const totalOwed = commissions.filter(c => c.status !== 'PAID').reduce((sum, c) => sum + c.amountDue, 0)
  const pendingApproval = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amountDue, 0)
  const paidThisMonth = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amountDue, 0)

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dispatch Commissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Commission Owed</CardTitle>
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Load #</TableHead>
              <TableHead>Dispatcher</TableHead>
              <TableHead>Gross Rate</TableHead>
              <TableHead>Comm. Rate</TableHead>
              <TableHead>Amount Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.load?.loadNumber || 'N/A'}</TableCell>
                <TableCell>{c.dispatcherName || c.dispatcher?.name || 'Michael'}</TableCell>
                <TableCell>{formatCurrency(c.grossRate)}</TableCell>
                <TableCell>{c.commissionRate > 1 ? c.commissionRate : Math.round(c.commissionRate * 100)}%</TableCell>
                <TableCell className="font-semibold">{formatCurrency(c.amountDue)}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isOwner && c.status === 'PENDING' && (
                      <Button size="sm" onClick={() => handleStatusUpdate(c.id, 'APPROVED')}>
                        Approve
                      </Button>
                    )}
                    {isOwner && c.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(c.id, 'PAID')}>
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
