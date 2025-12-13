import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getOrderDetails, getReturnExchangeReasons } from "../services/api/order";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { FaArrowLeft, FaCopy, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";



const ReturnOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetail, setOrderDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState("");
  const [returnReasons, setReturnReasons] = useState([]);
  const [additionalComment, setAdditionalComment] = useState("");
  const [selectedReturnMethod, setSelectedReturnMethod] = useState("Return Online"); // "Return Online" or "Return Direct From Store"

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
    fetchReasons();
  }, [orderId]);

  const fetchReasons = async () => {
    try {
      const response = await getReturnExchangeReasons();
      if (response?.status && response?.return_reasons?.results) {
        setReturnReasons(response.return_reasons.results);
      }
    } catch (error) {
      console.error("Failed to fetch return reasons:", error);
    }
  };

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

  const handleContinue = () => {
    if (!selectedReason) {
      showError("Please select a reason for return");
      return;
    }

    // Validate additional comment is not empty (required in Flutter)
    if (!additionalComment || additionalComment.trim() === "") {
      showError("Please enter a comment before continuing");
      return;
    }

    // If "Return Direct From Store" is selected, submit directly
    if (selectedReturnMethod === "Return Direct From Store") {
      // This will be handled in ReturnRefundPage
      navigate(`/order/${orderId}/return/refund`, {
        state: {
          orderDetail,
          returnReason: selectedReason,
          additionalComment,
          returnMethod: selectedReturnMethod,
        },
      });
      return;
    }

    // Navigate to refund page with return reason data
    navigate(`/order/${orderId}/return/refund`, {
      state: {
        orderDetail,
        returnReason: selectedReason,
        additionalComment,
        returnMethod: selectedReturnMethod,
      },
    });
  };

  // Check if order is PICKUP PAY to show return method selection
  const paymentMethod = orderDetail?.payment_method || "";
  const isPickupOrder = paymentMethod?.toUpperCase() === "PICKUP PAY" || 
                        paymentMethod?.toUpperCase() === "PICKUP IN STORE" ||
                        paymentMethod?.toUpperCase() === "PICKUP";

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Order Details</span>
          </button>
        </div>

        {/* Order ID */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-base sm:text-lg font-bold text-gray-700">ORDER ID :</p>
              <p className="text-base sm:text-lg font-bold text-gray-700">
                {orderDetail.item_order_id || 'N/A'}
              </p>
            </div>
            {orderDetail.item_order_id && (
              <button
                onClick={copyOrderId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                <FaCopy size={12} />
                <span>Copy</span>
              </button>
            )}
          </div>
        </div>

        {/* Delivery Status */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FaCheckCircle size={24} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Order Delivered</h3>
              {order.created_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt size={14} />
                  <span>{formatDate(order.created_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="mb-8">
          {/* <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2> */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
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
                    <span>No Image</span>
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

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatPrice(order.total_amount)}
                </span>
                {order.selling_amount && parseFloat(order.selling_amount) > parseFloat(order.total_amount) && (
                  <span className="text-base text-gray-500 line-through">
                    {formatPrice(order.selling_amount)}
                  </span>
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
              </div>
            </div>
          </div>
        </div>

        {/* Reason for Return */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reason for Return</h2>
            <p className="text-sm text-gray-600">
              Please select the reason for your return. This helps us improve our service.
            </p>
          </div>

          <div className="space-y-2">
            {returnReasons.map((reasonItem) => {
              const reasonText = typeof reasonItem === 'string' ? reasonItem : (reasonItem.reason || reasonItem.name || 'Unknown Reason');
              const isSelected = selectedReason === reasonText;
              return (
                <label
                  key={reasonText}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                    ? 'bg-red-50'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={reasonText}
                    checked={isSelected}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-0.5 w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-0 focus:outline-none"
                    style={{ accentColor: '#ec1b45' }}
                  />
                  <span className={`text-sm flex-1 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {reasonText}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Return Method Selection - Only for PICKUP orders */}
        {isPickupOrder && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Method</h2>
            <div className="space-y-3">
              {["Return Online", "Return Direct From Store"].map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReturnMethod === method
                      ? 'border-[#ec1b45] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="returnMethod"
                    value={method}
                    checked={selectedReturnMethod === method}
                    onChange={(e) => setSelectedReturnMethod(e.target.value)}
                    className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                    style={{ accentColor: '#ec1b45' }}
                  />
                  <span className={`text-sm font-medium ${selectedReturnMethod === method ? 'text-gray-900' : 'text-gray-700'}`}>
                    {method}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Additional Comment */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Additional Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            placeholder="Add any additional details about your return request..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Continue Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:mt-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleContinue}
              disabled={!selectedReason}
              className="w-full bg-[#ec1b45] text-white py-3.5 px-6 rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue to Refund Details
            </button>
            {!selectedReason && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Please select a reason for return
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnOrderPage;

