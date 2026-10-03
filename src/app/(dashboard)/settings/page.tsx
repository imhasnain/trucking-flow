'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, Clock, Building, Key } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function SettingsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-log')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings & Controls</h1>
        <p className="text-sm text-gray-500">Configure company profile, view team roles, and inspect security audit logs</p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">
            <Building className="mr-2 h-4 w-4" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Users & Permissions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="mr-2 h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>
        
        {/* Company Profile Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Primary operating authority and motor carrier information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase block font-semibold">Company Legal Name</span>
                  <span className="text-base font-bold text-gray-900">TruckFlow Logistics LLC</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase block font-semibold">USDOT Number</span>
                  <span className="text-base font-bold text-gray-900">3894721</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase block font-semibold">MC / FF Number</span>
                  <span className="text-base font-bold text-gray-900">MC-1489201-C</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase block font-semibold">Fleet Size</span>
                  <span className="text-base font-bold text-gray-900">2 Power Units (Class 8 Day Cabs)</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-blue-50/50 text-sm text-blue-900">
                <p className="font-semibold">Security Policy:</p>
                <p className="text-xs mt-1 text-blue-800">
                  Per company rules, all company profile updates, official filings, and financial authority modifications require Owner (Sam) approval.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active System Users</CardTitle>
              <CardDescription>Configured role-based access control (RBAC)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y border rounded-md">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Sam (Owner)</p>
                    <p className="text-xs text-gray-500">sam@truckflow.com • Full Administrator Authority</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    OWNER
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">DH (Operation Manager)</p>
                    <p className="text-xs text-gray-500">dh@truckflow.com • Operational Access (No Banking/Payments)</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    ASSISTANT
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Log</CardTitle>
              <CardDescription>Immutable record of operational changes and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loading text="Loading audit log..." />
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start border-b pb-3 last:border-0">
                      <div className="bg-slate-100 rounded-full p-2 mr-3 mt-0.5">
                        <Clock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                            {log.action}
                          </span>
                          <span className="text-xs font-medium text-gray-500">{log.entityType}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {log.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          By {log.user?.name || log.userId} • {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No audit records found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
