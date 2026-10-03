'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Upload, AlertTriangle, CheckCircle, Eye, Download, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState('BOL');
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [loads, setLoads] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchLoads();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocs(data.documents || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoads = async () => {
    try {
      const res = await fetch('/api/loads');
      if (res.ok) {
        const data = await res.json();
        setLoads(data.loads || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('type', docType);
    if (selectedLoadId) formData.append('loadId', selectedLoadId);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowUploadModal(false);
        setFileToUpload(null);
        fetchData();
      } else {
        alert('Failed to upload file');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markVerified = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Documents
        </h1>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" /> Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Missing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.missing || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" /> Uploaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.uploaded || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.verified || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Load #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
                  <td className="px-6 py-4 text-sm">{doc.load?.loadNumber || 'General'}</td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.createdAt)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    {doc.filePath ? (
                      <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" title="View"><Eye className="w-4 h-4" /></Button>
                      </a>
                    ) : (
                      <span className="text-xs text-red-500 self-center">File Missing</span>
                    )}
                    {doc.status === 'UPLOADED' && (
                      <Button variant="outline" size="sm" onClick={() => markVerified(doc.id)} title="Verify Document">
                        <Check className="w-3.5 h-3.5 text-green-600 mr-1" /> Verify
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select 
              className="w-full border rounded-md p-2 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="BOL">Bill of Lading (BOL)</option>
              <option value="POD">Proof of Delivery (POD)</option>
              <option value="RATE_CONFIRMATION">Rate Confirmation</option>
              <option value="LUMPER_RECEIPT">Lumper Receipt</option>
              <option value="INSURANCE">Insurance Certificate</option>
              <option value="REGISTRATION">Vehicle Registration</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Associate with Load (Optional)</label>
            <select 
              className="w-full border rounded-md p-2 text-sm"
              value={selectedLoadId}
              onChange={(e) => setSelectedLoadId(e.target.value)}
            >
              <option value="">None (General Company Document)</option>
              {loads.map(l => (
                <option key={l.id} value={l.id}>{l.loadNumber} - {l.broker}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Select File (PDF, PNG, JPG)</label>
            <input 
              type="file" 
              className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-gray-100"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button type="submit" disabled={!fileToUpload}>Upload File</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
