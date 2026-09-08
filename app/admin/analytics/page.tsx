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
  { label: "Total Revenue", value: "$128,459", change: "+12.5%", trend: "up", period: "vs last month" },
  { label: "Bookings", value: "1,234", change: "+8.2%", trend: "up", period: "vs last month" },
  { label: "Customer Growth", value: "342", change: "+23.7%", trend: "up", period: "vs last month" },
  { label: "Cancellation Rate", value: "4.8%", change: "-2.1%", trend: "down", period: "vs last month" },
];

const topCruises = [
  { name: "Mediterranean Cruise", bookings: 45, revenue: "$110,250" },
  { name: "Caribbean Paradise", bookings: 38, revenue: "$89,820" },
  { name: "Alaskan Adventure", bookings: 32, revenue: "$134,400" },
  { name: "Norwegian Fjords", bookings: 28, revenue: "$100,800" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your cruise business performance</p>
      </div>

      {/* Metric Cards */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Bookings</h2>
          <div className="flex items-end h-48 gap-2">
            {[65, 78, 90, 85, 95, 110, 105, 120, 135, 145, 130, 156].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                  style={{ height: `${(value / 156) * 100}%` }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Cruises</h2>
          <div className="space-y-4">
            {topCruises.map((cruise) => (
              <div key={cruise.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{cruise.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{cruise.revenue}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(cruise.bookings / 45) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{cruise.bookings} bookings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <MdOutlinePeople className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Customers</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">1,842</p>
            <p className="text-xs text-green-600">↑ 8.2% this month</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineCalendarToday className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Bookings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">89</p>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <MdOutlineTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">18.5%</p>
            <p className="text-xs text-green-600">↑ 2.3% this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

