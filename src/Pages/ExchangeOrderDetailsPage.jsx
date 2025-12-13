import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { listAddresses, addAddress } from "../services/api/address";
import { exchangeOrder } from "../services/api/order";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { FaArrowLeft, FaCopy, FaCheckCircle, FaCalendarAlt, FaTimes, FaClock } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

const ExchangeOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetail, setOrderDetail] = useState(location.state?.orderDetail || null);
  const [exchangeReason, setExchangeReason] = useState(location.state?.exchangeReason || "");
  const [additionalComment, setAdditionalComment] = useState(location.state?.additionalComment || "");
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || null);
  const [productVariants, setProductVariants] = useState(location.state?.productVariants || null);
  const [exchangeMethod, setExchangeMethod] = useState(location.state?.exchangeMethod || "Exchange Online");
  const [showDirectStorePopup, setShowDirectStorePopup] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showAddAddressPopup, setShowAddAddressPopup] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    phone_number: "",
    landmark: "",
    location_address: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    tag: "Home",
    latitude: "1",
    longitude: "1",
    is_default: true,
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Prevent back navigation to exchange pages after successful submission
  useEffect(() => {
    // This effect runs once when component mounts
    // We'll use it to replace the previous history entry if we came from an exchange-related page
    
    // Check if we have state indicating we came from an exchange flow
    if (location.state?.fromExchangeFlow) {
      // Replace the current history entry to prevent back navigation
      window.history.replaceState(null, '', window.location.href);
    }
  }, [location.state]);

  useEffect(() => {
    fetchData();

    // If orderDetail is not in location.state, fetch it
    if (!orderDetail && orderId) {
      const fetchOrderDetails = async () => {
        try {
          const response = await getOrderDetails(orderId);
          if (response.result) {
            setOrderDetail(response.result);
          }
        } catch (error) {
          console.error("Failed to fetch order details:", error);
        }
      };
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const addressesResponse = await listAddresses();
      if (addressesResponse.results) {
        setAddresses(addressesResponse.results);
        // Set default address or first address
        const defaultAddress = addressesResponse.results.find(addr => addr.is_default) || addressesResponse.results[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      showError("Failed to load addresses. Please try again.");
    } finally {
      setIsLoading(false);
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

  const formatAddress = (address) => {
    // Match Flutter format: address, landmark, city, state, country, pincode
    const parts = [
      address.address,
      address.landmark,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Calculate delivery estimate (7 days from now)
  const getDeliveryEstimate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProcessExchange = async () => {
    const isDirectStoreExchange = exchangeMethod === "Exchange Direct From Store";

    // Address is only required for "Exchange Online"
    if (!isDirectStoreExchange && !selectedAddressId) {
      showError("Please select an exchange address");
      return;
    }

    // Validate additional comment is not empty (required in Flutter)
    if (!additionalComment || additionalComment.trim() === "") {
      showError("Please enter a comment before continuing");
      return;
    }

    if (!selectedSize) {
      showError("Please select a size");
      return;
    }

    // For "Exchange Direct From Store", show confirmation popup
    if (isDirectStoreExchange) {
      setShowDirectStorePopup(true);
      return;
    }

    await processExchangeAPI();
  };

  const processExchangeAPI = async () => {
    try {
      setIsSubmitting(true);

      const order = orderDetail?.order || {};
      const sizeType = productVariants?.product?.size_type || 'clothing_size';
      const isDirectStoreExchange = exchangeMethod === "Exchange Direct From Store";

      const exchangeData = {
        previous_order_id: order.id || orderId,
        product_id: order.product_id,
        product_variant_id: selectedSize.variantId,
        size_type: sizeType,
        exchange_type: isDirectStoreExchange ? 'IN_STORE' : 'DELIVERY',
        reason: exchangeReason,
        sub_reason: additionalComment.trim(), // Required field, always send
      };

      // Add size-specific fields
      if (sizeType === 'clothing_size') {
        exchangeData.size = selectedSize.size;
        exchangeData.quantity = order.selected_quantity || 1;
      } else if (sizeType === 'running_material') {
        exchangeData.meter = order.selected_meter || 1;
      } else if (sizeType === 'others') {
        exchangeData.quantity = order.selected_quantity || 1;
      }

      if (order.color) {
        exchangeData.color_name = order.color;
      }

      await exchangeOrder(exchangeData);

      // Show success popup
      setShowSuccessPopup(true);
      setShowDirectStorePopup(false);
    } catch (error) {
      console.error("Failed to process exchange:", error);
      showError(error.message || "Failed to process exchange. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Address form handlers
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isAddressFormValid = () => {
    // Check all required fields are filled
    if (!addressFormData.location_address?.trim()) return false;
    if (!addressFormData.phone_number?.trim()) return false;
    if (!addressFormData.address?.trim()) return false;
    if (!addressFormData.landmark?.trim()) return false;
    if (!addressFormData.state?.trim()) return false;
    if (!addressFormData.city?.trim()) return false;
    if (!addressFormData.pincode?.trim()) return false;

    // Check pincode length (6 digits)
    if (addressFormData.pincode.length !== 6) return false;

    // Check phone number length (10 digits)
    if (addressFormData.phone_number.length !== 10) return false;

    return true;
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();

    if (!isAddressFormValid()) {
      showError("Please fill all required fields correctly");
      return;
    }

    try {
      setIsAddingAddress(true);

      const submitFormData = new FormData();
      submitFormData.append('phone_number', addressFormData.phone_number);
      submitFormData.append('landmark', addressFormData.landmark);
      submitFormData.append('location_address', addressFormData.location_address);
      submitFormData.append('address', addressFormData.address);
      submitFormData.append('city', addressFormData.city);
      submitFormData.append('state', addressFormData.state);
      submitFormData.append('pincode', addressFormData.pincode);
      submitFormData.append('country', ''); // Empty string to match Flutter
      submitFormData.append('tag', addressFormData.tag);
      submitFormData.append('latitude', '1');
      submitFormData.append('longitude', '1');
      // Set as default based on checkbox
      if (addressFormData.is_default) {
        submitFormData.append('is_default', 'true');
      }

      await addAddress(submitFormData);

      // Refresh addresses list
      const addressesResponse = await listAddresses();
      if (addressesResponse.results) {
        setAddresses(addressesResponse.results);
        // Select the newly added address (it will be the last one)
        if (addressesResponse.results.length > 0) {
          setSelectedAddressId(addressesResponse.results[addressesResponse.results.length - 1].id);
        }
      }

      showSuccess("Address added successfully!");

      // Reset form and close popup
      setAddressFormData({
        phone_number: "",
        landmark: "",
        location_address: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
        tag: "Home",
        latitude: "1",
        longitude: "1",
        is_default: true,
      });
      setShowAddAddressPopup(false);
    } catch (error) {
      console.error("Failed to add address:", error);
      showError(error.message || "Failed to add address. Please try again.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoaderSpinner label="Loading..." />
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
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const isDirectStoreExchange = exchangeMethod === "Exchange Direct From Store";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/order/${orderId}/exchange`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm font-medium">Exchange Order Details</span>
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Exchange Order Details</h1>
            <a href="/help" className="text-sm text-[#ec1b45] hover:underline">
              Help
            </a>
          </div>
        </div>

        {/* Order ID */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ORDER ID</p>
              <p className="text-lg font-semibold text-gray-900">
                {orderDetail.item_order_id || 'N/A'}
              </p>
            </div>
            {orderDetail.item_order_id && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(orderDetail.item_order_id);
                  showSuccess("Order ID copied!");
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <FaCopy size={14} />
                <span>Copy</span>
              </button>
            )}
          </div>
        </div>

        {/* Delivery Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FaCheckCircle size={24} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Delivered</h3>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
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
            <div className="flex-1 min-w-0">
              {order.brand && (
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {order.brand}
                </h3>
              )}
              <h4 className="text-base sm:text-lg text-gray-700 mb-3">
                {order.name || 'Product'}
              </h4>
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
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {selectedSize && (
                  <div>
                    <span className="font-medium">New Size:</span> {selectedSize.size}
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

        {/* Exchange Address - Only for "Exchange Online" */}
        {!isDirectStoreExchange && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Exchange Address</h2>
              <button
                onClick={() => setShowAddressPopup(true)}
                className="text-sm text-[#ec1b45] hover:underline font-medium"
              >
                Change
              </button>
            </div>
            {selectedAddress ? (
              <div className="flex items-start gap-3">
                <IoLocationOutline size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  {/* Match Flutter format: location_address (Name) as bold header */}
                  {selectedAddress.location_address && (
                    <p className="font-bold text-gray-900 mb-1">{selectedAddress.location_address}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-1">{formatAddress(selectedAddress)}</p>
                  <p className="text-xs text-gray-500">{selectedAddress.phone_number || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No address selected</p>
            )}
          </div>
        )}

        {/* Delivery Estimate */}
        {/* <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3">
            <FaClock size={20} className="text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Exchange expected to be delivered by</p>
              <p className="text-base font-semibold text-gray-900">{getDeliveryEstimate()}</p>
            </div>
          </div>
        </div> */}

        {/* Process Exchange Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border sm:mt-6">
          <button
            onClick={handleProcessExchange}
            disabled={isSubmitting || (!isDirectStoreExchange && !selectedAddressId) || !selectedSize}
            className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Process Exchange"}
          </button>
        </div>
      </div>

      {/* Address Change Popup */}
      {showAddressPopup && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Change Address</h3>
              <button
                onClick={() => setShowAddressPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[...addresses].sort((a, b) => {
                // If a is default and b is not, a comes first
                if (a.is_default && !b.is_default) return -1;
                // If b is default and a is not, b comes first
                if (!a.is_default && b.is_default) return 1;
                // If both are default or both are not, maintain original order
                return 0;
              }).map((address) => (
                <label
                  key={address.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={(e) => {
                      setSelectedAddressId(Number(e.target.value));
                      setShowAddressPopup(false);
                    }}
                    className="mt-1 w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {address.tag || 'Home'}
                    </p>
                    {/* Match Flutter format: location_address (Name) as bold */}
                    {address.location_address && (
                      <p className="text-sm font-bold text-gray-900 mb-1">{address.location_address}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-1">{formatAddress(address)}</p>
                    <p className="text-xs text-gray-500">{address.phone_number || 'N/A'}</p>
                  </div>
                </label>
              ))}
              <button
                onClick={() => {
                  setShowAddressPopup(false);
                  setShowAddAddressPopup(true);
                }}
                className="w-full text-sm text-[#ec1b45] hover:underline font-medium text-center py-2"
              >
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Invisible backdrop to catch clicks */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setShowSuccessPopup(false)}
          ></div>

          <div className="bg-white w-full sm:w-auto sm:min-w-[400px] p-8 rounded-t-2xl sm:rounded-xl shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-gray-100 pointer-events-auto transform transition-transform duration-300 ease-out">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <FaCheckCircle size={40} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Request Submitted Successfully!
            </h3>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  // Navigate to orders page and replace history to prevent back navigation
                  navigate('/orders', { replace: true });
                }}
                className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold"
              >
                Track Status
              </button>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  // Navigate to home page and replace history to prevent back navigation
                  navigate('/home', { replace: true });
                }}
                className="w-full bg-white text-[#ec1b45] border-2 border-[#ec1b45] py-3 px-6 rounded-md hover:bg-gray-50 transition-colors font-semibold"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Popup */}
      {showAddAddressPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">Add New Address</h3>
              <button
                onClick={() => {
                  setShowAddAddressPopup(false);
                  setAddressFormData({
                    phone_number: "",
                    landmark: "",
                    location_address: "",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "",
                    tag: "Home",
                    latitude: "1",
                    longitude: "1",
                    is_default: true,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAddressSubmit} className="p-4 space-y-4">
              {/* Name (Location Address) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location_address"
                  value={addressFormData.location_address}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={addressFormData.phone_number}
                  onChange={handleAddressInputChange}
                  required
                  maxLength={10}
                  placeholder="Enter mobile number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* Flat No. Street Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat No. Street Details <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={addressFormData.address}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter flat no. and street details"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={addressFormData.landmark}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter landmark"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={addressFormData.state}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter state"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* District (City) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={addressFormData.city}
                  onChange={handleAddressInputChange}
                  required
                  placeholder="Enter district"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={addressFormData.pincode}
                  onChange={handleAddressInputChange}
                  required
                  maxLength={6}
                  placeholder="Enter pincode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                />
              </div>

              {/* Address Type (Tag) - Home/Office only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tag"
                      value="Home"
                      checked={addressFormData.tag === 'Home'}
                      onChange={handleAddressInputChange}
                      className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                      style={{ accentColor: '#ec1b45' }}
                    />
                    <span className="text-sm text-gray-700">Home</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tag"
                      value="Office"
                      checked={addressFormData.tag === 'Office'}
                      onChange={handleAddressInputChange}
                      className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                      style={{ accentColor: '#ec1b45' }}
                    />
                    <span className="text-sm text-gray-700">Office</span>
                  </label>
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  name="is_default"
                  id="is_default_address_exchange"
                  checked={addressFormData.is_default}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-4 h-4 text-[#ec1b45] border-gray-300 rounded focus:ring-[#ec1b45] cursor-pointer"
                  style={{ accentColor: '#ec1b45' }}
                />
                <label htmlFor="is_default_address_exchange" className="text-sm text-gray-700 cursor-pointer">
                  Set as default address
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAddressPopup(false);
                    setAddressFormData({
                      phone_number: "",
                      landmark: "",
                      location_address: "",
                      address: "",
                      city: "",
                      state: "",
                      pincode: "",
                      country: "",
                      tag: "Home",
                      latitude: "1",
                      longitude: "1",
                      is_default: true,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAddressFormValid() || isAddingAddress}
                  className="flex-1 px-4 py-2 bg-[#ec1b45] text-white rounded-md hover:bg-[#d91b40] transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isAddingAddress ? "Adding..." : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeOrderDetailsPage;

