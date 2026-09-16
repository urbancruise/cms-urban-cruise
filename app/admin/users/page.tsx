'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';
import {
  TableSkeleton,
  ModalFormSkeleton,
} from '@/app/components/UI/PageSkeletons';
import {
  MdOutlinePersonAdd,
  MdOutlineSearch,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineVisibility,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlineBadge,
  MdOutlineLock,
  MdOutlineLocationOn,
  MdOutlineSecurity,
} from 'react-icons/md';
import Pagination from '@/app/components/UI/Pagination';
import CityPermissionTree, {
  CityAccess,
} from '@/app/components/UI/CityPermissionTree';
import AvatarUpload from '@/app/components/UI/AvatarUpload';
import {
  WEBSITE_PERMISSION_TREE,
  collectAllKeys,
} from '@/lib/permissionTree';

// ============================================
// Types
// ============================================
interface Role {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  permissions?: string[];
}

interface City {
  id: number;
  name: string;
  state: string | null;
  code: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null; // ✅ ADD
  role: string;
  role_id: number | null;
  role_name?: string | null;
  role_slug?: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  roles?: Role[];
  role_ids?: number[];
  cities?: City[];
  city_ids?: number[];
  city_permissions?: CityAccess[];
}

interface FormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  avatar_url: string | null; 
  avatar_public_id?: string | null; 
  role_ids: number[];
  is_active: boolean;
  city_ids: number[];
  city_permissions: CityAccess[];
}

const PAGE_SIZE = 10;

