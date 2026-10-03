'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Car, Plus, Wrench, Calendar, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    unitNumber: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    plateNumber: '',
    plateState: '',
    insuranceExpiry: '',
    registrationExp: '',
    currentMileage: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
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
    setEditingVehicle(null);
    setFormData({
      unitNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      vin: '',
      plateNumber: '',
      plateState: 'TX',
      insuranceExpiry: '',
      registrationExp: '',
      currentMileage: '',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const openEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      unitNumber: vehicle.unitNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year ? vehicle.year.toString() : '',
      vin: vehicle.vin || '',
      plateNumber: vehicle.plateNumber || '',
      plateState: vehicle.plateState || '',
      insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
      registrationExp: vehicle.registrationExp ? new Date(vehicle.registrationExp).toISOString().split('T')[0] : '',
      currentMileage: vehicle.currentMileage ? vehicle.currentMileage.toString() : '',
      status: vehicle.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        unitNumber: formData.unitNumber,
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin || null,
        plateNumber: formData.plateNumber || null,
        plateState: formData.plateState || null,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry) : null,
        registrationExp: formData.registrationExp ? new Date(formData.registrationExp) : null,
        currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
        status: formData.status
      };

      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchVehicles();
      } else {
        alert('Failed to save vehicle');
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
          <h1 className="text-3xl font-bold tracking-tight">Vehicles & Equipment</h1>
          <p className="text-sm text-gray-500">Track power units, trailers, registrations, and insurance deadlines</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle: any) => (
          <Card key={vehicle.id} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold">
                Unit {vehicle.unitNumber}
              </CardTitle>
              <Badge variant={vehicle.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {vehicle.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center text-gray-700 font-medium">
                  <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                  {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2 text-gray-500">VIN:</span>
                  <span className="font-mono text-xs">{vehicle.vin || 'N/A'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2 text-gray-500">Plate:</span>
                  <span>{vehicle.plateNumber || 'N/A'} {vehicle.plateState ? `(${vehicle.plateState})` : ''}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center text-gray-500">
                    <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                    Insurance:
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getExpiryColor(vehicle.insuranceExpiry)}`}>
                    {formatDate(vehicle.insuranceExpiry)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-500">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    Registration:
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getExpiryColor(vehicle.registrationExp)}`}>
                    {formatDate(vehicle.registrationExp)}
                  </span>
                </div>
                <div className="flex items-center pt-1 border-t mt-1 text-gray-600">
                  <span className="font-medium mr-2 text-gray-500">Mileage:</span>
                  <span className="font-semibold text-gray-800">
                    {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} mi` : 'N/A'}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => openEdit(vehicle)}>
                <Wrench className="mr-2 h-3.5 w-3.5" /> Edit Unit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicle Add / Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader>
          <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Number</label>
              <Input 
                required 
                placeholder="e.g. UNIT-001" 
                value={formData.unitNumber} 
                onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <Input 
                type="number"
                placeholder="2022" 
                value={formData.year} 
                onChange={e => setFormData({ ...formData, year: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <Input 
                placeholder="Freightliner" 
                value={formData.make} 
                onChange={e => setFormData({ ...formData, make: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <Input 
                placeholder="Cascadia" 
                value={formData.model} 
                onChange={e => setFormData({ ...formData, model: e.target.value })} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">VIN</label>
            <Input 
              placeholder="1FUJGLDR8NL..." 
              value={formData.vin} 
              onChange={e => setFormData({ ...formData, vin: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">License Plate</label>
              <Input 
                placeholder="TRK-9876" 
                value={formData.plateNumber} 
                onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plate State</label>
              <Input 
                placeholder="TX" 
                value={formData.plateState} 
                onChange={e => setFormData({ ...formData, plateState: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
              <Input 
                type="date" 
                value={formData.insuranceExpiry} 
                onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration Expiry</label>
              <Input 
                type="date" 
                value={formData.registrationExp} 
                onChange={e => setFormData({ ...formData, registrationExp: e.target.value })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Current Mileage</label>
              <Input 
                type="number" 
                placeholder="215000" 
                value={formData.currentMileage} 
                onChange={e => setFormData({ ...formData, currentMileage: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                className="w-full border rounded-md p-2 text-sm"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
