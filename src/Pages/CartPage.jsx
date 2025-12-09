import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaTrash, FaShoppingBag, FaTimes, FaExclamationTriangle, FaTag, FaCheckCircle, FaArrowRight, FaChevronDown, FaMinus, FaPlus } from "react-icons/fa";
import { getCart, deleteCartItem, addToCart } from "../services/api/cart";
import { removeCoupon, applyCoupon } from "../services/api/coupon";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

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

  useEffect(() => {
    fetchCart();
  }, []);

  // Check for applied coupon in cart data
  useEffect(() => {
    if (!cartData) {
      setAppliedCouponCode(null);
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
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
                        {cartItem.is_bogo_free && cartItem.free_quantity > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            🎉 {cartItem.free_quantity} item(s) free (BOGO offer)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
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

                  {billDetails.delivery_available && billDetails.message && (
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

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-[#ec1b45] text-white py-3 rounded-lg hover:bg-[#d91b40] transition-colors font-semibold text-base"
                >
                  Proceed to Checkout
                </button>

                {cartData?.payment_method && cartData.payment_method.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Available Payment Methods:</p>
                    <div className="flex flex-wrap gap-2">
                      {cartData.payment_method.map((method, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default CartPage;
