"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { ProfileSkeleton } from "@/app/components/UI/PageSkeletons";
import {
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlineBadge,
  MdOutlineSecurity,
  MdOutlineEdit,
  MdOutlineSave,
  MdOutlineCancel,
} from "react-icons/md";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    username: user?.username || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        username: user.username || "",
      });
    }
  }, [user]);

  // ✅ Skeleton while user loads
  if (!user) {
    return <ProfileSkeleton />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">
          View and manage your account information
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-teal-500 to-teal-600">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {(user.full_name || user.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {user.full_name || user.username}
              </h2>
              <p className="text-slate-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              {isEditing ? (
                <>
                  <MdOutlineCancel className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <MdOutlineEdit className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MdOutlinePerson className="w-4 h-4" />
                Username
              </div>
              <p className="text-slate-900 font-medium">{user.username}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MdOutlineEmail className="w-4 h-4" />
                Email Address
              </div>
              <p className="text-slate-900 font-medium">{user.email}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MdOutlineBadge className="w-4 h-4" />
                Full Name
              </div>
              <p className="text-slate-900 font-medium">
                {user.full_name || "Not set"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MdOutlineSecurity className="w-4 h-4" />
                Role
              </div>
              <p className="text-slate-900 font-medium capitalize">
                {user.role}
              </p>
            </div>
          </div>

          {isEditing && (
            <form
              onSubmit={handleSubmit}
              className="mt-8 pt-8 border-t border-slate-200"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Edit Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Username cannot be changed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdOutlineSave className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: user.full_name || "",
                      email: user.email || "",
                      username: user.username || "",
                    });
                    setMessage(null);
                  }}
                  className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Member Since</p>
          <p className="text-lg font-semibold text-slate-900">
            {new Date(user.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Last Login</p>
          <p className="text-lg font-semibold text-slate-900">
            {user.last_login
              ? new Date(user.last_login).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "First time login"}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Account Status</p>
          <p className="text-lg font-semibold">
            {user.is_active ? (
              <span className="text-green-600">Active</span>
            ) : (
              <span className="text-red-600">Inactive</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
