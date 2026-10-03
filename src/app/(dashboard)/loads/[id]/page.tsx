'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Loading } from '@/components/ui/loading';
import { 
  Truck, ArrowLeft, Calendar, MapPin, DollarSign, FileText, 
  Users, CheckCircle, Upload, AlertTriangle, Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loadId = params.id as string;

  const [load, setLoad] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState('BOL');

  useEffect(() => {
    fetchLoad();
    fetchUser();
  }, [loadId]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) setCurrentUser(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoad = async () => {
    try {
      const res = await fetch(`/api/loads/${loadId}`);
      if (res.ok) {
        setLoad(await res.json());
      } else {
        router.push('/loads');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/loads/${loadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLoad();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this load? This will remove all associated documents, settlements, and commissions.')) return;
    try {
      const res = await fetch(`/api/loads/${loadId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/loads');
      } else {
        alert('Failed to delete load. Make sure you are logged in as Owner.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('type', docType);
    formData.append('loadId', loadId);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setFileToUpload(null);
        fetchLoad();
      } else {
        alert('Failed to upload document');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loading text="Loading load details..." />;
  if (!load) return <div className="p-8">Load not found.</div>;

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/loads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{load.loadNumber}</h1>
              <StatusBadge status={load.status} />
            </div>
            <p className="text-sm text-gray-500">Broker: {load.broker}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          {load.status === 'BOOKED' && (
            <Button size="sm" onClick={() => handleStatusChange('IN_TRANSIT')} disabled={updating}>
              Mark In Transit
            </Button>
          )}
          {load.status === 'IN_TRANSIT' && (
            <Button size="sm" onClick={() => handleStatusChange('DELIVERED')} disabled={updating} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" /> Mark Delivered
            </Button>
          )}
          {load.status === 'DELIVERED' && (
            <Button size="sm" onClick={() => handleStatusChange('INVOICED')} disabled={updating}>
              Mark Invoiced
            </Button>
          )}
          {load.status === 'INVOICED' && isOwner && (
            <Button size="sm" onClick={() => handleStatusChange('PAID')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
              Mark Paid
            </Button>
          )}

          {isOwner && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-blue-600" /> Route & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-l-2 border-blue-500 pl-4 space-y-1">
                <span className="text-xs font-semibold text-blue-600 uppercase">Pickup</span>
                <p className="font-medium text-gray-900">{load.pickupLocation}</p>
                <p className="text-sm text-gray-500">{load.pickupCity ? `${load.pickupCity}, ${load.pickupState}` : ''}</p>
                <div className="flex items-center text-xs text-gray-500 pt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(load.pickupDate)}
                </div>
              </div>

              <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
                <span className="text-xs font-semibold text-emerald-600 uppercase">Delivery</span>
                <p className="font-medium text-gray-900">{load.deliveryLocation}</p>
                <p className="text-sm text-gray-500">{load.deliveryCity ? `${load.deliveryCity}, ${load.deliveryState}` : ''}</p>
                <div className="flex items-center text-xs text-gray-500 pt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(load.deliveryDate)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-indigo-600" /> Load Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y border rounded-md">
                {load.documents && load.documents.length > 0 ? (
                  load.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-800">{doc.name}</p>
                          <span className="text-xs text-gray-400">{doc.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={doc.status} />
                        {doc.filePath && (
                          <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-gray-500 text-center">No documents uploaded yet.</p>
                )}
              </div>

              {/* Upload Form */}
              <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-3 pt-2">
                <select 
                  className="border rounded-md px-3 py-1.5 text-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="RATE_CONFIRMATION">Rate Confirmation</option>
                  <option value="BOL">Bill of Lading (BOL)</option>
                  <option value="POD">Proof of Delivery (POD)</option>
                  <option value="LUMPER_RECEIPT">Lumper Receipt</option>
                  <option value="OTHER">Other</option>
                </select>
                <input 
                  type="file" 
                  className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  required
                />
                <Button type="submit" size="sm" disabled={!fileToUpload}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financials & Assignments */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Gross Rate:</span>
                <span className="font-bold text-gray-900">{formatCurrency(load.grossRate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Miles:</span>
                <span>{load.loadedMiles || 0} loaded ({load.deadheadMiles || 0} deadhead)</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Rate / Mile:</span>
                <span>{load.ratePerMile ? `$${load.ratePerMile}/mi` : 'N/A'}</span>
              </div>
              {load.settlement && (
                <div className="flex justify-between py-1 border-b text-orange-600">
                  <span>Driver Pay ({Math.round(load.settlement.driverRate * 100)}%):</span>
                  <span>-{formatCurrency(load.settlement.balanceOwed)}</span>
                </div>
              )}
              {load.commission && (
                <div className="flex justify-between py-1 border-b text-purple-600">
                  <span>Dispatch (Michael - 10%):</span>
                  <span>-{formatCurrency(load.commission.amountDue)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 pt-2 font-bold text-base text-emerald-700">
                <span>Est. Net to Company:</span>
                <span>
                  {formatCurrency(
                    load.grossRate - 
                    (load.settlement?.balanceOwed || 0) - 
                    (load.commission?.amountDue || 0) - 
                    (load.fuelCost || 0) - 
                    (load.tolls || 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-slate-600" /> Assignment & Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase">Driver</span>
                <p className="font-medium text-gray-900">{load.driver?.name || 'Unassigned'}</p>
                {load.driver?.phone && <p className="text-xs text-gray-500">{load.driver.phone}</p>}
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-400 uppercase">Vehicle</span>
                <p className="font-medium text-gray-900">
                  {load.vehicle ? `Unit ${load.vehicle.unitNumber} (${load.vehicle.make || ''} ${load.vehicle.model || ''})` : 'Unassigned'}
                </p>
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-400 uppercase">Broker Contacts</span>
                <p className="font-medium text-gray-900">{load.broker}</p>
                {load.brokerContact && <p className="text-xs text-gray-500">Contact: {load.brokerContact}</p>}
                {load.brokerPhone && <p className="text-xs text-gray-500">Phone: {load.brokerPhone}</p>}
                {load.brokerEmail && <p className="text-xs text-gray-500">Email: {load.brokerEmail}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
