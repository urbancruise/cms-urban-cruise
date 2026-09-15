"use client";

import { useState, useEffect } from "react";
import {
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineClose,
  MdOutlineSave,
  MdOutlineRefresh,
  MdOutlineSecurity,
  MdOutlineWarning,
  MdOutlineCheckCircle,
  MdOutlineError,
  MdOutlineDashboard,
  MdOutlineBarChart,
  MdOutlineGroup,
  MdOutlineLocationCity,
  MdOutlinePerson,
  MdOutlineAdminPanelSettings,
  MdOutlineHistory,
  MdOutlinePublic,
  MdOutlineHome,
  MdOutlineDirectionsCar,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface PermissionGroup {
  key: string;
  label: string;
  icon: any;
  children?: PermissionGroup[];
  permKey?: string; // leaf permission key
}

// ============================================================
// ALL PERMISSIONS — nested tree matching Sidebar structure
// ============================================================
const PERMISSION_TREE: PermissionGroup[] = [
  {
    key: "dashboard.view",
    label: "Dashboard",
    icon: MdOutlineDashboard,
    permKey: "dashboard.view",
  },
  {
    key: "analytics.view",
    label: "Analytics",
    icon: MdOutlineBarChart,
    permKey: "analytics.view",
  },
  {
    key: "activity.view",
    label: "Activity",
    icon: MdOutlineHistory,
    permKey: "activity.view",
  },
  {
    key: "users.view",
    label: "Users",
    icon: MdOutlineGroup,
    permKey: "users.view",
  },
  {
    key: "roles.view",
    label: "Roles",
    icon: MdOutlineAdminPanelSettings,
    permKey: "roles.view",
  },
  {
    key: "cities.view",
    label: "Cities",
    icon: MdOutlineLocationCity,
    permKey: "cities.view",
  },
  {
    key: "urbancruisewebsite.view",
    label: "Urban Cruise Website",
    icon: MdOutlinePublic,
    permKey: "urbancruisewebsite.view",
    children: [
      {
        key: "urbancruise.home.view",
        label: "Home",
        icon: MdOutlineHome,
        permKey: "urbancruise.home.view",
        children: [
          { key: "urbancruise.home.hero.view", label: "Hero", permKey: "urbancruise.home.hero.view" },
          { key: "urbancruise.home.quickcall.view", label: "Get a Quick Call", permKey: "urbancruise.home.quickcall.view" },
          { key: "urbancruise.home.about.view", label: "About", permKey: "urbancruise.home.about.view" },
          { key: "urbancruise.home.howitworks.view", label: "How It Works", permKey: "urbancruise.home.howitworks.view" },
          { key: "urbancruise.home.services.view", label: "We Offer Best Services", permKey: "urbancruise.home.services.view" },
          { key: "urbancruise.home.groupsize.view", label: "Vehicle For Every Group Size", permKey: "urbancruise.home.groupsize.view" },
          { key: "urbancruise.home.tempotraveller.view", label: "Tempo Traveller For Every Occasion", permKey: "urbancruise.home.tempotraveller.view" },
          { key: "urbancruise.home.whychoose.view", label: "Why Choose Urban Cruise", permKey: "urbancruise.home.whychoose.view" },
          { key: "urbancruise.home.testimonials.view", label: "Testimonials", permKey: "urbancruise.home.testimonials.view" },
          { key: "urbancruise.home.faqs.view", label: "FAQs", permKey: "urbancruise.home.faqs.view" },
          { key: "urbancruise.home.locations.view", label: "Service Locations", permKey: "urbancruise.home.locations.view" },
          { key: "urbancruise.home.partners.view", label: "Our Trusted Partners", permKey: "urbancruise.home.partners.view" },
          { key: "urbancruise.home.downloadapp.view", label: "Download Our App", permKey: "urbancruise.home.downloadapp.view" },
        ],
      },
      {
        key: "urbancruise.vehicles.view",
        label: "Our Vehicles",
        icon: MdOutlineDirectionsCar,
        permKey: "urbancruise.vehicles.view",
        children: [
          {
            key: "urbancruise.vehicles.carsuvs.view",
            label: "Car & SUVs",
            permKey: "urbancruise.vehicles.carsuvs.view",
            children: [
              { key: "urbancruise.vehicles.ertiga.view", label: "Ertiga", permKey: "urbancruise.vehicles.ertiga.view" },
              { key: "urbancruise.vehicles.innova.view", label: "Innova Crysta", permKey: "urbancruise.vehicles.innova.view" },
              { key: "urbancruise.vehicles.hycross.view", label: "Hycross", permKey: "urbancruise.vehicles.hycross.view" },
            ],
          },
          {
            key: "urbancruise.vehicles.luxury.view",
            label: "Luxury Cars, SUVs, Vans",
            permKey: "urbancruise.vehicles.luxury.view",
            children: [
              { key: "urbancruise.vehicles.luxurycars.view", label: "Luxury Cars & SUVs", permKey: "urbancruise.vehicles.luxurycars.view" },
              { key: "urbancruise.vehicles.sprinter.view", label: "Mercedes Sprinter", permKey: "urbancruise.vehicles.sprinter.view" },
              { key: "urbancruise.vehicles.luxuryvans.view", label: "Luxury Vans", permKey: "urbancruise.vehicles.luxuryvans.view" },
            ],
          },
          {
            key: "urbancruise.vehicles.tempo.view",
            label: "Tempo Traveller",
            permKey: "urbancruise.vehicles.tempo.view",
            children: [
              { key: "urbancruise.vehicles.tempotraveller.view", label: "Tempo Traveller", permKey: "urbancruise.vehicles.tempotraveller.view" },
              { key: "urbancruise.vehicles.maharaja.view", label: "Maharaja Tempo Traveller", permKey: "urbancruise.vehicles.maharaja.view" },
            ],
          },
          {
            key: "urbancruise.vehicles.urbania.view",
            label: "Urbania",
            permKey: "urbancruise.vehicles.urbania.view",
            children: [
              { key: "urbancruise.vehicles.urbania.main.view", label: "Urbania", permKey: "urbancruise.vehicles.urbania.main.view" },
            ],
          },
          {
            key: "urbancruise.vehicles.minibus.view",
            label: "Mini Bus",
            permKey: "urbancruise.vehicles.minibus.view",
            children: [
              { key: "urbancruise.vehicles.minibus.main.view", label: "Mini Bus", permKey: "urbancruise.vehicles.minibus.main.view" },
            ],
          },
          {
            key: "urbancruise.vehicles.luxurybuses.view",
            label: "Luxury Buses",
            permKey: "urbancruise.vehicles.luxurybuses.view",
            children: [
              { key: "urbancruise.vehicles.luxurybus.view", label: "Luxury Bus", permKey: "urbancruise.vehicles.luxurybus.view" },
              { key: "urbancruise.vehicles.volvo.view", label: "Volvo Bus", permKey: "urbancruise.vehicles.volvo.view" },
              { key: "urbancruise.vehicles.bharatbenz.view", label: "Bharat Benz Bus", permKey: "urbancruise.vehicles.bharatbenz.view" },
              { key: "urbancruise.vehicles.washroom.view", label: "Bus With Washroom", permKey: "urbancruise.vehicles.washroom.view" },
              { key: "urbancruise.vehicles.sleeper.view", label: "Sleeper | Semi Sleeper Bus", permKey: "urbancruise.vehicles.sleeper.view" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "profile.view",
    label: "Profile",
    icon: MdOutlinePerson,
    permKey: "profile.view",
  },
];

// ============================================================
// Flatten tree into a map of key → permKey for quick ops
// ============================================================
function collectAllKeys(nodes: PermissionGroup[]): string[] {
  const out: string[] = [];
  const walk = (list: PermissionGroup[]) => {
    list.forEach((n) => {
      if (n.permKey) out.push(n.permKey);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return out;
}

const ALL_PERMISSION_KEYS = collectAllKeys(PERMISSION_TREE);

// ============================================================
// Component
// ============================================================
const emptyForm = {
  name: "",
  slug: "",
  description: "",
  permissions: [] as string[],
  is_active: true,
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  const pushToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load roles");
      setRoles(data.roles || []);
    } catch (e: any) {
      pushToast("error", e.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Expand/collapse a group node
  const toggleExpand = (key: string) => {
    setExpandedNodes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isExpanded = (key: string) => expandedNodes.includes(key);

  // Toggle a single permission
  const togglePermission = (permKey: string) => {
    setFormData((prev) => {
      const has = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey],
      };
    });
  };

  // Toggle an entire branch (parent + all descendants)
  const toggleBranch = (node: PermissionGroup) => {
    const keys = collectAllKeys([node]);
    const allSelected = keys.every((k) => formData.permissions.includes(k));

    setFormData((prev) => {
      if (allSelected) {
        // Remove all
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !keys.includes(p)),
        };
      }
      // Add all
      const set = new Set([...prev.permissions, ...keys]);
      return { ...prev, permissions: Array.from(set) };
    });
  };

  const branchState = (
    node: PermissionGroup
  ): "all" | "some" | "none" => {
    const keys = collectAllKeys([node]);
    const selected = keys.filter((k) =>
      formData.permissions.includes(k)
    ).length;
    if (selected === 0) return "none";
    if (selected === keys.length) return "all";
    return "some";
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissions: [...ALL_PERMISSION_KEYS] }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissions: [] }));
  };

  const openCreate = () => {
    setEditingRole(null);
    setFormData(emptyForm);
    setFormError("");
    setExpandedNodes([]);
    setIsModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      is_active: role.is_active,
    });
    setFormError("");
    // Auto-expand all parents that have selected children
    const expand: string[] = [];
    const walk = (nodes: PermissionGroup[]) => {
      nodes.forEach((n) => {
        if (n.children) {
          const hasSelected = collectAllKeys([n]).some((k) =>
            (role.permissions || []).includes(k)
          );
          if (hasSelected) expand.push(n.key);
          walk(n.children);
        }
      });
    };
    walk(PERMISSION_TREE);
    setExpandedNodes(expand);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingRole ? prev.slug : slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save role");
      await fetchRoles();
      setIsModalOpen(false);
      pushToast(
        "success",
        editingRole ? "Role updated successfully" : "Role created successfully"
      );
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (role: Role) => {
    setDeletingRole(role);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/roles/${deletingRole.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete role");
      await fetchRoles();
      pushToast("success", `Role "${deletingRole.name}" deleted`);
      setDeletingRole(null);
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isProtectedRole = (role: Role) => role.slug === "admin";

  // Flatten lookup for table display: key → label
  const getLabelForKey = (key: string): string => {
    let label = key;
    const walk = (nodes: PermissionGroup[]) => {
      nodes.forEach((n) => {
        if (n.permKey === key) label = n.label;
        if (n.children) walk(n.children);
      });
    };
    walk(PERMISSION_TREE);
    return label;
  };

  // ============================================================
  // Recursive permission tree renderer
  // ============================================================
  const renderPermissionNode = (
    node: PermissionGroup,
    depth = 0
  ): React.ReactNode => {
    const hasChildren = Boolean(node.children?.length);
    const state = branchState(node);
    const expanded = isExpanded(node.key);
    const Icon = node.icon;
    const checkedCount = collectAllKeys([node]).filter((k) =>
      formData.permissions.includes(k)
    ).length;
    const totalCount = collectAllKeys([node]).length;

    const indent = depth * 20;

    return (
      <div key={node.key} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            state !== "none" ? "bg-teal-50/60" : "hover:bg-slate-50"
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.key)}
              className="p-0.5 rounded hover:bg-slate-200 transition-colors flex-shrink-0"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <MdOutlineKeyboardArrowDown className="w-4 h-4 text-slate-500" />
              ) : (
                <MdOutlineKeyboardArrowRight className="w-4 h-4 text-slate-500" />
              )}
            </button>
          ) : (
            <span className="w-5 flex-shrink-0" />
          )}

          {/* Checkbox */}
          {node.permKey ? (
            <input
              type="checkbox"
              checked={formData.permissions.includes(node.permKey)}
              onChange={() => togglePermission(node.permKey!)}
              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 flex-shrink-0"
            />
          ) : (
            <input
              type="checkbox"
              checked={state === "all"}
              ref={(el) => {
                if (el) el.indeterminate = state === "some";
              }}
              onChange={() => toggleBranch(node)}
              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 flex-shrink-0"
            />
          )}

          {/* Icon + Label */}
          {Icon && (
            <Icon
              className={`w-4 h-4 flex-shrink-0 ${
                state !== "none" ? "text-teal-600" : "text-slate-400"
              }`}
            />
          )}
          <span
            className={`text-sm flex-1 truncate ${
              state !== "none"
                ? "font-medium text-slate-900"
                : "text-slate-700"
            }`}
          >
            {node.label}
          </span>

          {/* Count badge for parents */}
          {hasChildren && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                checkedCount === 0
                  ? "bg-slate-100 text-slate-400"
                  : checkedCount === totalCount
                  ? "bg-teal-100 text-teal-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {checkedCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Children (only if expanded) */}
        {hasChildren && expanded && (
          <div className="mt-0.5">
            {node.children!.map((child) =>
              renderPermissionNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-8">
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[260px] ${
              t.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {t.type === "success" ? (
              <MdOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <MdOutlineError className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Roles Management
          </h1>
          <p className="text-slate-500 mt-1">
            Create roles with custom permissions ({roles.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRoles}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <MdOutlineAdd className="w-4 h-4" /> Add Role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Permissions
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
                {roles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No roles yet. Click "Add Role" to create one.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MdOutlineSecurity className="w-4 h-4 text-teal-600" />
                          <span className="font-medium text-slate-900">
                            {role.name}
                          </span>
                          {isProtectedRole(role) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {role.slug}
                      </td>
                      <td className="px-6 py-4">
                        {role.permissions && role.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {role.permissions.slice(0, 4).map((p) => (
                              <span
                                key={p}
                                className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium"
                              >
                                {getLabelForKey(p)}
                              </span>
                            ))}
                            {role.permissions.length > 4 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                +{role.permissions.length - 4} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No permissions
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            role.is_active
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(role)}
                            className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit role"
                          >
                            <MdOutlineEdit className="w-4 h-4 text-slate-400 hover:text-teal-600" />
                          </button>

                          {!isProtectedRole(role) ? (
                            <button
                              onClick={() => openDeleteModal(role)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete role"
                            >
                              <MdOutlineDelete className="w-4 h-4 text-slate-400 hover:text-red-600" />
                            </button>
                          ) : (
                            <div
                              className="p-1.5 opacity-40 cursor-not-allowed"
                              title="Admin role cannot be deleted"
                            >
                              <MdOutlineDelete className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================
          Create / Edit Modal
      ============================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingRole ? "Edit Role" : "Add New Role"}
                </h2>
                <p className="text-sm text-slate-500">
                  Set name, slug, and menu permissions
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MdOutlineClose className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-60"
                    placeholder="e.g., Content Editor"
                    required
                    disabled={editingRole?.slug === "admin"}
                  />
                  {editingRole?.slug === "admin" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Admin role cannot be renamed
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                    placeholder="content-editor"
                    required
                    disabled={!!editingRole}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.value === "active",
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="hidden sm:block" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="What can this role do?"
                />
              </div>

              {/* ============================================
                  PERMISSIONS — Recursive Tree
              ============================================ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MdOutlineSecurity className="w-4 h-4" />
                    Menu Access Permissions ({formData.permissions.length}{" "}
                    selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNodes(collectAllKeys(PERMISSION_TREE))
                      }
                      className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Expand All
                    </button>
                    <span className="text-xs text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setExpandedNodes([])}
                      className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Collapse All
                    </button>
                    <span className="text-xs text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Select which menu items users with this role can see. Click
                  the arrow to expand sub-sections. Parent checkboxes toggle all
                  children.
                </p>

                <div className="border border-slate-200 rounded-lg bg-white max-h-[420px] overflow-y-auto p-2">
                  {PERMISSION_TREE.map((node) => renderPermissionNode(node))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-sm"
                >
                  <MdOutlineSave className="w-4 h-4" />
                  {saving ? "Saving..." : editingRole ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          Delete Modal
      ============================================ */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdOutlineWarning className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Delete Role?
              </h2>
              <p className="text-slate-500 text-sm mb-1">
                You are about to delete the role:
              </p>
              <p className="font-semibold text-slate-900 mb-4">
                "{deletingRole.name}"
              </p>
              <p className="text-xs text-slate-400 mb-4">
                This action cannot be undone. Users assigned to this role will
                lose their permissions.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeletingRole(null);
                    setDeleteError("");
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 shadow-sm"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <MdOutlineDelete className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

