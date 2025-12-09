import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listUserOrders } from "../services/api/order";
import { showError } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { FaBox, FaCalendarAlt, FaFilter, FaSort, FaTimes, FaTag } from "react-icons/fa";

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Sort and Filter states
  const [sortBy, setSortBy] = useState('-created_at'); // Default: Most recent first
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Sort options
  const sortOptions = [
    { value: '-created_at', label: 'Most Recent First' },
    { value: 'created_at', label: 'Oldest First' },
  ];

  useEffect(() => {
    setPage(1); // Reset to first page when filters/sort change
  }, [sortBy, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [page, sortBy, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = {
        ordering: sortBy,
        page: page
      };

      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await listUserOrders(params);

      if (response.results) {
        setOrders(response.results);
        setTotalCount(response.count || 0);
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
        // Calculate total pages: page_size is 15 according to backend
        const pageSize = 15;
        setTotalPages(Math.ceil((response.count || 0) / pageSize));
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showError("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setIsSortDropdownOpen(false);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSortBy('-created_at');
    setShowFilters(false);
  };

  const hasActiveFilters = startDate || endDate || sortBy !== '-created_at';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'order received':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Date format: "28-11-2025 04:36:01"
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const date = new Date(`${year}-${month}-${day}T${timePart}`);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoaderSpinner label="Loading orders..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {totalCount > 0 ? `${totalCount} order${totalCount !== 1 ? 's' : ''} found` : 'No orders yet'}
              </p>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-all text-sm font-medium shadow-sm"
                >
                  <FaSort size={14} className="text-gray-600" />
                  <span className="text-gray-700">{sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}</span>
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsSortDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-xl z-20">
                      <div className="py-2">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sortBy === option.value ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40]' : 'text-gray-700'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium shadow-sm ${hasActiveFilters
                    ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40] border border-[#ec1b45]'
                    : 'bg-white border border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
              >
                <FaFilter size={14} />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="ml-1 bg-white text-[#ec1b45] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {(startDate ? 1 : 0) + (endDate ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filter Orders by Date</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FaBox size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      {order.product_image ? (
                        <img
                          src={order.product_image}
                          alt={order.label || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaBox size={40} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 group-hover:text-[#ec1b45] transition-colors">
                              {order.label || 'Product'}
                            </h3>
                            {order.brand && (
                              <p className="text-sm font-medium text-gray-600 mb-2">{order.brand}</p>
                            )}
                          </div>
                        </div>

                        {/* Product Attributes */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                          {order.color && (
                            <div className="px-3 py-1 bg-gray-100 rounded-md">
                              <span className="font-medium">Color: </span>
                              <span>{order.color}</span>
                            </div>
                          )}
                          {order.size && (
                            <div className="px-3 py-1 bg-gray-100 rounded-md">
                              <span className="font-medium">Size: </span>
                              <span>{order.size}</span>
                            </div>
                          )}
                          {order.quantity > 0 && (
                            <div className="px-3 py-1 bg-gray-100 rounded-md">
                              <span className="font-medium">Qty: </span>
                              <span>{order.quantity}</span>
                            </div>
                          )}
                          {parseFloat(order.meter || 0) > 0 && (
                            <div className="px-3 py-1 bg-gray-100 rounded-md">
                              <span className="font-medium">Meter: </span>
                              <span>{order.meter}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price and Status */}
                      <div className="flex flex-col items-end gap-3 sm:items-end">
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {formatPrice(order.total_price)}
                          </p>
                          {/* Coupon Applied Amount */}
                          {order.coupon_applied_price && parseFloat(order.coupon_applied_price) > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 shadow-sm">
                              <div className="bg-green-500 rounded-full p-1">
                                <FaTag className="text-white" size={10} />
                              </div>
                              <span className="text-xs text-gray-600 font-medium">Coupon Applied Amount:</span>
                              <span className="text-green-700 font-bold text-sm">
                                {formatPrice(order.coupon_applied_price)}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.order_status)}`}>
                          {order.order_status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Order Info Footer */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      {order.last_cart_item_order_id && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Order ID:</span>
                          <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">{order.last_cart_item_order_id}</span>
                        </div>
                      )}
                      {order.date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaCalendarAlt size={14} className="text-gray-400" />
                          <span>{formatDate(order.date)}</span>
                        </div>
                      )}
                      {order.coupon_name && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          <FaTag size={12} />
                          <span className="font-medium">{order.coupon_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results count */}
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{((page - 1) * 15) + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(page * 15, totalCount)}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalCount}</span> orders
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={!hasPrevious || isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${hasPrevious && !isLoading
                        ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40] shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm min-w-[44px] ${page === pageNum
                              ? 'bg-[#ec1b45] text-white shadow-sm'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={!hasNext || isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${hasNext && !isLoading
                        ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40] shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
