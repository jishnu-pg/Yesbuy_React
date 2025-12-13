import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { listAddresses, addAddress } from "../services/api/address";
import { listBankAccounts, addBankAccount } from "../services/api/bankAccount";
import { returnOrder, getOrderDetails } from "../services/api/order";
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
  const [returnMethod, setReturnMethod] = useState(location.state?.returnMethod || "Return Online");
  const [addresses, setAddresses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showBankRefundPopup, setShowBankRefundPopup] = useState(false);
  const [showDirectStorePopup, setShowDirectStorePopup] = useState(false);
  const [showAddAccountPopup, setShowAddAccountPopup] = useState(false);
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
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
    account_type: "SAVINGS",
  });
  const [accountFormErrors, setAccountFormErrors] = useState({
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: "",
  });

  // Prevent back navigation to return pages after successful submission
  useEffect(() => {
    // This effect runs once when component mounts
    // We'll use it to replace the previous history entry if we came from a return-related page
    
    // Check if we have state indicating we came from a return flow
    if (location.state?.fromReturnFlow) {
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

  // Auto-select bank account only if it's mandatory (not for BANK payments)
  useEffect(() => {
    if (orderDetail && bankAccounts.length > 0) {
      const paymentMethod = orderDetail?.payment_method || "";
      const isBankPayment = paymentMethod?.toLowerCase() === "bank";
      const isDirectStoreReturn = returnMethod === "Return Direct From Store";
      const isBankAccMandatory = !isBankPayment && !isDirectStoreReturn;

      // Only auto-select if bank account is mandatory and none is selected
      if (isBankAccMandatory && !selectedBankAccountId) {
        setSelectedBankAccountId(bankAccounts[0].id);
      } else if (!isBankAccMandatory) {
        // Clear selection if not mandatory
        setSelectedBankAccountId(null);
      }
    }
  }, [orderDetail, bankAccounts, returnMethod]);

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

      // Fetch bank accounts (will conditionally use based on payment method)
      try {
        const bankAccountsResponse = await listBankAccounts();
        if (bankAccountsResponse.results) {
          setBankAccounts(bankAccountsResponse.results);
          // Don't auto-select - will be handled in useEffect based on payment method
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

  const formatBankAccount = (account) => {
    if (account.account_number) {
      const last4 = account.account_number.slice(-4);
      const bankName = account.bank_name || '';
      return `${bankName} ****${last4}`;
    }
    return 'N/A';
  };

  // Check payment method and return method
  // Payment method is at result level, not inside order object
  const paymentMethod = orderDetail?.payment_method || "";
  const isBankPayment = paymentMethod?.toLowerCase() === "bank";
  const isDirectStoreReturn = returnMethod === "Return Direct From Store";
  const isBankAccMandatory = !isBankPayment && !isDirectStoreReturn;

  // Debug logging (remove in production)
  console.log("Return Refund Page - Payment Method Detection:", {
    paymentMethod,
    isBankPayment,
    isDirectStoreReturn,
    isBankAccMandatory,
    orderDetailPaymentMethod: orderDetail?.payment_method,
    fullOrderDetail: orderDetail
  });

  const handleContinue = async () => {
    // For "Return Direct From Store", show confirmation popup
    if (isDirectStoreReturn) {
      setShowDirectStorePopup(true);
      return;
    }

    // For BANK payment, show refund to original payment popup
    if (isBankPayment) {
      setShowBankRefundPopup(true);
      return;
    }

    // For "Return Online" (COD/PICKUP), validate address and bank account
    if (!selectedAddressId) {
      showError("Please select a pickup address");
      return;
    }

    if (!selectedBankAccountId) {
      showError("Please select or add a bank account");
      return;
    }

    // Submit return
    await submitReturn();
  };

  const submitReturn = async () => {
    try {
      setIsSubmitting(true);

      // Validate additional comment is not empty (required in Flutter)
      if (!additionalComment || additionalComment.trim() === "") {
        showError("Please enter a comment before continuing");
        setIsSubmitting(false);
        return;
      }

      // The API expects cart item ID in the order_id field
      const cartItemId = orderDetail?.order?.id;

      if (!cartItemId) {
        showError("Unable to find order item ID");
        setIsSubmitting(false);
        return;
      }

      // Determine return type based on return method
      const returnType = isDirectStoreReturn ? "IN_STORE" : "DELIVERY";

      // Bank account is only required for COD/PICKUP with "Return Online"
      const bankAccountId = isBankAccMandatory ? selectedBankAccountId : "";

      const returnData = {
        order_id: cartItemId,
        address_id: isDirectStoreReturn ? "" : selectedAddressId,
        reason: returnReason,
        sub_reason: additionalComment.trim(), // Required field, always send
        bank_account_id: bankAccountId,
        return_type: returnType,
      };

      await returnOrder(returnData);
      showSuccess("Return initiated successfully!");
      
      // Replace current history entry and navigate to order details to prevent back navigation
      navigate(`/order/${orderId}`, { replace: true });
    } catch (error) {
      console.error("Failed to return order:", error);
      showError(error.message || "Failed to initiate return. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowBankRefundPopup(false);
      setShowDirectStorePopup(false);
    }
  };

  const handleAddNewAccount = () => {
    setShowAddAccountPopup(true);
  };

  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (accountFormErrors[name]) {
      setAccountFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "account_holder_name":
        if (!value?.trim()) {
          error = "Account holder name is required";
        }
        break;
      case "bank_name":
        if (!value?.trim()) {
          error = "Bank name is required";
        }
        break;
      case "branch_name":
        if (!value?.trim()) {
          error = "Branch name is required";
        }
        break;
      case "account_number":
        if (!value?.trim()) {
          error = "Account number is required";
        } else if (value.length < 9 || value.length > 18) {
          error = "Account number must be between 9 and 18 digits";
        }
        break;
      case "confirm_account_number":
        if (!value?.trim()) {
          error = "Please re-enter account number";
        } else if (accountFormData.account_number && value !== accountFormData.account_number) {
          error = "Account numbers do not match";
        }
        break;
      case "ifsc_code":
        if (!value?.trim()) {
          error = "IFSC code is required";
        } else if (value.length !== 11) {
          error = "IFSC code must be 11 characters";
        }
        break;
      default:
        break;
    }

    return error;
  };

  const handleAccountFieldBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setAccountFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Also validate confirm_account_number if account_number changed
    if (name === "account_number" && accountFormData.confirm_account_number) {
      const confirmError = validateField("confirm_account_number", accountFormData.confirm_account_number);
      setAccountFormErrors((prev) => ({
        ...prev,
        confirm_account_number: confirmError,
      }));
    }
  };

  const validateAccountForm = () => {
    const errors = {
      account_holder_name: validateField("account_holder_name", accountFormData.account_holder_name),
      bank_name: validateField("bank_name", accountFormData.bank_name),
      branch_name: validateField("branch_name", accountFormData.branch_name),
      account_number: validateField("account_number", accountFormData.account_number),
      confirm_account_number: validateField("confirm_account_number", accountFormData.confirm_account_number),
      ifsc_code: validateField("ifsc_code", accountFormData.ifsc_code),
      account_type: "",
    };

    setAccountFormErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== "");

    if (hasErrors) {
      // Show first error message
      const firstError = Object.values(errors).find(error => error !== "");
      if (firstError) {
        showError(firstError);
      }
      return false;
    }

    return true;
  };

  const isAccountFormValid = () => {
    // Check all required fields are filled
    if (!accountFormData.account_holder_name?.trim()) return false;
    if (!accountFormData.bank_name?.trim()) return false;
    if (!accountFormData.branch_name?.trim()) return false;
    if (!accountFormData.account_number?.trim()) return false;
    if (!accountFormData.confirm_account_number?.trim()) return false;
    if (!accountFormData.ifsc_code?.trim()) return false;
    if (!accountFormData.account_type) return false;

    // Check account numbers match
    if (accountFormData.account_number !== accountFormData.confirm_account_number) return false;

    // Check account number length (9-18 digits)
    const accountNumberLength = accountFormData.account_number.length;
    if (accountNumberLength < 9 || accountNumberLength > 18) return false;

    // Check IFSC code length (11 characters)
    if (accountFormData.ifsc_code.length !== 11) return false;

    return true;
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();

    if (!validateAccountForm()) {
      return;
    }

    try {
      setIsAddingAccount(true);

      const submitFormData = new FormData();
      submitFormData.append('account_holder_name', accountFormData.account_holder_name);
      submitFormData.append('bank_name', accountFormData.bank_name);
      submitFormData.append('branch_name', accountFormData.branch_name);
      submitFormData.append('account_number', accountFormData.account_number);
      submitFormData.append('ifsc_code', accountFormData.ifsc_code.toUpperCase());
      submitFormData.append('account_type', accountFormData.account_type);

      await addBankAccount(submitFormData);

      // Refresh bank accounts list
      const bankAccountsResponse = await listBankAccounts();
      if (bankAccountsResponse.results) {
        setBankAccounts(bankAccountsResponse.results);
        // Select the newly added account (it will be the last one)
        if (bankAccountsResponse.results.length > 0) {
          setSelectedBankAccountId(bankAccountsResponse.results[bankAccountsResponse.results.length - 1].id);
        }
      }

      showSuccess("Bank account added successfully!");

      // Reset form and close popup
      setAccountFormData({
        account_number: "",
        confirm_account_number: "",
        ifsc_code: "",
        account_holder_name: "",
        bank_name: "",
        branch_name: "",
      });
      setShowAddAccountPopup(false);
    } catch (error) {
      console.error("Failed to add bank account:", error);
      showError(error.message || "Failed to add bank account. Please try again.");
    } finally {
      setIsAddingAccount(false);
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

        {/* Pickup Address - Only for "Return Online" */}
        {!isDirectStoreReturn && (
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

        {/* Refund Amount - Only show for non-BANK payments */}
        {!isBankPayment && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Refund Amount : {formatPrice(order.total_amount)}
            </h2>
          </div>
        )}

        {/* Add Account - Only for COD/PICKUP with "Return Online" */}
        {isBankAccMandatory && (
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
        )}

        {/* Continue Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border sm:mt-6">
          <button
            onClick={handleContinue}
            disabled={isSubmitting || (!isDirectStoreReturn && !isBankPayment && (!selectedAddressId || !selectedBankAccountId))}
            className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : isDirectStoreReturn ? "Process In Store Return" : "Continue"}
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

      {/* Bank Payment Refund Popup */}
      {showBankRefundPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Refund to Original Payment Method</h3>
              <button
                onClick={() => setShowBankRefundPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Refund to your original payment method, contact Yes Bharath for your refund status.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBankRefundPopup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#ec1b45] text-white rounded-md hover:bg-[#d91b40] transition-colors font-medium disabled:bg-gray-300"
              >
                {isSubmitting ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Store Return Popup */}
      {showDirectStorePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 text-center flex-1">Return Direct<br />From Store</h3>
              <button
                onClick={() => setShowDirectStorePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Return your item at our store with the original receipt and intact packaging. Once inspected and approved, choose a refund to your payment method, subject to our return policy timeframes. A return receipt will be provided.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDirectStorePopup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#ec1b45] text-white rounded-md hover:bg-[#d91b40] transition-colors font-medium disabled:bg-gray-300"
              >
                {isSubmitting ? "Processing..." : "Process In Store Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Popup */}
      {showAddAccountPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">Add New Bank Account</h3>
              <button
                onClick={() => {
                  setShowAddAccountPopup(false);
                  setAccountFormData({
                    account_number: "",
                    confirm_account_number: "",
                    ifsc_code: "",
                    account_holder_name: "",
                    bank_name: "",
                    branch_name: "",
                    account_type: "SAVINGS",
                  });
                  setAccountFormErrors({
                    account_holder_name: "",
                    bank_name: "",
                    branch_name: "",
                    account_number: "",
                    confirm_account_number: "",
                    ifsc_code: "",
                    account_type: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAccountSubmit} className="p-4 space-y-4">
              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={accountFormData.account_holder_name}
                  onChange={handleAccountInputChange}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Enter account holder name"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none ${accountFormErrors.account_holder_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.account_holder_name && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.account_holder_name}</p>
                )}
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={accountFormData.bank_name}
                  onChange={handleAccountInputChange}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Enter bank name"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none ${accountFormErrors.bank_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.bank_name && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.bank_name}</p>
                )}
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branch_name"
                  value={accountFormData.branch_name}
                  onChange={handleAccountInputChange}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Enter branch name"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none ${accountFormErrors.branch_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.branch_name && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.branch_name}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={accountFormData.account_number}
                  onChange={handleAccountInputChange}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Enter account number"
                  maxLength={18}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none ${accountFormErrors.account_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.account_number && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.account_number}</p>
                )}
              </div>

              {/* Re-enter Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Re-enter Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="confirm_account_number"
                  value={accountFormData.confirm_account_number}
                  onChange={handleAccountInputChange}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Re-enter account number"
                  maxLength={18}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none ${accountFormErrors.confirm_account_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.confirm_account_number && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.confirm_account_number}</p>
                )}
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={accountFormData.ifsc_code}
                  onChange={(e) => {
                    setAccountFormData((prev) => ({
                      ...prev,
                      ifsc_code: e.target.value.toUpperCase(),
                    }));
                    // Clear error when typing
                    if (accountFormErrors.ifsc_code) {
                      setAccountFormErrors((prev) => ({
                        ...prev,
                        ifsc_code: "",
                      }));
                    }
                  }}
                  onBlur={handleAccountFieldBlur}
                  placeholder="Enter IFSC code"
                  maxLength={11}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none uppercase ${accountFormErrors.ifsc_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {accountFormErrors.ifsc_code && (
                  <p className="text-sm text-red-600 mt-1">{accountFormErrors.ifsc_code}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="account_type"
                  value={accountFormData.account_type}
                  onChange={handleAccountInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
                >
                  <option value="SAVINGS">SAVINGS</option>
                  <option value="CURRENT">CURRENT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccountPopup(false);
                    setAccountFormData({
                      account_number: "",
                      confirm_account_number: "",
                      ifsc_code: "",
                      account_holder_name: "",
                      bank_name: "",
                      branch_name: "",
                      account_type: "SAVINGS",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAccountFormValid() || isAddingAccount}
                  className="flex-1 px-4 py-2 bg-[#ec1b45] text-white rounded-md hover:bg-[#d91b40] transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isAddingAccount ? "Adding..." : "Add Account"}
                </button>
              </div>
            </form>
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
                    tag: "Home",
                    location_address: "",
                    address: "",
                    landmark: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                    phone_number: "",
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
                  id="is_default_address"
                  checked={addressFormData.is_default}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-4 h-4 text-[#ec1b45] border-gray-300 rounded focus:ring-[#ec1b45] cursor-pointer"
                  style={{ accentColor: '#ec1b45' }}
                />
                <label htmlFor="is_default_address" className="text-sm text-gray-700 cursor-pointer">
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

export default ReturnRefundPage;
