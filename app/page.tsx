import { 
  MdOutlineAnchor, 
  MdOutlineCalendarToday, 
  MdOutlinePeople, 
  MdOutlineArrowForward 
} from "react-icons/md";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MdOutlineAnchor className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
          Urban Cruise
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          CMS Management Panel
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-12">
          Manage your cruises, bookings, and customers all in one place
        </p>

        <Link
          href="/admin"
          className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <span>Go to Dashboard</span>
          <MdOutlineArrowForward className="w-5 h-5" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: MdOutlineAnchor, label: "Cruises", value: "24", color: "blue" },
            { icon: MdOutlinePeople, label: "Customers", value: "1,842", color: "green" },
            { icon: MdOutlineCalendarToday, label: "Bookings", value: "156", color: "purple" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
            >
              <div className={`w-12 h-12 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/20 flex items-center justify-center mx-auto mb-3`}>
                <item.icon className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}