// ============================================
// UserForm
// ============================================
const UserForm = ({
  onSubmit,
  isEdit,
  formData,
  formErrors,
  formLoading,
  setFormData,
  onCancel,
  roles,
  cities,
}: {
  onSubmit: (e: React.FormEvent) => void;
  isEdit: boolean;
  formData: FormData;
  formErrors: Record<string, string>;
  formLoading: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onCancel: () => void;
  roles: Role[];
  cities: City[];
}) => {
  const toggleRole = (roleId: number) => {
    setFormData((prev) => {
      const has = prev.role_ids.includes(roleId);
      return {
        ...prev,
        role_ids: has
          ? prev.role_ids.filter((id) => id !== roleId)
          : [...prev.role_ids, roleId],
      };
    });
  };

  const allowedPermissions = useMemo<string[]>(() => {
    if (formData.role_ids.length === 0) return [];

    const selectedRoles = roles.filter((r) =>
      formData.role_ids.includes(r.id)
    );

    const set = new Set<string>();

    selectedRoles.forEach((role) => {
      const perms = role.permissions || [];

      if (role.slug === 'admin' || perms.includes('all')) {
        collectAllKeys(WEBSITE_PERMISSION_TREE).forEach((k) => set.add(k));
        return;
      }

      perms.forEach((p) => {
        if (
          p.startsWith('urbancruise') ||
          p.startsWith('urbancruisewebsite')
        ) {
          set.add(p);
        }
      });
    });

    return Array.from(set);
  }, [formData.role_ids, roles]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formErrors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {formErrors.general}
        </div>
      )}

      {/* ✅ AVATAR UPLOAD */}
      <div className="flex flex-col items-center pb-4 border-b border-slate-100">
        <AvatarUpload
          value={formData.avatar_url}
          name={formData.full_name || formData.username || '?'}
          onChange={(url, publicId) => {
            setFormData((prev) => ({
              ...prev,
              avatar_url: url,
              avatar_public_id: publicId || null,
            }));
          }}
          size={96}
        />
      </div>

      {/* Row 1: Username + Full Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Username *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlinePerson className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter username"
              required
              disabled={isEdit}
              autoComplete="off"
            />
          </div>
          {isEdit && (
            <p className="text-xs text-slate-400 mt-1">
              Username cannot be changed
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineBadge className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter full name"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Email + Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineEmail className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter email"
              required
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isEdit ? 'New Password (optional)' : 'Password *'}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineLock className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={
                isEdit ? 'Leave blank to keep current' : 'Enter password'
              }
              required={!isEdit}
              minLength={6}
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isEdit
              ? 'Leave blank to keep current password'
              : 'Min 6 characters'}
          </p>
        </div>
      </div>

      {/* Row 3: Roles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MdOutlineSecurity className="w-4 h-4" />
            Roles * ({formData.role_ids.length})
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  role_ids: roles.map((r) => r.id),
                }))
              }
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              All
            </button>
            <span className="text-xs text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, role_ids: [] }))}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {roles.length === 0 ? (
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-400 text-center">
            No roles available
          </div>
        ) : (
          <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-white">
            {roles.map((role) => {
              const checked = formData.role_ids.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    checked ? 'bg-teal-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role.id)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-900 flex-1">
                    {role.name}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {role.slug}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {formData.role_ids.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Select at least one role</p>
        )}
      </div>

      {/* Row 4: City-wise Website Access */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <MdOutlineLocationOn className="w-4 h-4" />
          City-wise Website Access ({formData.city_permissions.length} cities
          selected)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Grant this user access to specific Urban Cruise Website pages for
          each city. Only pages permitted by the selected role(s) are shown.
        </p>

        <CityPermissionTree
          cities={cities}
          value={formData.city_permissions}
          onChange={(next) =>
            setFormData((prev) => ({
              ...prev,
              city_permissions: next,
              city_ids: next.map((c) => c.city_id),
            }))
          }
          allowedPermissions={allowedPermissions}
          loading={roles.length === 0}
        />

        {formData.role_ids.length === 0 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <MdOutlineSecurity className="w-3.5 h-3.5" />
            Select at least one role to see available website pages.
          </p>
        )}
      </div>

      {/* Row 5: Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Status
        </label>
        <select
          value={formData.is_active ? 'active' : 'inactive'}
          onChange={(e) =>
            setFormData({
              ...formData,
              is_active: e.target.value === 'active',
            })
          }
          className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formLoading || formData.role_ids.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {formLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <MdOutlineSave className="w-4 h-4" />
              {isEdit ? 'Update User' : 'Create User'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================
// Main Page
// ============================================
export default function UsersManagementPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    avatar_url: null, 
    avatar_public_id: null, 
    role_ids: [],
    is_active: true,
    city_ids: [],
    city_permissions: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedRole, selectedStatus]);

  // ============================================
  // Users — SWR
  // ============================================
  const usersKey = useMemo(() => {
    const p = new URLSearchParams();
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String((page - 1) * PAGE_SIZE));
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (selectedRole !== 'All') p.set('role', selectedRole);
    if (selectedStatus !== 'All') p.set('status', selectedStatus);
    return `/api/admin/users?${p.toString()}`;
  }, [page, debouncedSearch, selectedRole, selectedStatus]);

  const {
    data: usersData,
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useSWR<{ users: User[]; total: number }>(usersKey, fetcher, {
    keepPreviousData: true,
  });

  const users = usersData?.users || [];
  const total = Number(usersData?.total) || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ============================================
  // Roles + Cities
  // ============================================
  const { data: rolesData } = useSWR<{ roles: Role[] }>(
    '/api/admin/roles',
    fetcher
  );
  const roles = (rolesData?.roles || []).filter((r) => r.is_active);

  const { data: citiesData } = useSWR<{ cities: City[] }>(
    '/api/admin/cities?active=true',
    fetcher
  );
  const cities = citiesData?.cities || [];

  // ============================================
  // Handlers
  // ============================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    try {
      const payload = {
  username: formData.username,
  email: formData.email,
  password: formData.password,
  full_name: formData.full_name,
  avatar_url: formData.avatar_url,
  role_ids: formData.role_ids,
  is_active: Boolean(formData.is_active),   // ✅
  city_ids: formData.city_ids,
  city_permissions: formData.city_permissions,
};

      console.log('POST payload:', payload);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('POST response:', data);
      if (!res.ok) {
        setFormErrors({ general: data.error || 'Failed to create user' });
        return;
      }
      await mutateUsers();
      resetForm();
      setIsCreateModalOpen(false);
      alert('User created successfully!');
    } catch (error) {
      console.error(error);
      setFormErrors({ general: 'Failed to create user. Please try again.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});
  setFormLoading(true);
  if (!selectedUser) return;

  try {
    const payload: any = {
  username: formData.username,
  email: formData.email,
  full_name: formData.full_name,
  avatar_url: formData.avatar_url,
  role_ids: formData.role_ids,
  is_active: Boolean(formData.is_active),   // ✅ Boolean में convert करें
  city_ids: formData.city_ids,
  city_permissions: formData.city_permissions,
};
    if (formData.password) payload.password = formData.password;

    // ✅ Debug log — browser console में देखें
    console.log('PUT payload:', payload);

    const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('PUT response:', data);   // ✅ Debug log

    if (!res.ok) {
      setFormErrors({ general: data.error || 'Failed to update user' });
      return;
    }
    await mutateUsers();
    resetForm();
    setIsEditModalOpen(false);
    alert('User updated successfully!');
  } catch (error) {
    console.error(error);
    setFormErrors({ general: 'Failed to update user. Please try again.' });
  } finally {
    setFormLoading(false);
  }
};

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin' || user.role_slug === 'admin') {
      alert('Cannot delete admin users!');
      return;
    }
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`))
      return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      await mutateUsers();
      alert('User deleted successfully!');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to delete user.');
    }
  };

  const openEditModal = (user: User) => {
  setSelectedUser(user);
  setFormData({
    username: user.username,
    email: user.email,
    password: '',
    full_name: user.full_name || '',
    avatar_url: user.avatar_url || null,
    avatar_public_id: null,
    role_ids: user.role_ids || (user.role_id ? [user.role_id] : []),
    is_active: Boolean(user.is_active),   // ✅ number → boolean
    city_ids: user.city_ids || [],
    city_permissions: user.city_permissions || [],
  });
  setFormErrors({});
  setIsEditModalOpen(true);
};

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      avatar_url: null, // ✅
      avatar_public_id: null, // ✅
      role_ids: [],
      is_active: true,
      city_ids: [],
      city_permissions: [],
    });
    setFormErrors({});
  };

  const getRoleBadgeColor = (slug: string) => {
    switch (slug?.toLowerCase()) {
      case 'admin':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'manager':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-teal-50 text-teal-700 border border-teal-200';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) =>
    isActive
      ? 'bg-teal-50 text-teal-700 border border-teal-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all users ({total} total)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <MdOutlinePersonAdd className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            onClick={() => mutateUsers()}
            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <MdOutlineRefresh className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Table */}
      {usersLoading && !usersData ? (
        <TableSkeleton rows={8} columns={6} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <p className="text-slate-400">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    City Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* ✅ User cell with avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.username}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {(user.full_name || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-sm text-slate-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.roles.map((r) => (
                            <span
                              key={r.id}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(
                                r.slug
                              )}`}
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.city_permissions &&
                      user.city_permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.city_permissions.slice(0, 3).map((cp) => {
                            const city = user.cities?.find(
                              (c) => c.id === cp.city_id
                            );
                            return (
                              <span
                                key={cp.city_id}
                                className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200"
                                title={`${cp.permissions.length} pages`}
                              >
                                {city?.name || `City #${cp.city_id}`}
                                <span className="ml-1 opacity-70">
                                  ({cp.permissions.length})
                                </span>
                              </span>
                            );
                          })}
                          {user.city_permissions.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              +{user.city_permissions.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(
                          user.is_active
                        )}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <MdOutlineVisibility className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                        </button>
                        {!(user.roles || []).some(
                          (r) => r.slug === 'admin'
                        ) &&
                          user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 border-t border-slate-200">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Add New User
                </h2>
                <p className="text-sm text-slate-500">
                  Assign roles and city-wise page access
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              {!rolesData || !citiesData ? (
                <ModalFormSkeleton />
              ) : (
                <UserForm
                  onSubmit={handleCreateUser}
                  isEdit={false}
                  formData={formData}
                  formErrors={formErrors}
                  formLoading={formLoading}
                  setFormData={setFormData}
                  onCancel={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  roles={roles}
                  cities={cities}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Edit User
                </h2>
                <p className="text-sm text-slate-500">
                  Update roles and city-wise page access
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              {!rolesData || !citiesData ? (
                <ModalFormSkeleton />
              ) : (
                <UserForm
                  onSubmit={handleUpdateUser}
                  isEdit={true}
                  formData={formData}
                  formErrors={formErrors}
                  formLoading={formLoading}
                  setFormData={setFormData}
                  onCancel={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  roles={roles}
                  cities={cities}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-900">
                User Details
              </h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {/* ✅ Avatar in view modal */}
                {selectedUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name || selectedUser.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                    {(selectedUser.full_name || selectedUser.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <p className="text-slate-500">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-900 font-medium">
                    {selectedUser.email}
                  </span>
                </div>

                <div className="py-2 border-b border-slate-100">
                  <span className="text-slate-500 block mb-2">
                    Roles ({selectedUser.roles?.length || 0})
                  </span>
                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.roles.map((r) => (
                        <span
                          key={r.id}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(
                            r.slug
                          )}`}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">No roles</span>
                  )}
                </div>

                <div className="py-2 border-b border-slate-100">
                  <span className="text-slate-500 block mb-2">
                    City-wise Website Access (
                    {selectedUser.city_permissions?.length || 0} cities)
                  </span>
                  {selectedUser.city_permissions &&
                  selectedUser.city_permissions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.city_permissions.map((cp) => {
                        const city = selectedUser.cities?.find(
                          (c) => c.id === cp.city_id
                        );
                        return (
                          <div
                            key={cp.city_id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-900">
                                {city?.name || `City #${cp.city_id}`}
                              </span>
                              <span className="text-xs text-teal-700 font-medium">
                                {cp.permissions.length} pages
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {cp.permissions.slice(0, 5).map((p) => (
                                <span
                                  key={p}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                                >
                                  {p.split('.').slice(-2, -1)[0]}
                                </span>
                              ))}
                              {cp.permissions.length > 5 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                  +{cp.permissions.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No city access assigned
                    </span>
                  )}
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(
                      selectedUser.is_active
                    )}`}
                  >
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Last Login</span>
                  <span className="text-slate-900">
                    {selectedUser.last_login
                      ? new Date(selectedUser.last_login).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
