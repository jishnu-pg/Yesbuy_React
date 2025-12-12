import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStore, FaCopy, FaTimes, FaCheck, FaTag } from "react-icons/fa";
import { showError, showSuccess } from "../utils/toast";
import { getUserOrderDetails } from "../services/api/order";
import LoaderSpinner from "../components/LoaderSpinner";

const PickupSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    // Get order data from location state
    const { orderData } = location.state || {};

    if (!orderData) {
      showError("Order data not found");
      navigate("/cartpage");
      return;
    }

    setOrderData(orderData);

    // Fetch detailed order information
    fetchOrderDetails(orderData.last_order_id || orderData.order_id);
  }, [location.state, navigate]);

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const response = await getUserOrderDetails(orderId);
      setOrderDetails(response.result);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      showError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigate("/home");
  };

  const handleTrackOrder = () => {
    navigate("/orders");
  };

  const handleContactStore = () => {
    setShowContactPopup(true);
  };



  const handleCopyNumber = async () => {
    const number = "9495919900";

    // Try Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(number);
        showSuccess("Number copied to clipboard!");
        return;
      } catch (err) {
        console.error("Clipboard API failed:", err);
      }
    }

    // Fallback method
    try {
      const textArea = document.createElement("textarea");
      textArea.value = number;
      textArea.style.position = "fixed";
      textArea.style.left = "0";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        showSuccess("Number copied to clipboard!");
      } else {
        throw new Error("execCommand failed");
      }
    } catch (err) {
      console.error("Copy fallback failed:", err);
      showError("Failed to copy number. Please copy manually.");
    }
  };

  const closeContactPopup = () => {
    setShowContactPopup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <LoaderSpinner label="Processing your order..." />
      </div>
    );
  }

  const cartItems = orderDetails?.items || [];
  const totalAmount = orderData?.total_amount || orderDetails?.total_amount || 0;
  const pickupAddress = orderData?.pickup_address || "";

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Success Header */}
        <div className="text-center pt-8 pb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-emerald-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-500">
            Your pickup order has been successfully placed.
          </p>
        </div>

        {/* Order Items Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            {cartItems.map((item, index) => {
              const productDetail = item.order;
              if (!productDetail) return null;

              const variantImage = productDetail.variant_images?.image ||
                (typeof productDetail?.variant_images === 'string'
                  ? productDetail.variant_images
                  : null) ||
                (Array.isArray(productDetail?.variant_images) ? productDetail.variant_images[0] : null) ||
                "/placeholder.jpg";

              const discountPercentage = productDetail?.selling_amount && productDetail?.total_amount
                ? Math.round(((productDetail.selling_amount - productDetail.total_amount) / productDetail.selling_amount) * 100)
                : 0;

              return (
                <div key={item.item_order_id || item.order_id} className={`flex gap-4 ${index !== cartItems.length - 1 ? 'border-b border-gray-100 pb-4 mb-4' : ''}`}>
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={variantImage}
                      alt={productDetail.name || productDetail.variant_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">{productDetail.brand || "Brand"}</p>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{productDetail.variant_name || productDetail.name}</h3>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900">₹{parseFloat(productDetail.total_amount || 0).toFixed(0)}</span>
                      {productDetail.selling_amount && parseFloat(productDetail.selling_amount) > parseFloat(productDetail.total_amount) && (
                        <>
                          <span className="text-xs text-gray-400 line-through">₹{parseFloat(productDetail.selling_amount).toFixed(0)}</span>
                          <span className="text-xs text-rose-500 font-medium">{discountPercentage}% OFF</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {(productDetail.size || productDetail.selected_meter) && (
                        <div className="bg-gray-50 px-2 py-1 rounded text-xs text-gray-600 border border-gray-100">
                          Size <span className="font-medium text-gray-900 ml-1">{productDetail.size || productDetail.selected_meter}</span>
                        </div>
                      )}
                      <div className="bg-gray-50 px-2 py-1 rounded text-xs text-gray-600 border border-gray-100">
                        Qty <span className="font-medium text-gray-900 ml-1">{productDetail.selected_quantity || 1}</span>
                      </div>
                    </div>

                    {/* Coupon Display */}
                    {(item.coupon_applied_price > 0 || item.coupon_name) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.coupon_applied_price > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-[10px] text-green-700 font-medium">
                            <FaTag size={8} />
                            Coupon Applied Amount: ₹{parseFloat(item.coupon_applied_price).toFixed(2)}
                          </div>
                        )}
                        {item.coupon_name && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-[10px] text-green-700 font-medium">
                            <FaTag size={8} />
                            {item.coupon_name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Pickup Address Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 rounded-lg">
              <FaStore className="text-[#ec1b45]" size={16} />
            </div>
            <h2 className="font-bold text-gray-900">Pickup Address</h2>
          </div>
          <div className="text-sm text-gray-500 leading-relaxed pl-11">
            <p className="font-semibold text-gray-900 mb-1">
              {pickupAddress || "Store address will be provided shortly"}
            </p>
            {/* {pickupAddress && (
                         <p className="text-gray-700 mt-2">
                            Please pick up your order from this location.
                         </p>
                        )} */}
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
          <span className="font-bold text-gray-900">Total Amount Paid</span>
          <span className="font-bold text-gray-900 text-lg">
            ₹{parseFloat(totalAmount || 0).toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleContactStore}
            className="w-full py-3.5 bg-[#ec1b45] text-white rounded-lg font-semibold hover:bg-[#d91b40] transition-colors shadow-sm"
          >
            Contact Store
          </button>

          <button
            onClick={handleTrackOrder}
            className="w-full py-3.5 bg-white text-gray-800 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Track Order
          </button>

          <button
            onClick={handleContinueShopping}
            className="w-full py-3.5 bg-white text-[#ec1b45] border border-[#ec1b45] rounded-lg font-semibold hover:bg-rose-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      {/* Contact Store Popup */}
      {showContactPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative animate-fade-in transform scale-100 transition-all">
            <button
              onClick={closeContactPopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-1"
            >
              <FaTimes size={16} />
            </button>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStore className="text-[#ec1b45] text-2xl" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Contact YesBharath</h3>
              <p className="text-gray-600 mb-6 text-sm">
                You can reach us at the number below for any queries regarding your order.
              </p>

              <div className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <span className="text-lg font-bold text-gray-800 tracking-wide">94959 19900</span>
                <button
                  onClick={handleCopyNumber}
                  className="p-2 text-[#ec1b45] hover:bg-red-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <FaCopy size={18} />
                </button>
              </div>

              <button
                onClick={closeContactPopup}
                className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupSuccessPage;