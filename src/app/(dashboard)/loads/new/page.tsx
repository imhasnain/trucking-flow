'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewLoadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    loadNumber: `LD-${Date.now().toString().slice(-6)}`,
    broker: '',
    brokerContact: '',
    brokerPhone: '',
    brokerEmail: '',
    pickupLocation: '',
    pickupCity: '',
    pickupState: '',
    pickupDate: '',
    deliveryLocation: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryDate: '',
    driverId: '',
    vehicleId: '',
    grossRate: '',
    loadedMiles: '',
    deadheadMiles: '',
    accessorials: '',
    lumperFee: '',
    fuelCost: '',
    tolls: '',
    notes: '',
    status: 'Available'
  });

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          fetch('/api/drivers/list'),
          fetch('/api/vehicles/list')
        ]);
        if (driversRes.ok) setDrivers(await driversRes.json());
        if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchSelectData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        grossRate: parseFloat(formData.grossRate) || 0,
        loadedMiles: parseInt(formData.loadedMiles) || 0,
        deadheadMiles: parseInt(formData.deadheadMiles) || 0,
        accessorials: parseFloat(formData.accessorials) || 0,
        lumperFee: parseFloat(formData.lumperFee) || 0,
        fuelCost: parseFloat(formData.fuelCost) || 0,
        tolls: parseFloat(formData.tolls) || 0,
      };

      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Load created successfully');
        router.push('/loads');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create load');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add New Load</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Load Number</label>
              <Input name="loadNumber" value={formData.loadNumber} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full"
                options={[
                  { value: 'Available', label: 'Available' },
                  { value: 'Dispatched', label: 'Dispatched' },
                  { value: 'EnRoute', label: 'EnRoute' }
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Broker</label>
              <Input name="broker" value={formData.broker} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Broker Contact Name</label>
              <Input name="brokerContact" value={formData.brokerContact} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Broker Phone</label>
              <Input name="brokerPhone" value={formData.brokerPhone} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Broker Email</label>
              <Input type="email" name="brokerEmail" value={formData.brokerEmail} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Route Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Pickup</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Facility Name / Address</label>
                <Input name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input name="pickupCity" value={formData.pickupCity} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <Input name="pickupState" value={formData.pickupState} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date & Time</label>
                <Input type="datetime-local" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Delivery</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Facility Name / Address</label>
                <Input name="deliveryLocation" value={formData.deliveryLocation} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <Input name="deliveryState" value={formData.deliveryState} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date & Time</label>
                <Input type="datetime-local" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assignment & Financials</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-1 block">Assign Driver</label>
              <Select name="driverId" value={formData.driverId} onChange={handleChange} className="w-full">
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-1 block">Assign Vehicle</label>
              <Select name="vehicleId" value={formData.vehicleId} onChange={handleChange} className="w-full">
                <option value="">Unassigned</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.unitNumber}</option>)}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-1 block">Gross Rate ($)</label>
              <Input type="number" step="0.01" name="grossRate" value={formData.grossRate} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Loaded Miles</label>
              <Input type="number" name="loadedMiles" value={formData.loadedMiles} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Deadhead Miles</label>
              <Input type="number" name="deadheadMiles" value={formData.deadheadMiles} onChange={handleChange} />
            </div>
            
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t mt-2">
               <div>
                <label className="text-sm font-medium mb-1 block">Accessorials ($)</label>
                <Input type="number" step="0.01" name="accessorials" value={formData.accessorials} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Lumper Fee ($)</label>
                <Input type="number" step="0.01" name="lumperFee" value={formData.lumperFee} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fuel Cost ($)</label>
                <Input type="number" step="0.01" name="fuelCost" value={formData.fuelCost} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tolls ($)</label>
                <Input type="number" step="0.01" name="tolls" value={formData.tolls} onChange={handleChange} />
              </div>
            </div>
            <div className="lg:col-span-4 pt-2">
              <label className="text-sm font-medium mb-1 block">Notes / Instructions</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Special instructions for the driver or broker..."
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push('/loads')}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Load'}</Button>
        </div>
      </form>
    </div>
  );
}
