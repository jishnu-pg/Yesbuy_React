import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails, getReturnExchangeReasons } from "../services/api/order";
import { getProductVariantsById } from "../services/api/product";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import SizeChartSlider from "../components/ProductDetail/SizeChartSlider";
import { FaArrowLeft, FaCopy, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";

const ExchangeOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState(null);
  const [productVariants, setProductVariants] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalComment, setAdditionalComment] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [exchangeReasons, setExchangeReasons] = useState([]);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [currentSize, setCurrentSize] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
    fetchReasons();
  }, [orderId]);

  const fetchReasons = async () => {
    try {
      const response = await getReturnExchangeReasons();
      if (response?.status && response?.exchange_reasons?.results) {
        setExchangeReasons(response.exchange_reasons.results);
      }
    } catch (error) {
      console.error("Failed to fetch exchange reasons:", error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderDetails(orderId);
      if (response.result) {
        setOrderDetail(response.result);
        const order = response.result.order || {};
        setCurrentSize(order.size || "");

        // Fetch product variants for size selection
        if (order.product_id) {
          await fetchProductVariants(order.product_id, order.product_variant_id, order.color);
        }
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      showError("Failed to load order details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductVariants = async (productId, variantId, colorName) => {
    try {
      const response = await getProductVariantsById(productId, variantId);
      if (response.status && response.data) {
        setProductVariants(response.data);

        // Extract available sizes from variants
        const sizes = [];
        if (response.data.variants && response.data.variants.length > 0) {
          // Find the variant matching the current color, or use first variant
          let selectedVariant = response.data.variants.find(v =>
            v.data && v.data[0] && v.data[0].color === colorName
          ) || response.data.variants[0];

          if (selectedVariant && selectedVariant.available_sizes && selectedVariant.available_sizes.length > 0) {
            selectedVariant.available_sizes.forEach((sizeInfo) => {
              sizes.push({
                size: sizeInfo.size,
                variantId: sizeInfo.var_id,
                availableCount: sizeInfo.available_count,
              });
            });
          } else if (selectedVariant && selectedVariant.variant_avail_size && selectedVariant.variant_avail_size.length > 0) {
            // Fallback to variant_avail_size if available_sizes is not present
            selectedVariant.variant_avail_size.forEach((sizeInfo) => {
              sizes.push({
                size: sizeInfo.size,
                variantId: sizeInfo.product_variant_id,
                availableCount: sizeInfo.available_count,
              });
            });
          }
        }
        setAvailableSizes(sizes);
      }
    } catch (error) {
      console.error("Failed to fetch product variants:", error);
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
      showError("Please select a reason for exchange");
      return;
    }

    if (!selectedSize) {
      showError("Please select a size");
      return;
    }

    // Navigate to exchange details page
    navigate(`/order/${orderId}/exchange/details`, {
      state: {
        orderDetail,
        exchangeReason: selectedReason,
        additionalComment,
        selectedSize,
        productVariants,
      },
    });
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
          {/* <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Exchange Order</h1>
            <p className="text-sm text-gray-600">Select a reason and choose a new size for your exchange</p>
          </div> */}
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

        {/* Reason for Exchange */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reason for Exchange</h2>
            <p className="text-sm text-gray-600">
              Please select the reason for your exchange. This helps us improve our service.
            </p>
          </div>

          <div className="space-y-2">
            {exchangeReasons.map((reasonItem) => {
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
                    name="exchangeReason"
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

        {/* Additional Comment */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Additional Comment
            {/* <span className="text-gray-500 font-normal">(Optional)</span> */}
          </label>
          <textarea
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            placeholder="Add any additional details about your exchange request..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Choose another size */}
        {availableSizes.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose New Size</h2>
              <p className="text-sm text-gray-600">
                Current size: <span className="font-medium text-gray-900">{currentSize}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              {availableSizes.map((sizeInfo) => {
                const isSelected = selectedSize?.size === sizeInfo.size;
                const isCurrentSize = sizeInfo.size === currentSize;
                return (
                  <button
                    key={sizeInfo.size}
                    onClick={() => setSelectedSize(sizeInfo)}
                    disabled={isCurrentSize}
                    className={`px-5 py-2.5 rounded-lg border-2 transition-all font-medium text-sm ${isCurrentSize
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#ec1b45] text-white border-[#ec1b45]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#ec1b45] hover:text-[#ec1b45]'
                      }`}
                  >
                    {sizeInfo.size}
                    {isCurrentSize && ' (Current)'}
                  </button>
                );
              })}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setShowSizeChart(true);
              }}
              className="text-sm text-[#ec1b45] hover:text-[#d91b40] font-medium transition-colors inline-flex items-center gap-1"
            >
              <span>View Size Chart</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Continue Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:mt-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleContinue}
              disabled={!selectedReason || !selectedSize}
              className="w-full bg-[#ec1b45] text-white py-3.5 px-6 rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue to Exchange Details
            </button>
            {(!selectedReason || !selectedSize) && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {!selectedReason && !selectedSize
                  ? 'Please select a reason and size to continue'
                  : !selectedReason
                    ? 'Please select a reason for exchange'
                    : 'Please select a new size'}
              </p>
            )}
          </div>
        </div>

        {/* Size Chart Slider */}
        {productVariants?.product && (
          <SizeChartSlider
            showSizeChart={showSizeChart}
            onClose={() => setShowSizeChart(false)}
            product={productVariants.product}
            selectedVariant={{
              variant_images: order.variant_images?.image ? [order.variant_images.image] : [],
              color: order.color,
            }}
            selectedSize={selectedSize?.size || currentSize}
            isRunningMaterial={false}
            currentPrice={parseFloat(order.total_amount || 0)}
            originalPrice={parseFloat(order.selling_amount || 0)}
            discountPercentage={0}
            isBogo={false}
            hasOffer={false}
          />
        )}
      </div>
    </div>
  );
};

export default ExchangeOrderPage;
