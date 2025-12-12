import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaTag } from "react-icons/fa";
import { showError } from "../utils/toast";
import { getUserOrderDetails } from "../services/api/order";
import LoaderSpinner from "../components/LoaderSpinner";

const OrderSuccessPage = () => {
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
            navigate("/home");
            return;
        }

        setOrderData(orderData);

        // Prefer last_order_id if available, else order_id
        // The response has order_id, accessing details might need that or last_order_id
        const idToFetch = orderData.last_order_id || orderData.order_id;
        fetchOrderDetails(idToFetch);
    }, [location.state, navigate]);

    const fetchOrderDetails = async (id) => {
        try {
            setLoading(true);
            const response = await getUserOrderDetails(id);
            if (response && response.result) {
                setOrderDetails(response.result);
            } else {
                setOrderDetails(response);
            }
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

    const items = orderDetails?.items || [];
    // Use amount from orderData (payment response) or fetched details
    const totalAmount = orderData?.amount || orderDetails?.total_amount || 0;
    const deliveryAddress = orderDetails?.address;



    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <LoaderSpinner label="Processing your order..." />
            </div>
        );
    }



    // Format Date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // Approximate delivery date
    const formattedDate = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
                        Your order has been successfully placed.
                    </p>
                </div>

                {/* Order Items Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4">
                        {items.map((item, index) => {
                            const product = item.product || item.order;
                            const variantImage = product?.variant_images?.image ||
                                (Array.isArray(product?.variant_images) ? product.variant_images[0] : null) ||
                                (typeof product?.variant_images === 'string' ? product?.variant_images : null) ||
                                '/placeholder.jpg';

                            const discountPercentage = product?.selling_amount && product?.total_amount
                                ? Math.round(((product.selling_amount - product.total_amount) / product.selling_amount) * 100)
                                : 0;

                            return (
                                <div key={index} className={`flex gap-4 ${index !== items.length - 1 ? 'border-b border-gray-100 pb-4 mb-4' : ''}`}>
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={variantImage}
                                            alt={product?.name || "Product"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">{product?.brand || "Brand"}</p>
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product?.name || product?.variant_name}</h3>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-gray-900">₹{parseFloat(product?.total_amount || 0).toFixed(0)}</span>
                                            {product?.selling_amount && parseFloat(product.selling_amount) > parseFloat(product.total_amount) && (
                                                <>
                                                    <span className="text-xs text-gray-400 line-through">₹{parseFloat(product.selling_amount).toFixed(0)}</span>
                                                    <span className="text-xs text-rose-500 font-medium">{discountPercentage}% OFF</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {product?.size && (
                                                <div className="bg-gray-50 px-2 py-1 rounded text-xs text-gray-600 border border-gray-100">
                                                    Size <span className="font-medium text-gray-900 ml-1">{product.size}</span>
                                                </div>
                                            )}
                                            <div className="bg-gray-50 px-2 py-1 rounded text-xs text-gray-600 border border-gray-100">
                                                Qty <span className="font-medium text-gray-900 ml-1">{item.quantity || product?.selected_quantity || 1}</span>
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

                {/* Delivery Address Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h2 className="font-bold text-gray-900 mb-3">Delivery Address</h2>
                    {deliveryAddress ? (
                        <div className="text-sm text-gray-500 leading-relaxed">
                            <p className="font-semibold text-gray-900 mb-1">
                                {deliveryAddress.house_no || deliveryAddress.address}
                            </p>
                            <p className="text-gray-700 mb-1">
                                {deliveryAddress.street_address || deliveryAddress.landmark}, {deliveryAddress.city}
                            </p>
                            <p className="text-gray-700 mb-1">
                                {deliveryAddress.state} - {deliveryAddress.pincode}
                            </p>
                            <p className="text-gray-700 mt-2 font-medium">
                                Phone: <span className="text-gray-900">{deliveryAddress.phone_number}</span>
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Address details available in order history.</p>
                    )}
                </div>

                {/* Payment Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total amount paid</span>
                    <span className="font-bold text-gray-900 text-lg">₹{parseFloat(totalAmount).toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                    <button
                        onClick={handleTrackOrder}
                        className="w-full py-3.5 bg-[#ec1b45] text-white rounded-lg font-semibold hover:bg-[#d91b40] transition-colors shadow-sm"
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
        </div>
    );
};

export default OrderSuccessPage;
