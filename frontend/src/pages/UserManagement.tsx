import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Users, Plus, ShieldCheck, UserX, CheckCircle, Trash2,
  AlertTriangle, RefreshCw, XCircle, X, Shield
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'analyst' | 'viewer'>('analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<User[]>('/users');
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
          role
        })
      });
      setIsModalOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFullName('');
      setNotification({ message: `User account '${username}' successfully created.`, type: 'success' });
      fetchUsers();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to create user account.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    try {
      await apiRequest(`/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !targetUser.is_active })
      });
      setNotification({
        message: `User '${targetUser.username}' status set to ${!targetUser.is_active ? 'ACTIVE' : 'DISABLED'}.`,
        type: 'success'
      });
      fetchUsers();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to update user status', type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      await apiRequest(`/users/${userToDelete.id}`, { method: 'DELETE' });
      setNotification({
        message: `User account '${userToDelete.username}' was permanently removed.`,
        type: 'success'
      });
      setUserToDelete(null);
      fetchUsers();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to delete user account', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between font-mono text-xs shadow-lg ${
            notification.type === 'success'
              ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
              : 'bg-[#FB7185]/15 border-[#FB7185]/40 text-[#FB7185]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-[#34D399]" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
            )}
            <span className="font-bold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[#94A3B8] hover:text-[#E8EEF8]"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#38BDF8]" />
              Role-Based Access Control (RBAC) & User Management
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Administer platform user identities, assign role permissions (Admin, Analyst, Viewer), and manage account activation
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-[#111C32] hover:bg-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] border border-[#243149] transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision User</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. User Directory Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Username</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">RBAC Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Registered At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94A3B8]">Loading user directory...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94A3B8]">No user accounts registered.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#111C32] transition-colors">
                      <td className="p-3 font-bold text-[#94A3B8]">#{u.id}</td>
                      <td className="p-3 font-bold text-[#38BDF8]">
                        @{u.username} {isCurrent && <span className="text-[10px] text-[#34D399]">(You)</span>}
                      </td>
                      <td className="p-3 text-[#E8EEF8] font-sans">{u.full_name || '—'}</td>
                      <td className="p-3 text-[#94A3B8]">{u.email}</td>
                      <td className="p-3">
                        <StatusBadge status={u.role} type="role" />
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            u.is_active
                              ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40'
                              : 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40'
                          }`}
                        >
                          {u.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-3 text-[#94A3B8] text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isCurrent}
                              className="px-2 py-1 rounded bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] text-[10px] disabled:opacity-40"
                              title={u.is_active ? 'Deactivate account' : 'Activate account'}
                            >
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isCurrent}
                              className="p-1 rounded hover:bg-[#243149] text-[#FB7185] disabled:opacity-30"
                              title={isCurrent ? 'Cannot delete own account' : 'Delete user'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">Provision New Platform User</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">USERNAME</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="analyst3"
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">ROLE</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
                  >
                    <option value="analyst">Analyst (Standard SOC)</option>
                    <option value="admin">Admin (Full Control)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst3@cyvantis.soc"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">FULL NAME</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Security Analyst"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">INITIAL PASSWORD</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SecurePassword123!"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#0D1528] border border-[#FB7185]/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#FB7185]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Delete User Account</h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to delete user account <strong className="text-[#E8EEF8]">@{userToDelete.username}</strong> ({userToDelete.email})? This action is immutable.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-[#FB7185]/20 hover:bg-[#FB7185]/30 border border-[#FB7185]/50 text-[#FB7185] font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
