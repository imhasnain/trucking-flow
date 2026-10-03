'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StickyNote, Plus, ExternalLink, Trash2, Edit } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'FMCSA_DOT',
    content: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    externalUrl: ''
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      category: 'FMCSA_DOT',
      content: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      externalUrl: ''
    });
    setShowModal(true);
  };

  const openEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      category: note.category,
      content: note.content,
      priority: note.priority || 'MEDIUM',
      status: note.status || 'OPEN',
      externalUrl: note.externalUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchNotes();
      } else {
        alert('Failed to save note');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this research note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = categoryFilter === 'ALL' 
    ? notes 
    : notes.filter((n: any) => n.category === categoryFilter);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research & Operations Notes</h1>
          <p className="text-sm text-gray-500">Document FMCSA rules, software findings, broker contacts, and industry intelligence</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['ALL', 'FMCSA_DOT', 'SOFTWARE', 'BOX_TRUCK', 'FREIGHT_SOURCES', 'WEBSITE_IT', 'OTHER'].map(cat => (
          <Button 
            key={cat} 
            variant={categoryFilter === cat ? "default" : "outline"}
            onClick={() => setCategoryFilter(cat)}
            size="sm"
          >
            {cat.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note: any) => (
          <Card key={note.id} className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base font-semibold">
                  {note.title}
                </CardTitle>
                <Badge variant={note.status === 'RESOLVED' ? 'secondary' : 'default'} className="text-xs">
                  {note.status}
                </Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{note.category}</Badge>
                {note.priority === 'HIGH' && <Badge variant="destructive" className="text-xs">High Priority</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {note.content}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-3 mt-2">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(note)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(note.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {note.externalUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={note.externalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Link
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
        {filteredNotes.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No notes found in this category.
          </div>
        )}
      </div>

      {/* Add / Edit Note Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader>
          <DialogTitle>{editingNote ? 'Edit Research Note' : 'Add New Note'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input 
              required 
              placeholder="e.g. FMCSA Medical Card Reporting Rule" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                className="w-full border rounded-md p-2 text-sm"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="FMCSA_DOT">FMCSA / DOT</option>
                <option value="SOFTWARE">Software & Tools</option>
                <option value="BOX_TRUCK">Box Truck Specs</option>
                <option value="FREIGHT_SOURCES">Freight Sources</option>
                <option value="WEBSITE_IT">Website & IT</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select 
                className="w-full border rounded-md p-2 text-sm"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content / Findings</label>
            <textarea 
              required
              rows={4}
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Detailed notes, requirements, contacts, or summary..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">External Link / URL (Optional)</label>
            <Input 
              placeholder="https://fmcsa.dot.gov/..." 
              value={formData.externalUrl} 
              onChange={e => setFormData({ ...formData, externalUrl: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              className="w-full border rounded-md p-2 text-sm"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved / Documented</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Note</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
