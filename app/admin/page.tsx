/* eslint-disable react/no-unescaped-entities */
import { 
  MdOutlineAnchor, 
  MdOutlinePeople, 
  MdOutlineCalendarToday, 
  MdOutlineAttachMoney,
  MdOutlineTrendingUp,
  MdOutlineTrendingDown,
  MdOutlineArrowForward
} from "react-icons/md";
import Link from "next/link";

const stats = [
  {
    icon: MdOutlineAnchor,
    label: "Total Cruises",
    value: "24",
    change: "+12.5%",
    trend: "up",
    color: "blue",
  },
  {
    icon: MdOutlinePeople,
    label: "Active Customers",
    value: "1,842",
    change: "+8.2%",
    trend: "up",
    color: "green",
  },
  {
    icon: MdOutlineCalendarToday,
    label: "Bookings This Month",
    value: "156",
    change: "-3.1%",
    trend: "down",
    color: "purple",
  },
  {
    icon: MdOutlineAttachMoney,
    label: "Revenue",
    value: "$48,293",
    change: "+23.7%",
    trend: "up",
    color: "orange",
  },
];

const recentBookings = [
  { id: 1, customer: "Sarah Johnson", cruise: "Mediterranean Cruise", date: "2024-02-15", status: "Confirmed", amount: "$2,450" },
  { id: 2, customer: "Michael Chen", cruise: "Caribbean Paradise", date: "2024-02-14", status: "Pending", amount: "$3,200" },
  { id: 3, customer: "Emily Davis", cruise: "Alaskan Adventure", date: "2024-02-13", status: "Completed", amount: "$4,100" },
];

export default function AdminDashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your cruises.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                  {stat.trend === 'up' ? <MdOutlineTrendingUp className="w-4 h-4" /> : <MdOutlineTrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All
              <MdOutlineArrowForward className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{booking.customer}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{booking.cruise}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/cruises" className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400">
              <MdOutlineAnchor className="w-5 h-5" />
              <span className="font-medium">Add New Cruise</span>
            </Link>
            <Link href="/admin/customers" className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-purple-600 dark:text-purple-400">
              <MdOutlinePeople className="w-5 h-5" />
              <span className="font-medium">Manage Customers</span>
            </Link>
            <Link href="/admin/bookings" className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600 dark:text-green-400">
              <MdOutlineCalendarToday className="w-5 h-5" />
              <span className="font-medium">View Calendar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

