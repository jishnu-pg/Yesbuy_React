import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { listAddresses } from "../services/api/address";
import { listBankAccounts } from "../services/api/bankAccount";
import { returnOrder } from "../services/api/order";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { FaArrowLeft, FaCopy, FaCheckCircle, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

const ReturnRefundPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetail, setOrderDetail] = useState(location.state?.orderDetail || null);
  const [returnReason, setReturnReason] = useState(location.state?.returnReason || "");
  const [additionalComment, setAdditionalComment] = useState(location.state?.additionalComment || "");
  const [addresses, setAddresses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch addresses
      const addressesResponse = await listAddresses();
      if (addressesResponse.results) {
        setAddresses(addressesResponse.results);
        // Set default address or first address
        const defaultAddress = addressesResponse.results.find(addr => addr.is_default) || addressesResponse.results[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }

      // Fetch bank accounts
      try {
        const bankAccountsResponse = await listBankAccounts();
        if (bankAccountsResponse.results) {
          setBankAccounts(bankAccountsResponse.results);
          // Select first account if available
          if (bankAccountsResponse.results.length > 0) {
            setSelectedBankAccountId(bankAccountsResponse.results[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
        // Bank accounts might not be available, continue without them
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showError("Failed to load data. Please try again.");
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
    const parts = [
      address.location_address,
      address.address,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatBankAccount = (account) => {
    if (account.account_number) {
      const last4 = account.account_number.slice(-4);
      const bankName = account.bank_name || '';
      return `${bankName} ****${last4}`;
    }
    return 'N/A';
  };

  const handleContinue = async () => {
    if (!selectedAddressId) {
      showError("Please select a pickup address");
      return;
    }

    if (!selectedBankAccountId) {
      showError("Please select or add a bank account");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // The API expects cart item ID in the order_id field
      // order.id is the cart item order ID
      const cartItemId = orderDetail?.order?.id;
      
      if (!cartItemId) {
        showError("Unable to find order item ID");
        return;
      }
      
      const returnData = {
        order_id: cartItemId,
        address_id: selectedAddressId,
        reason: returnReason,
        sub_reason: additionalComment || undefined,
        bank_account_id: selectedBankAccountId,
        return_type: 'DELIVERY',
      };

      await returnOrder(returnData);
      showSuccess("Return initiated successfully!");
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error("Failed to return order:", error);
      showError(error.message || "Failed to initiate return. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewAccount = () => {
    navigate(`/order/${orderId}/return/add-account`, {
      state: {
        orderDetail,
        returnReason,
        additionalComment,
        selectedAddressId,
      },
    });
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
  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/order/${orderId}/return`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm font-medium">Order Refund Cash</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Order Refund Cash</h1>
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

        {/* Pickup Address */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pickup Address</h2>
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
                <p className="font-medium text-gray-900 mb-1">{selectedAddress.phone_number || 'N/A'}</p>
                <p className="text-sm text-gray-600">{formatAddress(selectedAddress)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No address selected</p>
          )}
        </div>

        {/* Refund Amount */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Refund Amount : {formatPrice(order.total_amount)}
          </h2>
        </div>

        {/* Add Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Account</h2>
          <p className="text-sm text-gray-600 mb-4">
            Refund will be transferred to your bank account with in 7 business days after pickup is completed.
          </p>

          {bankAccounts.length > 0 ? (
            <div className="space-y-3 mb-4">
              {bankAccounts.map((account) => (
                <label
                  key={account.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="bankAccount"
                    value={account.id}
                    checked={selectedBankAccountId === account.id}
                    onChange={(e) => setSelectedBankAccountId(Number(e.target.value))}
                    className="mt-1 w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatBankAccount(account)}
                    </p>
                    {account.ifsc_code && (
                      <p className="text-xs text-gray-600">{account.ifsc_code}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">No bank accounts added yet.</p>
          )}

          <button
            onClick={handleAddNewAccount}
            className="text-sm text-[#ec1b45] hover:underline font-medium"
          >
            + Add New Account
          </button>
        </div>

        {/* Continue Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border sm:mt-6">
          <button
            onClick={handleContinue}
            disabled={isSubmitting || !selectedAddressId || !selectedBankAccountId}
            className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>

      {/* Address Change Popup */}
      {showAddressPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
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
              {addresses.map((address) => (
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
                      {address.tag || 'Address'}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">{address.phone_number || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{formatAddress(address)}</p>
                  </div>
                </label>
              ))}
              <button
                onClick={() => {
                  setShowAddressPopup(false);
                  navigate('/addresses');
                }}
                className="w-full text-sm text-[#ec1b45] hover:underline font-medium text-center py-2"
              >
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRefundPage;

