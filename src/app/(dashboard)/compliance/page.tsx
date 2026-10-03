'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Shield, Calendar, AlertTriangle, CheckCircle, Plus, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function CompliancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'table'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'MCS150',
    dueDate: '',
    priority: 'MEDIUM',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/compliance');
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Failed to fetch compliance items', error);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      await fetch(`/api/compliance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ title: '', type: 'MCS150', dueDate: '', priority: 'MEDIUM', notes: '' });
        fetchData();
      } else {
        alert('Failed to create compliance item');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <Loading />;

  // Group by month for calendar view
  const groupedByMonth: Record<string, any[]> = {};
  items.forEach(item => {
    const month = new Date(item.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    groupedByMonth[month].push(item);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Compliance Calendar
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setView(view === 'table' ? 'calendar' : 'table')}>
            {view === 'table' ? 'Calendar View' : 'Table View'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overdue || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" /> Due in 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.dueSoon || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" /> Due in 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.upcoming || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {view === 'table' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(item.dueDate)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      {item.status !== 'COMPLETED' && (
                        <Button variant="outline" size="sm" onClick={() => markComplete(item.id)}>
                          Mark Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedByMonth).map(month => (
            <Card key={month}>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-base font-semibold">{month}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {groupedByMonth[month].map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">Type: {item.type} • Due: {formatDate(item.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        {item.status !== 'COMPLETED' && (
                          <Button variant="outline" size="sm" onClick={() => markComplete(item.id)}>
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogHeader>
          <DialogTitle>Add Compliance Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input 
              required 
              placeholder="e.g. Annual Inspection UNIT-001" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              className="w-full border rounded-md p-2 text-sm"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="MCS150">MCS-150 Biennial Update</option>
              <option value="INSURANCE">Insurance Policy Renewal</option>
              <option value="OPERATING_AUTHORITY">Operating Authority</option>
              <option value="DRUG_TESTING">Drug & Alcohol Consortium</option>
              <option value="CDL_EXPIRY">CDL Expiration</option>
              <option value="MEDICAL_CARD">DOT Medical Card</option>
              <option value="VEHICLE_REGISTRATION">Vehicle Registration</option>
              <option value="IFTA">IFTA Quarterly Tax</option>
              <option value="IRP">IRP Apportioned Plate</option>
              <option value="HVUT">HVUT Form 2290</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Input 
              type="date" 
              required 
              value={formData.dueDate} 
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes / Description</label>
            <Input 
              placeholder="Reference number or notes" 
              value={formData.notes} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })} 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Save Item</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
