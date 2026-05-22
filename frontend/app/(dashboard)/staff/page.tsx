'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, UserCheck, Edit, X, Shield } from 'lucide-react';
import api from '@/src/lib/api';
import type { User } from '@/src/types';
import { getStatusColor } from '@/src/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MANAGER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CASHIER: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  STAFF: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setStaff(res.data.data || []);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const toggleStatus = async (userId: string, isActive: boolean, name: string) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !isActive });
      toast.success(`${name} ${isActive ? 'deactivated' : 'activated'}`);
      fetchStaff();
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{staff.length} team members</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)
        ) : staff.length === 0 ? (
          <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No staff added yet</p>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className={`bg-card border rounded-xl p-5 transition-all ${!member.isActive ? 'opacity-60 border-dashed border-border' : 'border-border'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditUser(member); setShowForm(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">{member.firstName} {member.lastName}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ''}`}>
                  {member.role}
                </span>
                <button
                  onClick={() => toggleStatus(member.id, member.isActive ?? true, member.firstName)}
                  className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${member.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-red-100 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600'}`}
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              {(member as { lastLoginAt?: string }).lastLoginAt && (
                <p className="text-xs text-muted-foreground mt-2">Last login: {new Date((member as { lastLoginAt?: string }).lastLoginAt!).toLocaleDateString()}</p>
              )}
            </div>
          ))
        )}
      </div>

      {showForm && (
        <StaffFormModal user={editUser} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchStaff(); }} />
      )}
    </div>
  );
}

function StaffFormModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'CASHIER',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (user) {
        const { email: _, password, ...updateData } = form;
        void _;
        const payload: Record<string, unknown> = updateData;
        if (password) payload.password = password;
        await api.patch(`/users/${user.id}`, payload);
        toast.success('Staff updated');
      } else {
        await api.post('/users', form);
        toast.success('Staff added');
      }
      onSaved();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">{user ? 'Edit Staff' : 'Add Staff'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} minLength={8} placeholder="Min 8 characters" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm">
                <option value="CASHIER">Cashier</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {isLoading ? 'Saving...' : user ? 'Update' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
