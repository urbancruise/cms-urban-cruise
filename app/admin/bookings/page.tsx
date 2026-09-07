"use client";

import { useState } from "react";
import { 
  MdOutlineCalendarToday, 
  MdOutlinePerson, 
  MdOutlineEmail, 
  MdOutlinePhone, 
  MdOutlineLocationOn, 
  MdOutlineAccessTime, 
  MdOutlineCheckCircle, 
  MdOutlineCancel,
  MdOutlineError,
  MdOutlineSearch
} from "react-icons/md";

const bookings = [
  { id: 1, customer: "Sarah Johnson", email: "sarah@email.com", cruise: "Mediterranean Cruise", date: "2024-02-15", guests: 2, status: "Confirmed", total: "$2,450" },
  { id: 2, customer: "Michael Chen", email: "michael@email.com", cruise: "Caribbean Paradise", date: "2024-02-14", guests: 4, status: "Pending", total: "$3,200" },
  { id: 3, customer: "Emily Davis", email: "emily@email.com", cruise: "Alaskan Adventure", date: "2024-02-13", guests: 2, status: "Completed", total: "$4,100" },
  { id: 4, customer: "Robert Wilson", email: "robert@email.com", cruise: "Norwegian Fjords", date: "2024-02-12", guests: 3, status: "Cancelled", total: "$5,600" },
  { id: 5, customer: "Lisa Anderson", email: "lisa@email.com", cruise: "Asian Discovery", date: "2024-02-11", guests: 2, status: "Confirmed", total: "$3,800" },
];

const getStatusColor = (status: string) => {
  const colors = {
    Confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status as keyof typeof colors] || colors.Pending;
};

const getStatusIcon = (status: string) => {
  const icons = {
    Confirmed: MdOutlineCheckCircle,
    Pending: MdOutlineAccessTime,
    Completed: MdOutlineCheckCircle,
    Cancelled: MdOutlineCancel,
  };
  return icons[status as keyof typeof icons] || MdOutlineError;
};

export default function BookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.cruise.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || booking.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage all cruise bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            View Calendar
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "Confirmed", "Pending", "Completed", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBookings.map((booking) => {
          const StatusIcon = getStatusIcon(booking.status);
          return (
            <div key={booking.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.customer}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{booking.cruise}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MdOutlineEmail className="w-4 h-4 text-gray-400" />
                  {booking.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MdOutlineCalendarToday className="w-4 h-4 text-gray-400" />
                  {booking.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MdOutlinePerson className="w-4 h-4 text-gray-400" />
                  {booking.guests} guests
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="text-gray-400">Total:</span>
                  {booking.total}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  View Details
                </button>
                <button className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <MdOutlineCalendarToday className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}