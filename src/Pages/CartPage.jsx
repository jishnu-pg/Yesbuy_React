import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaTrash, FaShoppingBag, FaTimes, FaExclamationTriangle, FaTag, FaCheckCircle, FaArrowRight, FaChevronDown, FaMinus, FaPlus, FaCheck } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { getCart, deleteCartItem, addToCart } from "../services/api/cart";
import { removeCoupon, applyCoupon } from "../services/api/coupon";
import { pickupFromStore, completePayment, updateTransactionStatus } from "../services/api/order";
import { listAddresses, setDefaultAddress as apiSetDefaultAddress, addAddress } from "../services/api/address";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { initializeEasebuzzPayment, isPaymentSuccess, getTransactionId } from "../utils/easebuzz";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Coupon states
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState(null);

  // Size and quantity update states
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [openSizeDropdown, setOpenSizeDropdown] = useState(null); // Track which item's dropdown is open
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Address states
  const [userAddresses, setUserAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Add address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    phone_number: '',
    landmark: '',
    location_address: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '', // Empty string to match Flutter and AddressManagement
    tag: 'Home', // Default to 'Home' to match Flutter and AddressManagement
    latitude: '1',
    longitude: '1',
    is_default: false,
  });

  const handleCheckout = async () => {
    if (selectedPaymentMethod === 'PICKUP IN STORE') {
      // Handle pickup from store
      try {
        const cartId = cartData?.cart_id;
        if (!cartId) {
          showError("Cart not found");
          return;
        }

        // Check for out of stock items
        const outOfStockItems = cartData?.cart_items?.filter(item => !item.is_in_stock);
        if (outOfStockItems && outOfStockItems.length > 0) {
          showError("Cart has items which are out of stock. Please remove them and try again.");
          return;
        }

        const response = await pickupFromStore(cartId);

        if (response.order_id) {
          // Navigate to success page with order details
          navigate('/pickup-success', {
            state: {
              orderData: response,
              cartData: cartData
            }
          });
        } else {
          showError(response.message || "Failed to create pickup order");
        }
      } catch (error) {
        console.error("Failed to create pickup order:", error);
        showError(error?.message || "Failed to create pickup order. Please try again.");
      }
    } else if (selectedPaymentMethod === 'COD') {
      // Handle COD checkout
      if (!defaultAddress) {
        showError("Please select a delivery address to proceed");
        return;
      }
      try {
        const cartId = cartData?.cart_id;
        if (!cartId) {
          showError("Cart not found");
          return;
        }

        // Check for out of stock items
        const outOfStockItems = cartData?.cart_items?.filter(item => !item.is_in_stock);
        if (outOfStockItems && outOfStockItems.length > 0) {
          showError("Cart has items which are out of stock. Please remove them and try again.");
          return;
        }

        const deliveryDate = new Date().toISOString().split('T')[0];

        // Show loader or disable button? Button is disabled if no method selected.
        // Ideally we should have a loading state for button.

        const response = await completePayment({
          cart_id: cartId,
          date: deliveryDate,
          payment_method: 'COD',
          user_address_id: defaultAddress.id
        });

        if (response.data && (response.data.order_id || response.data.last_order_id)) {
          navigate('/order-success', {
            state: {
              orderData: response.data,
              cartData: cartData
            }
          });
        } else {
          showError(response.message || "Failed to place order");
        }
      } catch (error) {
        console.error("COD Order failed:", error);
        showError(error?.message || "Failed to place order. Please try again.");
      }
    } else if (selectedPaymentMethod === 'BANK') {
      // Handle BANK payment with Easebuzz
      if (!defaultAddress) {
        showError("Please select a delivery address to proceed");
        return;
      }

      try {
        setIsProcessingPayment(true);
        const cartId = cartData?.cart_id;
        if (!cartId) {
          showError("Cart not found");
          setIsProcessingPayment(false);
          return;
        }

        // Check for out of stock items
        const outOfStockItems = cartData?.cart_items?.filter(item => !item.is_in_stock);
        if (outOfStockItems && outOfStockItems.length > 0) {
          showError("Cart has items which are out of stock. Please remove them and try again.");
          setIsProcessingPayment(false);
          return;
        }

        const deliveryDate = new Date().toISOString().split('T')[0];

        // Call complete-payment API to get Easebuzz credentials
        const response = await completePayment({
          cart_id: cartId,
          date: deliveryDate,
          payment_method: 'BANK',
          user_address_id: defaultAddress.id
        });

        if (!response.data) {
          showError(response.message || "Failed to initiate payment");
          setIsProcessingPayment(false);
          return;
        }

        const paymentData = response.data;

        // Log payment data for debugging (remove sensitive data in production)
        console.log('Complete Payment Response:', {
          ...paymentData,
          access_key: paymentData.access_key ? '***' : undefined,
          hash: paymentData.hash ? '***' : undefined,
        });

        // Validate required Easebuzz credentials
        if (!paymentData.access_key || !paymentData.env || !paymentData.order_id) {
          console.error('Missing required payment data:', {
            hasAccessKey: !!paymentData.access_key,
            hasEnv: !!paymentData.env,
            hasOrderId: !!paymentData.order_id,
            paymentData: paymentData,
          });
          showError("Payment gateway configuration error. Please try again.");
          setIsProcessingPayment(false);
          return;
        }

        // Store cart data for callback page (in case form submission is used)
        sessionStorage.setItem('easebuzz_cart_data', JSON.stringify(cartData));

        // Initialize Easebuzz payment
        // Use hardcoded URLs like Django app (redirection approach)
        console.log('Initializing Easebuzz payment...', paymentData);
        initializeEasebuzzPayment(
          {
            access_key: paymentData.access_key,
            env: paymentData.env,
            amount: paymentData.amount,
            currency: paymentData.currency || 'INR',
            customer_name: paymentData.customer_name,
            customer_email: paymentData.customer_email || '',
            mobile: paymentData.mobile,
            order_id: paymentData.order_id,
            hash: paymentData.hash, // Add hash if backend provides it
            productinfo: paymentData.productinfo, // Add productinfo if backend provides it
            surl: window.location.origin + '/payment-success', // Override backend surl with custom success URL
            furl: window.location.origin + '/payment-fail', // Override backend furl with custom failure URL
            sdk_url: paymentData.sdk_url, // SDK URL if backend provides it
            payment_url: paymentData.payment_url, // Payment URL if backend provides it
          },
          // Success callback (only called if SDK approach is used)
          async (paymentResponse) => {
            try {
              setIsProcessingPayment(false);
              sessionStorage.removeItem('easebuzz_cart_data');

              // Check if payment was successful
              if (isPaymentSuccess(paymentResponse)) {
                const transactionId = getTransactionId(paymentResponse);

                // Update transaction status (fire-and-forget, don't wait for response)
                if (transactionId) {
                  updateTransactionStatus(transactionId).catch((error) => {
                    console.error("Failed to update transaction status:", error);
                    // Don't show error to user, payment was successful
                  });
                }

                // Clear cart data
                const cartIdToClear = cartData?.cart_id || '';
                if (cartIdToClear) {
                  localStorage.setItem('cartId', '');
                }

                // Show success message
                showSuccess("Payment successful! Your order has been placed.");

                // Navigate to order success page (same page used for COD)
                navigate('/order-success', {
                  state: {
                    orderData: {
                      order_id: paymentData.order_id,
                      last_order_id: paymentData.order_id,
                      amount: paymentData.amount,
                    },
                    cartData: cartData
                  }
                });
    } else {
                // Payment failed
                showError("Order Failed! We were unable to process your order due to a payment issue. Please check your payment method and try again.");
              }
            } catch (error) {
              console.error("Error handling payment response:", error);
              showError("Error processing payment. Please contact support.");
            }
          },
          // Failure callback (only called if SDK approach is used)
          (error) => {
            setIsProcessingPayment(false);
            sessionStorage.removeItem('easebuzz_cart_data');
            console.error("Easebuzz payment error:", error);
            showError("Order Failed! We were unable to process your order due to a payment issue. Please check your payment method and try again.");
          }
        );
      } catch (error) {
        setIsProcessingPayment(false);
        console.error("Bank payment initiation failed:", error);
        showError(error?.message || "Failed to initiate payment. Please try again.");
      }
    } else {
      // Regular checkout flow for other payment methods
      if (!selectedPaymentMethod) {
        showError("Please select a payment method to proceed");
        return;
      }

      // Check for out of stock items
      const outOfStockItems = cartData?.cart_items?.filter(item => !item.is_in_stock);
      if (outOfStockItems && outOfStockItems.length > 0) {
        showError("Cart has items which are out of stock. Please remove them and try again.");
        return;
      }

      // Navigate with state if needed, or just standard navigation
      navigate('/checkout', { state: { paymentMethod: selectedPaymentMethod } });
    }
  };

  useEffect(() => {
    fetchCart();
    fetchUserAddresses();
    
    // Check if we need to refresh cart after returning from payment
    const shouldRefresh = sessionStorage.getItem('refresh_cart_on_return');
    if (shouldRefresh === 'true') {
      sessionStorage.removeItem('refresh_cart_on_return');
      // Refresh cart to ensure it's up to date
      fetchCart();
    }
  }, []);

  const fetchUserAddresses = async () => {
    try {
      const response = await listAddresses();
      if (response.results) {
        setUserAddresses(response.results);
        const def = response.results.find(addr => addr.is_default) || response.results[0];
        setDefaultAddress(def);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const handleChangeAddress = async (addressId) => {
    try {
      await apiSetDefaultAddress(addressId);
      await fetchUserAddresses(); // Refresh to get updated default
      setShowAddressModal(false);
      showSuccess("Delivery address updated");
    } catch (error) {
      showError("Failed to update address");
    }
  };

  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(newAddress).forEach(key => {
        if (key === 'latitude' || key === 'longitude') {
          formDataToSend.append(key, newAddress[key] || '1');
        } else if (key === 'country') {
          // Always send country as empty string to match Flutter
          formDataToSend.append(key, '');
        } else if (newAddress[key] !== '' && newAddress[key] !== null && newAddress[key] !== undefined) {
          formDataToSend.append(key, newAddress[key]);
        }
      });

      await addAddress(formDataToSend);
      showSuccess("Address added successfully");
      setIsAddingAddress(false);
      // Reset form
      setNewAddress({
        phone_number: '',
        landmark: '',
        location_address: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '', // Empty string to match Flutter
        tag: 'Home', // Default to 'Home' to match Flutter
        latitude: '1',
        longitude: '1',
        is_default: false,
      });
      // Refresh addresses
      await fetchUserAddresses();
    } catch (error) {
      console.error("Failed to add address:", error);
      showError("Failed to add address");
    }
  };

  // Check for applied coupon in cart data
  useEffect(() => {
    if (!cartData) {
      setAppliedCouponCode(null);
      // Don't auto-select payment method
      return;
    }

    // Check coupon_details.code first (from API response structure)
    const couponCode = cartData?.coupon_details?.code ||
      cartData?.bill_details?.coupon_applied ||
      cartData?.bill_details?.coupon_code ||
      cartData?.coupon_code ||
      cartData?.applied_coupon;

    if (couponCode) {
      setAppliedCouponCode(couponCode);
    } else {
      setAppliedCouponCode(null);
    }
  }, [cartData]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      // Call getCart without cart_id - API will return current user's cart
      const response = await getCart();

      if (response.status && response.data) {
        setCartData(response.data);
        // Dispatch custom event to update header cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setCartData(null);
        // Dispatch event even if cart is empty
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      const errorMessage = error?.message || "";

      // Don't show error toast for empty cart or "no active cart" messages
      // These are normal states, not errors
      const isCartNotFoundError = errorMessage.toLowerCase().includes("no active cart") ||
        errorMessage.toLowerCase().includes("cart not found") ||
        errorMessage.toLowerCase().includes("no cart");

      if (!isCartNotFoundError && errorMessage) {
        // Only show error for actual errors, not empty cart scenarios
        showError(errorMessage);
      }

      setCartData(null);
      // Dispatch event even if cart fetch fails (to update header count)
      window.dispatchEvent(new Event('cartUpdated'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingItemId(itemToDelete);
      const response = await deleteCartItem(itemToDelete);

      if (response.status) {
        showSuccess(response.message || "Item removed from cart");
        // Refresh cart after deletion
        await fetchCart();
      } else {
        // Extract error message from response
        const errorMsg = response.message ||
          response.error ||
          (Array.isArray(response.errors) ? response.errors.join(', ') : response.errors) ||
          "Failed to remove item";
        showError(errorMsg);
      }
    } catch (error) {
      console.error("Failed to delete cart item:", error);
      const errorMessage = error?.message || "Failed to remove item. Please try again.";
      showError(errorMessage);
    } finally {
      setDeletingItemId(null);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Handle size change
  const handleSizeChange = async (cartItem, newSize, newVariantId) => {
    if (!newSize || !newVariantId) {
      showError("Please select a valid size");
      return;
    }

    const productDetail = cartItem.product_details?.[0];
    if (!productDetail) {
      showError("Product details not found");
      return;
    }

    try {
      setUpdatingItemId(cartItem.id);
      // Get cart_id from current cart data
      const cartId = cartData?.cart_id || '0';

      // Preserve coupon code before updating size
      const couponCodeToReapply = appliedCouponCode ||
        cartData?.coupon_details?.code ||
        cartData?.bill_details?.coupon_applied ||
        cartData?.bill_details?.coupon_code ||
        cartData?.coupon_code ||
        cartData?.applied_coupon;

      // Delete the old cart item
      await deleteCartItem(cartItem.id);

      // Determine size_type - use backend format (with underscore)
      let sizeType = productDetail.size_type || 'others';
      if (sizeType === 'runningmaterial' || sizeType === 'running_material') {
        sizeType = 'running_material';
      } else if (sizeType === 'clothingsize' || sizeType === 'clothing_size') {
        sizeType = 'clothing_size';
      }

      // Prepare new cart item data
      const cartItemData = {
        product_id: productDetail.product_id || productDetail.id,
        product_variant_id: newVariantId,
        size_type: sizeType,
        color_name: productDetail.color_name || null,
      };

      // Add size_type specific fields
      if (sizeType === 'running_material') {
        // For running material, use the same meter value or default
        cartItemData.meter = cartItem.selected_meter || 1;
      } else {
        cartItemData.size = newSize;
        cartItemData.quantity = cartItem.selected_quantity || 1;
      }

      // Add the new item with updated size
      const response = await addToCart(cartId, cartItemData);

      if (response.status) {
        // Fetch cart to get updated cart data
        const updatedCartResponse = await getCart(cartId);

        // Re-apply coupon if it was applied before
        if (couponCodeToReapply && updatedCartResponse?.data) {
          try {
            const updatedCartId = updatedCartResponse.data.cart_id || cartId;
            await applyCoupon({
              coupon_code: couponCodeToReapply,
              cart_id: updatedCartId
            });
          } catch (couponError) {
            console.error("Failed to re-apply coupon:", couponError);
            // Don't show error to user as size update was successful
          }
        }

        // Fetch cart again to get final state with coupon applied
        await fetchCart();
        showSuccess("Size updated successfully");
      } else {
        showError(response.message || "Failed to update size");
      }
    } catch (error) {
      console.error("Failed to update size:", error);
      showError(error?.message || "Failed to update size. Please try again.");
    } finally {
      setUpdatingItemId(null);
      setOpenSizeDropdown(null);
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (cartItem, newQuantity) => {
    if (newQuantity <= 0) {
      showError("Quantity must be greater than 0");
      return;
    }

    const productDetail = cartItem.product_details?.[0];
    if (!productDetail) {
      showError("Product details not found");
      return;
    }

    // Check stock availability
    const selectedSize = productDetail.size;
    const availableSize = productDetail.variant_avail_size?.find(
      (s) => s.size === selectedSize
    );

    if (availableSize && newQuantity > availableSize.available_count) {
      showError(`Only ${availableSize.available_count} items available in stock`);
      return;
    }

    try {
      setUpdatingItemId(cartItem.id);
      // Get cart_id from current cart data
      const cartId = cartData?.cart_id || '0';

      // Preserve coupon code before updating quantity
      const couponCodeToReapply = appliedCouponCode ||
        cartData?.coupon_details?.code ||
        cartData?.bill_details?.coupon_applied ||
        cartData?.bill_details?.coupon_code ||
        cartData?.coupon_code ||
        cartData?.applied_coupon;

      // Delete the old cart item
      await deleteCartItem(cartItem.id);

      // Determine size_type - use backend format (with underscore)
      let sizeType = productDetail.size_type || 'others';
      if (sizeType === 'runningmaterial' || sizeType === 'running_material') {
        sizeType = 'running_material';
      } else if (sizeType === 'clothingsize' || sizeType === 'clothing_size') {
        sizeType = 'clothing_size';
      }

      // Prepare new cart item data
      const cartItemData = {
        product_id: productDetail.product_id || productDetail.id,
        product_variant_id: productDetail.product_variant_id || productDetail.id,
        size_type: sizeType,
        color_name: productDetail.color_name || null,
      };

      // Add size_type specific fields
      if (sizeType === 'running_material') {
        cartItemData.meter = cartItem.selected_meter || 1;
      } else {
        cartItemData.size = selectedSize;
        cartItemData.quantity = newQuantity;
      }

      // Add the new item with updated quantity
      const response = await addToCart(cartId, cartItemData);

      if (response.status) {
        // Fetch cart to get updated cart data
        const updatedCartResponse = await getCart(cartId);

        // Re-apply coupon if it was applied before
        if (couponCodeToReapply && updatedCartResponse?.data) {
          try {
            const updatedCartId = updatedCartResponse.data.cart_id || cartId;
            await applyCoupon({
              coupon_code: couponCodeToReapply,
              cart_id: updatedCartId
            });
          } catch (couponError) {
            console.error("Failed to re-apply coupon:", couponError);
            // Don't show error to user as quantity update was successful
            // The coupon might have been invalidated due to cart changes
          }
        }

        // Fetch cart again to get final state with coupon applied
        await fetchCart();
        showSuccess("Quantity updated successfully");
      } else {
        showError(response.message || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      showError(error?.message || "Failed to update quantity. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Handle meter change for running_material products
  const handleMeterChange = async (cartItem, newMeter) => {
    const productDetail = cartItem.product_details?.[0];
    if (!productDetail) {
      showError("Product details not found");
      return;
    }

    // Get meter limits
    const minMeter = parseFloat(productDetail.minimum_meter || 0);
    const maxMeter = parseFloat(productDetail.available_meter || productDetail.maximum_meter || 9999);
    const currentMeter = parseFloat(cartItem.selected_meter || minMeter);

    // Validate meter
    if (newMeter < minMeter) {
      showError(`Meter must be at least ${minMeter}`);
      return;
    }
    if (newMeter > maxMeter) {
      showError(`Meter cannot exceed ${maxMeter}`);
      return;
    }

    try {
      setUpdatingItemId(cartItem.id);
      // Get cart_id from current cart data
      const cartId = cartData?.cart_id || '0';

      // Preserve coupon code before updating meter
      const couponCodeToReapply = appliedCouponCode ||
        cartData?.coupon_details?.code ||
        cartData?.bill_details?.coupon_applied ||
        cartData?.bill_details?.coupon_code ||
        cartData?.coupon_code ||
        cartData?.applied_coupon;

      // Delete the old cart item
      await deleteCartItem(cartItem.id);

      // Determine size_type - use backend format (with underscore)
      let sizeType = productDetail.size_type || 'running_material';
      if (sizeType === 'runningmaterial' || sizeType === 'running_material') {
        sizeType = 'running_material';
      }

      // Prepare new cart item data
      const cartItemData = {
        product_id: productDetail.product_id || productDetail.id,
        product_variant_id: cartItem.product_variant_id,
        size_type: sizeType,
        color_name: productDetail.color_name || null,
        meter: parseFloat(newMeter),
      };

      // Add the new item with updated meter
      const response = await addToCart(cartId, cartItemData);

      if (response.status) {
        // Fetch cart to get updated cart data
        const updatedCartResponse = await getCart(cartId);

        // Re-apply coupon if it was applied before
        if (couponCodeToReapply && updatedCartResponse?.data) {
          try {
            const updatedCartId = updatedCartResponse.data.cart_id || cartId;
            await applyCoupon({
              coupon_code: couponCodeToReapply,
              cart_id: updatedCartId
            });
          } catch (couponError) {
            console.error("Failed to re-apply coupon:", couponError);
            // Don't show error to user as meter update was successful
          }
        }

        // Fetch cart again to get final state with coupon applied
        await fetchCart();
        showSuccess("Meter updated successfully");
      } else {
        showError(response.message || "Failed to update meter");
      }
    } catch (error) {
      console.error("Failed to update meter:", error);
      showError(error?.message || "Failed to update meter. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };


  const handleRemoveCoupon = async () => {
    if (!appliedCouponCode) {
      showError("No coupon applied to remove.");
      return;
    }

    // Use cart_id from current cart data, fallback to localStorage
    const cartId = cartData?.cart_id || getCartId();
    if (!cartId) {
      showError("Cart not found.");
      return;
    }

    try {
      setIsRemovingCoupon(true);

      // Debug: Log what we're sending
      console.log('Removing coupon with data:', {
        coupon_code: appliedCouponCode,
        cart_id: cartId
      });

      const response = await removeCoupon({
        coupon_code: appliedCouponCode,
        cart_id: cartId,
      });

      if (response.success) {
        showSuccess(response.message || "Coupon removed successfully!");
        setAppliedCouponCode(null);
        // Refresh cart to get updated totals
        await fetchCart();
      } else {
        // Extract error message from response
        const errorMsg = response.message ||
          response.error ||
          (Array.isArray(response.errors) ? response.errors.join(', ') : response.errors) ||
          "Failed to remove coupon";
        showError(errorMsg);
      }
    } catch (error) {
      console.error("Failed to remove coupon:", error);
      const errorMessage = error?.message || "Failed to remove coupon. Please try again.";
      showError(errorMessage);
    } finally {
      setIsRemovingCoupon(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoaderSpinner label="Loading cart..." />
        </div>
      </div>
    );
  }

  const cartItems = cartData?.cart_items || [];
  const billDetails = cartData?.bill_details || {};
  const totalAmount = parseFloat(billDetails.amount_to_pay || 0);
  const subtotal = parseFloat(billDetails.total_amount || 0);
  const discount = parseFloat(billDetails.discount_amount || 0);
  const deliveryFee = parseFloat(billDetails.delivery_fee || 0);
  const couponAmount = parseFloat(billDetails.coupon_amount || 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FaShoppingBag size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to your cart to get started.</p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Delivery Address Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-gray-900 font-bold text-base">Delivery Address</h3>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-[#ec1b45] text-xs font-semibold border border-[#ec1b45] rounded px-3 py-1 hover:bg-[#ec1b45] hover:text-white transition-colors"
                  >
                    Change
                  </button>
                </div>
                {defaultAddress ? (
                  <div className="text-gray-600 text-sm leading-snug">
                    <p className="flex items-center gap-2">
                      {defaultAddress.tag && <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-[10px] border border-gray-200 uppercase font-semibold tracking-wider">{defaultAddress.tag}</span>}
                      <span className="font-medium text-gray-900">{defaultAddress.house_no || defaultAddress.address}, {defaultAddress.street_address || defaultAddress.landmark}, {defaultAddress.city} {defaultAddress.pincode}</span>
                    </p>
                    <p className="text-xs mt-0.5">Phone: {defaultAddress.phone_number}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No address found. Please add one.</p>
                )}
              </div>

              {cartItems.map((cartItem) => {
                const productDetail = cartItem.product_details?.[0];
                if (!productDetail) return null;

                const variantImage = productDetail.variant_images?.[0]?.image ||
                  (typeof productDetail.variant_images?.[0] === 'string'
                    ? productDetail.variant_images[0]
                    : null);

                return (
                  <div
                    key={cartItem.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-100">
                          {variantImage ? (
                            <img
                              src={variantImage}
                              alt={productDetail.name || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FaShoppingBag size={32} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                              {productDetail.name || 'Product'}
                            </h3>
                            {productDetail.color_name && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">{productDetail.color_name}</span>
                              </div>
                            )}

                            {/* Size and Quantity Selectors */}
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              {/* Size Dropdown - Only show if size_type is not runningmaterial */}
                              {productDetail.size_type !== 'running_material' && productDetail.size_type !== 'runningmaterial' && (
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenSizeDropdown(openSizeDropdown === cartItem.id ? null : cartItem.id)}
                                    disabled={updatingItemId === cartItem.id}
                                    className="flex items-center gap-2 px-3 py-2 bg-[#fef2f2] rounded-md border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                                  >
                                    <span className="text-sm text-gray-600">Size</span>
                                    <span className="text-sm font-medium text-gray-900">{productDetail.size || 'N/A'}</span>
                                    <FaChevronDown size={10} className="text-gray-900 ml-auto" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {openSizeDropdown === cartItem.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenSizeDropdown(null)}
                                      />
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px] max-h-60 overflow-y-auto">
                                        {(productDetail.variant_avail_size || productDetail.avail_size || []).map((sizeOption) => (
                                          <button
                                            key={sizeOption.product_variant_id || sizeOption.size}
                                            onClick={() => {
                                              if (sizeOption.size !== productDetail.size) {
                                                handleSizeChange(cartItem, sizeOption.size, sizeOption.product_variant_id);
                                              } else {
                                                setOpenSizeDropdown(null);
                                              }
                                            }}
                                            disabled={updatingItemId === cartItem.id}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 ${sizeOption.size === productDetail.size ? 'bg-[#fef2f2] font-medium' : ''
                                              } ${sizeOption.available_count <= 0 ? 'text-gray-400 cursor-not-allowed' : ''
                                              }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span>{sizeOption.size}</span>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Quantity Selector - Only show if size_type is not runningmaterial */}
                              {productDetail.size_type !== 'running_material' && productDetail.size_type !== 'runningmaterial' && (
                                <div className="flex items-center gap-0 bg-[#fef2f2] rounded-md border border-gray-200">
                                  <button
                                    onClick={() => {
                                      const newQty = Math.max(1, (cartItem.selected_quantity || 1) - 1);
                                      handleQuantityChange(cartItem, newQty);
                                    }}
                                    disabled={updatingItemId === cartItem.id || (cartItem.selected_quantity || 1) <= 1}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FaMinus size={12} />
                                  </button>
                                  <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[50px] text-center border-l border-r border-gray-200">
                                    {String(cartItem.selected_quantity || 1).padStart(2, '0')}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const currentQty = cartItem.selected_quantity || 1;
                                      const selectedSize = productDetail.size;
                                      const availableSize = productDetail.variant_avail_size?.find(
                                        (s) => s.size === selectedSize
                                      );
                                      const maxQty = availableSize?.available_count || 999;
                                      const newQty = Math.min(maxQty, currentQty + 1);
                                      handleQuantityChange(cartItem, newQty);
                                    }}
                                    disabled={updatingItemId === cartItem.id}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FaPlus size={12} />
                                  </button>
                                </div>
                              )}

                              {/* Meter Selector for running material */}
                              {(productDetail.size_type === 'running_material' || productDetail.size_type === 'runningmaterial') && (
                                <div className="flex items-center gap-0 bg-[#fef2f2] rounded-md border border-gray-200">
                                  <button
                                    onClick={() => {
                                      const minMeter = parseFloat(productDetail.minimum_meter || 0);
                                      const currentMeter = parseFloat(cartItem.selected_meter || minMeter);
                                      const newMeter = Math.max(minMeter, currentMeter - 1);
                                      handleMeterChange(cartItem, newMeter);
                                    }}
                                    disabled={(() => {
                                      const minMeter = parseFloat(productDetail.minimum_meter || 0);
                                      const currentMeter = parseFloat(cartItem.selected_meter || minMeter);
                                      return updatingItemId === cartItem.id || currentMeter <= minMeter;
                                    })()}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FaMinus size={12} />
                                  </button>
                                  <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[60px] text-center border-l border-r border-gray-200">
                                    {parseFloat(cartItem.selected_meter || productDetail.minimum_meter || 0).toFixed(1)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const maxMeter = parseFloat(productDetail.available_meter || productDetail.maximum_meter || 9999);
                                      const currentMeter = parseFloat(cartItem.selected_meter || productDetail.minimum_meter || 0);
                                      const newMeter = Math.min(maxMeter, currentMeter + 1);
                                      handleMeterChange(cartItem, newMeter);
                                    }}
                                    disabled={(() => {
                                      const maxMeter = parseFloat(productDetail.available_meter || productDetail.maximum_meter || 9999);
                                      const currentMeter = parseFloat(cartItem.selected_meter || 0);
                                      return updatingItemId === cartItem.id || currentMeter >= maxMeter;
                                    })()}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FaPlus size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteClick(cartItem.id)}
                            disabled={deletingItemId === cartItem.id}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from cart"
                          >
                            {deletingItemId === cartItem.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <FaTrash size={18} />
                            )}
                          </button>
                        </div>

                        {/* Price and Discount */}
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xl sm:text-2xl font-bold text-gray-900">
                              {formatPrice(cartItem.total_amount)}
                            </span>
                            {cartItem.selling_amount && parseFloat(cartItem.selling_amount) > parseFloat(cartItem.total_amount) && (
                              <span className="text-base text-gray-500 line-through">
                                {formatPrice(cartItem.selling_amount)}
                              </span>
                            )}
                            {cartItem.has_discount && cartItem.discount && (
                              <span className="px-2 py-1 text-[#ec1b45] text-xs font-semibold rounded">
                                {cartItem.discount}
                              </span>
                            )}
                          </div>
                          {/* Coupon Applied Amount for this item */}
                          {cartItem.coupon_applied_amount && parseFloat(cartItem.coupon_applied_amount) > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 shadow-sm">
                              <div className="bg-green-500 rounded-full p-1">
                                <FaTag className="text-white" size={10} />
                              </div>
                              <span className="text-xs text-gray-600 font-medium">Coupon Applied Amount:</span>
                              <span className="text-green-700 font-bold text-sm">
                                {formatPrice(cartItem.coupon_applied_amount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stock Status */}
                        {!cartItem.is_in_stock && (
                          <p className="text-sm text-red-600 font-medium mb-2">
                            {cartItem.stock_message || "Out of Stock"}
                          </p>
                        )}
                        {cartItem.is_item_inactive && (
                          <p className="text-sm text-orange-600 font-medium mb-2">
                            This item is no longer available
                          </p>
                        )}

                        {/* BOGO Info */}
                        {/* {cartItem.is_bogo_free && cartItem.free_quantity > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            🎉 {cartItem.free_quantity} item(s) free (BOGO offer)
                          </p>
                        )} */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                  {/* Coupon Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    {(appliedCouponCode || couponAmount > 0) ? (
                      <div className="bg-green-100 rounded-lg p-4">
                        {/* Header: Coupon Code and Close Button */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-900 text-base sm:text-lg">
                            {appliedCouponCode || 'Coupon Applied'}
                          </p>
                          <button
                            onClick={handleRemoveCoupon}
                            disabled={isRemovingCoupon}
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove coupon"
                          >
                            {isRemovingCoupon ? (
                              <span className="animate-spin text-red-600 text-xs">⏳</span>
                            ) : (
                              <FaTimes size={12} className="text-red-600" />
                            )}
                          </button>
                        </div>

                        {/* Description */}
                        {cartData?.coupon_details?.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {cartData.coupon_details.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Link
                          to="/coupons"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-sm w-full"
                        >
                          <FaTag size={16} />
                          <span>Browse & Apply Coupons</span>
                          <FaArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-medium">-{formatPrice(discount)}</span>
                      </div>
                    )}

                    {couponAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount</span>
                        <span className="font-medium">-{formatPrice(couponAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Fee</span>
                      <span className="font-medium">
                        {deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'}
                      </span>
                    </div>

                    {billDetails.delivery_available && billDetails.message && (!selectedPaymentMethod || !selectedPaymentMethod.toLowerCase().includes('pickup')) && (
                      <p className="text-xs text-gray-500 italic">
                        {billDetails.message}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#ec1b45]">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Available Payment Methods - Radio Selection */}
                  {cartData?.payment_method && cartData.payment_method.length > 0 && (
                    <div className="mb-6 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Select Payment Method <span className="text-red-500">*</span>
                      </p>
                      <div className="flex flex-col gap-2">
                        {cartData.payment_method
                          .filter(method => {
                            const normalizedMethod = method.toUpperCase().replace(/\s+/g, ' ').trim();
                            return normalizedMethod !== 'PICKUP IN STORE';
                          }) // Exclude PICKUP IN STORE if it exists in the array
                          .map((method, index) => (
                            <label
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPaymentMethod === method
                                ? 'border-[#ec1b45] bg-red-50'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method}
                                checked={selectedPaymentMethod === method}
                                onChange={() => setSelectedPaymentMethod(method)}
                                className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {method}
                              </span>
                            </label>
                          ))}
                        {/* Add PICKUP IN STORE as a payment option */}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPaymentMethod === 'PICKUP IN STORE'
                            ? 'border-[#ec1b45] bg-red-50'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PICKUP IN STORE"
                            checked={selectedPaymentMethod === 'PICKUP IN STORE'}
                            onChange={() => setSelectedPaymentMethod('PICKUP IN STORE')}
                            className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              PICKUP IN STORE
                            </span>
                            {/* <p className="text-xs text-gray-500 mt-1">
                            Collect your order from our store
                          </p> */}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#ec1b45] text-white py-3 rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPaymentMethod || (selectedPaymentMethod === 'PICKUP IN STORE' && !cartData?.cart_id) || isProcessingPayment}
                  >
                    {isProcessingPayment 
                      ? 'Processing...' 
                      : selectedPaymentMethod === 'PICKUP IN STORE' || selectedPaymentMethod === 'COD' || selectedPaymentMethod === 'BANK'
                        ? 'Place Order' 
                        : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Remove Item</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <FaExclamationTriangle size={24} className="text-red-500" />
                <p className="text-gray-600 text-sm sm:text-base">
                  Are you sure you want to remove this item from your cart? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingItemId !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingItemId !== null ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl sticky top-0">
              <h3 className="text-lg font-bold text-gray-900">
                {isAddingAddress ? "Add New Address" : "Select Delivery Address"}
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setIsAddingAddress(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isAddingAddress ? (
                <form id="add-address-form" onSubmit={handleAddAddress} className="space-y-4">
                  {/* Name (Location Address) - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Name *</label>
                    <input
                      type="text"
                      name="location_address"
                      value={newAddress.location_address}
                      onChange={handleNewAddressChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter name"
                    />
                  </div>

                  {/* Mobile Number - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone_number"
                        value={newAddress.phone_number}
                        onChange={handleNewAddressChange}
                        required
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                        placeholder="Enter mobile number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Flat No. Street Details (Address) - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Flat No. Street Details *</label>
                    <input
                      type="text"
                      name="address"
                      value={newAddress.address}
                      onChange={handleNewAddressChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter flat no. and street details"
                    />
                  </div>

                  {/* Landmark - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Landmark *</label>
                    <input
                      type="text"
                      name="landmark"
                      value={newAddress.landmark}
                      onChange={handleNewAddressChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter landmark"
                    />
                  </div>

                  {/* State - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleNewAddressChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter state"
                    />
                  </div>

                  {/* District (City) - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">District *</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleNewAddressChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter district"
                    />
                  </div>

                  {/* Pincode - matches Flutter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={newAddress.pincode}
                      onChange={handleNewAddressChange}
                      required
                      maxLength={6}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#ec1b45]/20 focus:border-[#ec1b45] transition-all outline-none"
                      placeholder="Enter pincode"
                    />
                  </div>

                  {/* Address Type (Tag) - matches Flutter: Home/Office only */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Address Type *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tag"
                          value="Home"
                          checked={newAddress.tag === 'Home'}
                          onChange={handleNewAddressChange}
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
                          checked={newAddress.tag === 'Office'}
                          onChange={handleNewAddressChange}
                          className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                          style={{ accentColor: '#ec1b45' }}
                        />
                        <span className="text-sm text-gray-700">Office</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      name="is_default"
                      id="cart_is_default"
                      checked={newAddress.is_default}
                      onChange={handleNewAddressChange}
                      className="w-4 h-4 text-[#ec1b45] border-gray-300 rounded focus:ring-[#ec1b45] cursor-pointer"
                    />
                    <label htmlFor="cart_is_default" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Set as default address
                    </label>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {userAddresses.length > 0 ? (
                    userAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleChangeAddress(addr.id)}
                        className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${defaultAddress?.id === addr.id
                          ? "border-[#ec1b45] bg-[#ec1b45]/5 ring-1 ring-[#ec1b45]"
                          : "border-gray-200 hover:border-[#ec1b45]/50 hover:shadow-md bg-white"
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${defaultAddress?.id === addr.id ? 'border-[#ec1b45] bg-[#ec1b45]' : 'border-gray-300 group-hover:border-[#ec1b45]'
                            }`}>
                            {defaultAddress?.id === addr.id && <FaCheck size={10} className="text-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${addr.tag === 'home' ? 'bg-blue-50 text-blue-700' :
                                addr.tag === 'office' ? 'bg-purple-50 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {addr.tag || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="bg-[#ec1b45] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Default</span>
                              )}
                            </div>

                            <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                              {addr.house_no || addr.address}
                            </p>
                            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                              {addr.location_address || addr.street_address || addr.landmark}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-gray-500 text-xs mt-1.5 font-medium">
                              +91 {addr.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <IoLocationOutline size={32} className="text-gray-400" />
                      </div>
                      <h4 className="text-gray-900 font-semibold mb-1">No addresses saved</h4>
                      <p className="text-gray-500 text-sm mb-6">Add a delivery address to place your order</p>
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="px-6 py-2 bg-[#ec1b45] text-white text-sm font-semibold rounded-lg hover:bg-[#d91b40] transition-colors"
                      >
                        Add New Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl sticky bottom-0 z-10">
              {isAddingAddress ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsAddingAddress(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-address-form"
                    className="flex-1 py-3 bg-[#ec1b45] text-white rounded-xl font-semibold hover:bg-[#d91b40] transition-colors shadow-sm text-sm"
                  >
                    Save Address
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-base shadow-sm"
                >
                  <FaPlus size={14} />
                  Add New Address
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
