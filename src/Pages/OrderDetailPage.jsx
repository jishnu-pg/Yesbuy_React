import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails, cancelOrder } from "../services/api/order";
import { getDiscountedProductsList } from "../services/api/product";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import TrackOrderSlider from "../components/TrackOrderSlider";
import SimilarProducts from "../components/ProductDetail/SimilarProducts";
import { FaBox, FaCalendarAlt, FaCopy, FaArrowLeft, FaExchangeAlt, FaUndo, FaTimes, FaTag, FaCheckCircle } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrackOrderSlider, setShowTrackOrderSlider] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // You May Like products state
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoadingSimilarProducts, setIsLoadingSimilarProducts] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderDetails(orderId);
      if (response.result) {
        setOrderDetail(response.result);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      showError("Failed to load order details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch similar products for "You May Like" section
  const fetchSimilarProducts = async () => {
    try {
      setIsLoadingSimilarProducts(true);
      const response = await getDiscountedProductsList();
      if (response.results && Array.isArray(response.results)) {
        // Limit to 12 products
        setSimilarProducts(response.results.slice(0, 12));
      }
    } catch (error) {
      console.error("Failed to fetch similar products:", error);
    } finally {
      setIsLoadingSimilarProducts(false);
    }
  };

  // Fetch similar products when component mounts
  useEffect(() => {
    fetchSimilarProducts();
  }, []);


  const copyOrderId = () => {
    if (orderDetail?.item_order_id) {
      navigator.clipboard.writeText(orderDetail.item_order_id);
      showSuccess("Order ID copied to clipboard!");
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'order received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTrackOrder = () => {
    setShowTrackOrderSlider(true);
  };

  const handleReturnOrder = () => {
    navigate(`/order/${orderId}/return`);
  };

  const handleExchangeOrder = () => {
    navigate(`/order/${orderId}/exchange`);
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderDetail?.order_id) {
      showError("Order ID not found");
      return;
    }

    try {
      setIsCancelling(true);
      await cancelOrder(orderDetail.order_id);
      showSuccess("Order cancelled successfully!");
      setShowCancelModal(false);
      // Refresh order details to show updated status
      await fetchOrderDetails();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      showError(error.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoaderSpinner label="Loading order details..." />
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FaBox size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Order not found</h3>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-[#ec1b45] text-white px-6 py-3 rounded-md hover:bg-[#d91b40] transition-colors font-medium"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const order = orderDetail.order || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="p-2 sm:p-4 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Orders</span>
        </button>

        {/* Order ID Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              ORDER ID : {orderDetail.item_order_id || 'N/A'}
            </h1>
          </div>
          {orderDetail.item_order_id && (
            <button
              onClick={copyOrderId}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FaCopy size={14} />
              <span>Copy</span>
            </button>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FaBox size={24} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.order_status)}`}>
                  {order.order_status || 'Pending'}
                </span>
              </div>
              {order.created_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt size={14} />
                  <span>{formatDate(order.created_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6">
          <div
            onClick={() => order.product_id && navigate(`/product/${order.product_id}`)}
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 ${order.product_id ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            {/* Product Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-gray-100">
                {order.variant_images?.image ? (
                  <img
                    src={order.variant_images.image}
                    alt={order.name || 'Product'}
                    className="w-full h-full object-cover"
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

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              {order.brand && (
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {order.brand}
                </h3>
              )}
              <h4 className="text-base sm:text-lg text-gray-700 mb-3">
                {order.name || 'Product'}
              </h4>
              {order.variant_name && (
                <p className="text-sm text-gray-600 mb-3">{order.variant_name}</p>
              )}

              {/* Price */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatPrice(order.total_amount)}
                  </span>
                  {order.selling_amount && parseFloat(order.selling_amount) > parseFloat(order.total_amount) && (
                    <span className="text-base text-gray-500 line-through">
                      {formatPrice(order.selling_amount)}
                    </span>
                  )}
                </div>
                {/* Coupon Applied Amount */}
                {orderDetail.coupon_applied_price && parseFloat(orderDetail.coupon_applied_price) > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 shadow-sm w-fit">
                    <div className="bg-green-500 rounded-full p-1">
                      <FaTag className="text-white" size={10} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">Coupon Applied Amount:</span>
                    <span className="text-green-700 font-bold text-sm">
                      {formatPrice(orderDetail.coupon_applied_price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Size and Color */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {order.size && (
                  <div>
                    <span className="font-medium">Size:</span> {order.size}
                  </div>
                )}
                {order.color && (
                  <div>
                    <span className="font-medium">Color:</span> {order.color}
                  </div>
                )}
                {order.selected_quantity > 0 && (
                  <div>
                    <span className="font-medium">Quantity:</span> {order.selected_quantity}
                  </div>
                )}
                {parseFloat(order.selected_meter || 0) > 0 && (
                  <div>
                    <span className="font-medium">Meter:</span> {order.selected_meter}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {orderDetail.payment_method && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Payment Method:</span> {orderDetail.payment_method}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-6">
          <div className="space-y-3">
            {/* Track Order */}
            <button
              onClick={handleTrackOrder}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FaBox size={20} className="text-blue-500" />
                <span className="text-base font-medium text-gray-900">Track Order</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            {/* Return Order */}
            {order.is_return_available && !order.is_return_ongoing && (
              <button
                onClick={handleReturnOrder}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FaUndo size={20} className="text-red-500" />
                  <span className="text-base font-medium text-gray-900">Return Order</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            )}

            {/* Exchange Order */}
            {order.is_exchange_available && !order.is_exchange_ongoing && (
              <button
                onClick={handleExchangeOrder}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FaExchangeAlt size={20} className="text-orange-500" />
                  <span className="text-base font-medium text-gray-900">Exchange Order</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            )}

            {/* Cancel Order */}
            {order.is_cancel_available && (
              <button
                onClick={handleCancelOrder}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FaTimes size={20} className="text-red-500" />
                  <span className="text-base font-medium text-gray-900">Cancel Order</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            )}

            {/* Status Messages */}
            {order.is_return_ongoing && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Return in progress</span>
                  {order.last_return_date && ` - Last return date: ${formatDate(order.last_return_date)}`}
                </p>
              </div>
            )}

            {order.is_exchange_ongoing && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Exchange in progress</span>
                  {order.last_exchange_date && ` - Last exchange date: ${formatDate(order.last_exchange_date)}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coupon Information */}
        {orderDetail.coupon_name && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <span className="font-medium">Coupon Applied:</span> {orderDetail.coupon_name}
            </p>
          </div>
        )}
      </div>

      {/* You May Like Section */}
      <div className="px-2 sm:px-4">
        <SimilarProducts
          similarProducts={similarProducts}
          isLoadingSimilarProducts={isLoadingSimilarProducts}
        />
      </div>

      {/* Track Order Slider */}
      <TrackOrderSlider
        isOpen={showTrackOrderSlider}
        onClose={() => setShowTrackOrderSlider(false)}
        orderId={orderId}
      />

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Invisible backdrop to catch clicks */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setShowCancelModal(false)}
          ></div>

          <div className="bg-white w-full sm:w-auto sm:min-w-[400px] p-6 rounded-t-2xl sm:rounded-xl shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-gray-100 pointer-events-auto transform transition-transform duration-300 ease-out">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <FaTimes size={32} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Cancel Order?
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 px-6 rounded-md hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No, Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
