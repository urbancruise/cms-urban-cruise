"use client";

import { useState } from "react";
import { 
  MdOutlinePeople, 
  MdOutlineEmail, 
  MdOutlinePhone, 
  MdOutlineLocationOn, 
  MdOutlineCalendarToday, 
  MdOutlineSearch, 
  MdOutlineMoreVert,
  MdOutlinePersonAdd
} from "react-icons/md";

const customers = [
  { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1 234-567-890", location: "New York, USA", joined: "2024-01-15", bookings: 3 },
  { id: 2, name: "Michael Chen", email: "michael@email.com", phone: "+1 234-567-891", location: "San Francisco, USA", joined: "2024-01-20", bookings: 2 },
  { id: 3, name: "Emily Davis", email: "emily@email.com", phone: "+1 234-567-892", location: "London, UK", joined: "2024-01-25", bookings: 4 },
  { id: 4, name: "Robert Wilson", email: "robert@email.com", phone: "+1 234-567-893", location: "Toronto, Canada", joined: "2024-02-01", bookings: 1 },
  { id: 5, name: "Lisa Anderson", email: "lisa@email.com", phone: "+1 234-567-894", location: "Sydney, Australia", joined: "2024-02-05", bookings: 2 },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your customer base</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <MdOutlinePersonAdd className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 relative mb-6">
        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.location}</p>
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <MdOutlineMoreVert className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MdOutlineEmail className="w-4 h-4 text-gray-400" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MdOutlinePhone className="w-4 h-4 text-gray-400" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MdOutlineCalendarToday className="w-4 h-4 text-gray-400" />
                Joined {customer.joined}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{customer.bookings}</p>
              </div>
              <button className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}