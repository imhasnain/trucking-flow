'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { Plus, Search, Filter, Download, Truck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LoadsPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/drivers/list');
        if (res.ok) {
          const data = await res.json();
          setDrivers(data);
        }
      } catch (error) {
        console.error('Failed to fetch drivers', error);
      }
    };
    fetchDrivers();
  }, []);

  useEffect(() => {
    const fetchLoads = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (statusFilter) queryParams.append('status', statusFilter);
        if (driverFilter) queryParams.append('driverId', driverFilter);

        const res = await fetch(`/api/loads?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLoads(data.loads || []);
        }
      } catch (error) {
        console.error('Failed to fetch loads', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchLoads, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, driverFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Load Register</h1>
        <Link href="/loads/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Load
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search load #, broker, city..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-48">
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Dispatched">Dispatched</option>
              <option value="EnRoute">EnRoute</option>
              <option value="Delivered">Delivered</option>
              <option value="Invoiced">Invoiced</option>
              <option value="Paid">Paid</option>
            </Select>
            <Select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="w-full md:w-48">
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" /> More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><Loading /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gross Rate</TableHead>
                  <TableHead className="text-right">Rate/Mile</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">No loads found.</TableCell>
                  </TableRow>
                ) : (
                  loads.map((load) => (
                    <TableRow key={load.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/loads/${load.id}`)}>
                      <TableCell className="font-medium">{load.loadNumber}</TableCell>
                      <TableCell>{load.broker}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{load.pickupCity ? `${load.pickupCity}, ${load.pickupState}` : load.pickupLocation}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(load.pickupDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{load.deliveryCity ? `${load.deliveryCity}, ${load.deliveryState}` : load.deliveryLocation}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(load.deliveryDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{load.driver?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <StatusBadge status={load.status} />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(load.grossRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(load.grossRate / (load.loadedMiles || 1))}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/loads/${load.id}`); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
