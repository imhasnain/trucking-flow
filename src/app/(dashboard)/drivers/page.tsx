'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Phone, CreditCard, Calendar, Edit, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cdlNumber: '',
    cdlExpiry: '',
    medicalCardExp: '',
    payRate: '30',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryColor = (dateStr: string) => {
    if (!dateStr) return 'bg-gray-100 text-gray-800';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-500 text-white';
    if (diffDays <= 30) return 'bg-red-100 text-red-800';
    if (diffDays <= 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const openAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      cdlNumber: '',
      cdlExpiry: '',
      medicalCardExp: '',
      payRate: '30',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const openEdit = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      cdlNumber: driver.cdlNumber || '',
      cdlExpiry: driver.cdlExpiry ? new Date(driver.cdlExpiry).toISOString().split('T')[0] : '',
      medicalCardExp: driver.medicalCardExp ? new Date(driver.medicalCardExp).toISOString().split('T')[0] : '',
      payRate: (driver.payRate > 1 ? driver.payRate : Math.round(driver.payRate * 100)).toString(),
      status: driver.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rateNum = parseFloat(formData.payRate) || 30;
      const normalizedRate = rateNum > 1 ? rateNum / 100 : rateNum;

      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        cdlNumber: formData.cdlNumber || null,
        cdlExpiry: formData.cdlExpiry ? new Date(formData.cdlExpiry) : null,
        medicalCardExp: formData.medicalCardExp ? new Date(formData.medicalCardExp) : null,
        payRate: normalizedRate,
        status: formData.status
      };

      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchDrivers();
      } else {
        alert('Failed to save driver');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-gray-500">Manage drivers, CDL compliance, and settlement pay rates</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Driver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver: any) => (
          <Card key={driver.id} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold">
                {driver.name}
              </CardTitle>
              <Badge variant={driver.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {driver.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {driver.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    {driver.phone}
                  </div>
                )}
                {driver.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    {driver.email}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  CDL: {driver.cdlNumber || 'N/A'}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center text-gray-500">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    CDL Expiry:
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getExpiryColor(driver.cdlExpiry)}`}>
                    {formatDate(driver.cdlExpiry)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-500">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    Med Card:
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getExpiryColor(driver.medicalCardExp)}`}>
                    {formatDate(driver.medicalCardExp)}
                  </span>
                </div>
                <div className="flex items-center pt-1 border-t mt-2">
                  <span className="font-medium mr-2 text-gray-700">Pay Rate:</span>
                  <span className="font-bold text-blue-600">
                    {driver.payRate > 1 ? driver.payRate : Math.round(driver.payRate * 100)}% of gross
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => openEdit(driver)}>
                <Edit className="mr-2 h-3.5 w-3.5" /> Edit Driver
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Driver Add / Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader>
          <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input 
              required 
              placeholder="e.g. Khadir Driver" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input 
                placeholder="(555) 123-4567" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input 
                type="email"
                placeholder="driver@example.com" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">CDL Number</label>
              <Input 
                placeholder="DL-12345678" 
                value={formData.cdlNumber} 
                onChange={e => setFormData({ ...formData, cdlNumber: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pay Rate (%)</label>
              <Input 
                type="number"
                placeholder="30" 
                value={formData.payRate} 
                onChange={e => setFormData({ ...formData, payRate: e.target.value })} 
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">CDL Expiry Date</label>
              <Input 
                type="date" 
                value={formData.cdlExpiry} 
                onChange={e => setFormData({ ...formData, cdlExpiry: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Medical Card Expiry</label>
              <Input 
                type="date" 
                value={formData.medicalCardExp} 
                onChange={e => setFormData({ ...formData, medicalCardExp: e.target.value })} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              className="w-full border rounded-md p-2 text-sm"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Driver</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
