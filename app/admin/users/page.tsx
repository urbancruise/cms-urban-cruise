'use client';

import { useState, useEffect } from 'react';
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

interface Role {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
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
}

interface FormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role_ids: number[];
  is_active: boolean;
  city_ids: number[];
}

// ============================================
// Reusable UserForm — 2 inputs per row
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

  const toggleCity = (cityId: number) => {
    setFormData((prev) => {
      const has = prev.city_ids.includes(cityId);
      return {
        ...prev,
        city_ids: has
          ? prev.city_ids.filter((id) => id !== cityId)
          : [...prev.city_ids, cityId],
      };
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formErrors.general && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {formErrors.general}
        </div>
      )}

      {/* ============ Row 1: Username + Full Name ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlinePerson className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
              disabled={isEdit}
              autoComplete="off"
            />
          </div>
          {isEdit && (
            <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineBadge className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* ============ Row 2: Email + Password ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineEmail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              required
              autoComplete="off"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isEdit ? 'New Password (optional)' : 'Password *'}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MdOutlineLock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
              required={!isEdit}
              minLength={6}
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isEdit ? 'Leave blank to keep current password' : 'Min 6 characters'}
          </p>
        </div>
      </div>

      {/* ============ Row 3: Roles + Cities side-by-side ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Multiple Roles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MdOutlineSecurity className="w-4 h-4" />
              Roles * ({formData.role_ids.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({ ...p, role_ids: roles.map((r) => r.id) }))
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                All
              </button>
              <span className="text-xs text-gray-300">|</span>
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
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500 text-center">
              No roles available
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-2 space-y-1 bg-white dark:bg-gray-900">
              {roles.map((role) => {
                const checked = formData.role_ids.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white flex-1">
                      {role.name}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
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

        {/* Multiple Cities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MdOutlineLocationOn className="w-4 h-4" />
              Cities ({formData.city_ids.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({ ...p, city_ids: cities.map((c) => c.id) }))
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                All
              </button>
              <span className="text-xs text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, city_ids: [] }))}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {cities.length === 0 ? (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500 text-center">
              No cities available
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-2 space-y-1 bg-white dark:bg-gray-900">
              {cities.map((city) => {
                const checked = formData.city_ids.includes(city.id);
                return (
                  <label
                    key={city.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCity(city.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white flex-1">
                      {city.name}
                      {city.state && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({city.state})
                        </span>
                      )}
                    </span>
                    {city.code && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {city.code}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ Row 4: Status ============ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          value={formData.is_active ? 'active' : 'inactive'}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.value === 'active' })
          }
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formLoading || formData.role_ids.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    role_ids: [],
    is_active: true,
    city_ids: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCities();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name &&
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedRole !== 'All') {
      filtered = filtered.filter(
        (user) =>
          (user.roles || []).some((r) => r.slug === selectedRole) ||
          user.role_slug === selectedRole ||
          user.role === selectedRole
      );
    }
    if (selectedStatus !== 'All') {
      filtered = filtered.filter((user) =>
        selectedStatus === 'Active' ? user.is_active : !user.is_active
      );
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (res.ok) {
        setRoles((data.roles || []).filter((r: Role) => r.is_active));
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/admin/cities?active=true');
      const data = await res.json();
      if (res.ok) setCities(data.cities || []);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors({ general: data.error || 'Failed to create user' });
        return;
      }
      await fetchUsers();
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
        role_ids: formData.role_ids,
        is_active: formData.is_active,
        city_ids: formData.city_ids,
      };
      if (formData.password) payload.password = formData.password;

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors({ general: data.error || 'Failed to update user' });
        return;
      }
      await fetchUsers();
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
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      await fetchUsers();
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
      role_ids: user.role_ids || (user.role_id ? [user.role_id] : []),
      is_active: user.is_active,
      city_ids: user.city_ids || [],
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
      role_ids: [],
      is_active: true,
      city_ids: [],
    });
    setFormErrors({});
  };

  const getRoleBadgeColor = (slug: string) => {
    switch (slug?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'manager':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) =>
    isActive
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all users ({users.length} total)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <MdOutlinePersonAdd className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            onClick={() => {
              fetchUsers();
              fetchRoles();
              fetchCities();
            }}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MdOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(user.full_name || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.full_name || user.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {user.roles && user.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.roles.map((r) => (
                              <span
                                key={r.id}
                                className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(r.slug)}`}
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.cities && user.cities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.cities.slice(0, 3).map((c) => (
                              <span
                                key={c.id}
                                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              >
                                {c.name}
                              </span>
                            ))}
                            {user.cities.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                +{user.cities.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(user.is_active)}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(user)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="View"
                          >
                            <MdOutlineVisibility className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <MdOutlineEdit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          {!(user.roles || []).some((r) => r.slug === 'admin') &&
                            user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <MdOutlineDelete className="w-4 h-4 text-gray-400 hover:text-red-600" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add New User
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Assign multiple roles and cities access
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
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
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit User
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update roles and cities access
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
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
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Details
              </h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {(selectedUser.full_name || selectedUser.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    @{selectedUser.username}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedUser.email}
                  </span>
                </div>

                <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400 block mb-2">
                    Roles ({selectedUser.roles?.length || 0})
                  </span>
                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.roles.map((r) => (
                        <span
                          key={r.id}
                          className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(r.slug)}`}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No roles</span>
                  )}
                </div>

                <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400 block mb-2">
                    Cities Access ({selectedUser.cities?.length || 0})
                  </span>
                  {selectedUser.cities && selectedUser.cities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.cities.map((c) => (
                        <span
                          key={c.id}
                          className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        >
                          {c.name}
                          {c.code && (
                            <span className="ml-1 font-mono opacity-70">
                              {c.code}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No cities assigned</span>
                  )}
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedUser.is_active)}`}
                  >
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Last Login</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedUser.last_login
                      ? new Date(selectedUser.last_login).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
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

