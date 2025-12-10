import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaStore, FaArrowLeft, FaShoppingBag } from "react-icons/fa";
import { showError } from "../utils/toast";
import { getUserOrderDetails } from "../services/api/order";

const PickupSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleViewOrders = () => {
    navigate("/orders");
  };

  const handleContactStore = () => {
    // Implement contact store functionality
    console.log("Contact store clicked");
  };

  const handleTrackOrder = () => {
    // Implement track order functionality
    console.log("Track order clicked");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ec1b45] mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p>Order data not found</p>
        </div>
      </div>
    );
  }




  const cartItems = orderDetails?.items || [];
  const totalAmount = orderData?.total_amount || orderDetails?.total_amount || 0;
  const orderId = orderData?.order_id || "";
  const lastOrderId = orderData?.last_order_id || "";
  const pickupAddress = orderData?.pickup_address || "";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-white rounded-xl p-6 sm:p-8 mb-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle size={40} className="text-white" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Your pickup order has been created successfully. Please note the details below.
          </p>
          
          <div className="p-4 inline-block mb-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Order ID :</span>
              <span className="font-semibold text-lg">{lastOrderId || orderId}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Ordered Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* <h2 className="text-xl font-bold text-gray-900 mb-4">Ordered Items</h2> */}
            
            <div className="space-y-4">
              {cartItems.map((item) => {
                // Handle the new API structure
                const productDetail = item.order;
                if (!productDetail) return null;
                
                // Extract image from the new structure
                const variantImage = productDetail.variant_images?.image || 
                  (typeof productDetail.variant_images === 'string' 
                    ? productDetail.variant_images 
                    : null) || 
                  "/placeholder.jpg";
                
                return (
                  <div key={item.item_order_id || item.order_id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={variantImage}
                        alt={productDetail.name || productDetail.variant_name}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="mt-1">
                        {/* Brand Name */}
                        {productDetail.brand && (
                          <p className="text-sm text-gray-600">
                            {productDetail.brand}
                          </p>
                        )}
                        {/* Variant Name */}
                        <p className="text-sm text-gray-900 font-medium">
                          {productDetail.variant_name || productDetail.name}
                        </p>
                        
                        {/* Price Section */}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-semibold text-gray-900">
                            ₹{parseFloat(productDetail.total_amount || 0).toFixed(2)}
                          </p>
                          {productDetail.selling_amount && parseFloat(productDetail.selling_amount) > parseFloat(productDetail.total_amount) && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{parseFloat(productDetail.selling_amount || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        {/* Size and Quantity */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-600">
                            Size: {productDetail.size || productDetail.selected_meter || 'N/A'}
                          </span>
                          <span className="text-sm text-gray-600">
                            Qty: {productDetail.selected_quantity || productDetail.selected_meter || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Pickup Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pickup Address</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <FaStore className="text-[#ec1b45]" />
                </div>
                <div>
                  {/* <h4 className="font-semibold text-gray-900">Pickup Address</h4> */}
                  <p className="text-gray-800 text-m mt-1">
                    {pickupAddress || "Store address will be provided shortly"}
                  </p>
                </div>
              </div>
              
              {/* <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{parseFloat(totalAmount || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div> */}
            </div>
          </div>
          
          {/* Total Amount */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-[#1F2937]">
                ₹{parseFloat(totalAmount || 0).toFixed(2)}
              </span>
            </div>
            
            {/* <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Payment Status:</strong> {orderData?.payment_status || "Pending"}
              </p>
            </div> */}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleContactStore}
              className="flex-1 bg-[#ec1b45] text-white py-3 rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              Contact Store
            </button>
            
            <button
              onClick={handleTrackOrder}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Track Order
            </button>
            
            <button
              onClick={handleContinueShopping}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupSuccessPage;