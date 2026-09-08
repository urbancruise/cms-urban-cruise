"use client";

import { useState } from "react";
import { 
  MdOutlineSettings, 
  MdOutlineLanguage, 
  MdOutlineEmail, 
  MdOutlinePerson, 
  MdOutlineSecurity, 
  MdOutlineNotifications, 
  MdOutlinePalette, 
  MdOutlineStorage 
} from "react-icons/md";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: MdOutlineSettings },
    { id: "appearance", label: "Appearance", icon: MdOutlinePalette },
    { id: "email", label: "Email", icon: MdOutlineEmail },
    { id: "security", label: "Security", icon: MdOutlineSecurity },
    { id: "notifications", label: "Notifications", icon: MdOutlineNotifications },
    { id: "database", label: "Database", icon: MdOutlineStorage },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your CMS settings and preferences</p>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {tabs.find(t => t.id === activeTab)?.label} Settings
            </h2>

            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Urban Cruise"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Luxury cruise experiences around the world"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>UTC (GMT+0)</option>
                    <option>EST (GMT-5)</option>
                    <option>CST (GMT-6)</option>
                    <option>PST (GMT-8)</option>
                  </select>
                </div>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 border-2 border-blue-600 rounded-lg bg-white dark:bg-gray-900">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">Light</span>
                    </button>
                    <button className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-gray-900 text-white">
                      <span className="block text-sm font-medium">Dark</span>
                    </button>
                    <button className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-lg">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">System</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-600 ring-2 ring-blue-200" />
                    <button className="w-10 h-10 rounded-full bg-purple-600 border-2 border-gray-200" />
                    <button className="w-10 h-10 rounded-full bg-green-600 border-2 border-gray-200" />
                    <button className="w-10 h-10 rounded-full bg-red-600 border-2 border-gray-200" />
                    <button className="w-10 h-10 rounded-full bg-orange-600 border-2 border-gray-200" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    defaultValue="smtp.gmail.com"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      defaultValue="587"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Encryption
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>TLS</option>
                      <option>SSL</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@urbancruise.com"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Test Connection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

