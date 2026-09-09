"use client";

import { 
  MdOutlineBarChart, 
  MdOutlineTrendingUp, 
  MdOutlinePeople, 
  MdOutlineCalendarToday, 
  MdOutlineAttachMoney,
  MdOutlineArrowUpward,
  MdOutlineArrowDownward
} from "react-icons/md";

const metrics = [
  { label: "Total Users", value: "4", change: "+25%", trend: "up", period: "vs last month" },
  { label: "Active Users", value: "4", change: "+25%", trend: "up", period: "vs last month" },
  { label: "Revenue", value: "$0", change: "0%", trend: "up", period: "vs last month" },
  { label: "Growth Rate", value: "100%", change: "+100%", trend: "up", period: "vs last month" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
                {metric.trend === 'up' ? <MdOutlineArrowUpward className="w-4 h-4" /> : <MdOutlineArrowDownward className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{metric.period}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Activity</h2>
          <div className="flex items-end h-48 gap-2">
            {[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                  style={{ height: `${(value / 4) * 100}%` }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Admin Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Manager Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Regular Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <MdOutlinePeople className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
            <p className="text-xs text-green-600">↑ 25% this month</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineCalendarToday className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
            <p className="text-xs text-green-600">↑ 25% this month</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Growth Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">100%</p>
            <p className="text-xs text-green-600">↑ 100% this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}