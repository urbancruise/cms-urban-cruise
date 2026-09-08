"use client";

import { useState } from "react";
import { 
  MdOutlineStar, 
  MdOutlineThumbUp, 
  MdOutlineThumbDown, 
  MdOutlineComment, 
  MdOutlineSearch, 
  MdOutlineFilterList,
  MdOutlineMoreVert
} from "react-icons/md";

const reviews = [
  { id: 1, customer: "Sarah Johnson", cruise: "Mediterranean Cruise", rating: 5, comment: "Amazing experience! The crew was fantastic and the destinations were breathtaking.", date: "2024-02-10", helpful: 12, status: "Published" },
  { id: 2, customer: "Michael Chen", cruise: "Caribbean Paradise", rating: 4, comment: "Great cruise overall. The food could have been better, but the views made up for it.", date: "2024-02-08", helpful: 8, status: "Published" },
  { id: 3, customer: "Emily Davis", cruise: "Alaskan Adventure", rating: 5, comment: "Absolutely incredible! The glaciers were stunning and we saw so much wildlife.", date: "2024-02-05", helpful: 15, status: "Pending" },
  { id: 4, customer: "Robert Wilson", cruise: "Norwegian Fjords", rating: 3, comment: "Good but not great. Expected more activities on board.", date: "2024-02-03", helpful: 3, status: "Published" },
];

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.cruise.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || review.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <MdOutlineStar
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
      />
    ));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage customer reviews and feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Average Rating: 4.5 ★</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>All</option>
          <option>Published</option>
          <option>Pending</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {review.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{review.customer}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{review.cruise}</p>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                review.status === 'Published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {review.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{review.date}</span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">{review.comment}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <MdOutlineThumbUp className="w-4 h-4" />
                  <span>{review.helpful} helpful</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdOutlineComment className="w-4 h-4" />
                  <span>Reply</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  Approve
                </button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <MdOutlineMoreVert className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

