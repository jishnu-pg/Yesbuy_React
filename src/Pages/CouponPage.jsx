import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaCheckCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import { getCouponList, applyCoupon } from "../services/api/coupon";
import { getCart } from "../services/api/cart";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

const CouponPage = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(null); // Track which coupon is being applied

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getCartId = async () => {
    try {
      const response = await getCart();
      if (response.status && response.data?.cart_id) {
        return response.data.cart_id;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch cart ID:", error);
      return null;
    }
  };

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await getCouponList();
      if (Array.isArray(response)) {
        // Filter only active coupons
        setCoupons(response.filter(coupon => coupon.active));
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      showError(error?.message || "Failed to load coupons. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async (couponCode) => {
    if (!couponCode || !couponCode.trim()) {
      showError("Invalid coupon code");
      return;
    }

    const cartId = await getCartId();
    if (!cartId) {
      showError("Cart not found. Please add items to cart first.");
      return;
    }

    try {
      setIsApplyingCoupon(couponCode);
      const response = await applyCoupon({
        coupon_code: couponCode.trim().toUpperCase(),
        cart_id: cartId,
      });

      if (response.success) {
        showSuccess(response.message || "Coupon applied successfully!");
        // Navigate back to cart page
        setTimeout(() => {
          navigate('/cartpage');
        }, 1000);
      } else {
        showError(response.message || "Failed to apply coupon");
      }
    } catch (error) {
      console.error("Failed to apply coupon:", error);
      showError(error?.message || "Failed to apply coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(null);
    }
  };

  // Check if coupon is currently valid based on dates
  const isCouponValid = (coupon) => {
    const now = new Date();
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
    const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

    // Coupon is valid if:
    // - valid_from is not set OR current time is >= valid_from
    // - valid_to is not set OR current time is <= valid_to
    const isAfterStart = !validFrom || now >= validFrom;
    const isBeforeEnd = !validTo || now <= validTo;

    return isAfterStart && isBeforeEnd;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoaderSpinner label="Loading coupons..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/cartpage')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft size={20} />
            <span className="text-sm sm:text-base font-medium">Back to Cart</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <FaTag className="text-[#ec1b45]" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Coupons</h1>
        </div>

        {coupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FaTag size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Coupons Available</h2>
            <p className="text-gray-600 mb-8">There are no active coupons at the moment.</p>
            <button
              onClick={() => navigate('/cartpage')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              <FaArrowLeft size={16} />
              <span>Back to Cart</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coupons.map((coupon) => {
              const isApplying = isApplyingCoupon === coupon.code;

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#ec1b45] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-xl sm:text-2xl text-gray-900">
                          {coupon.code}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                          {coupon.discount_percent}% OFF
                        </span>
                      </div>

                      {coupon.description && (
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {coupon.minimum_purchase_amount && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Min. purchase:
                        </p>
                        <p className="text-xs font-semibold text-gray-700">
                          ₹{parseFloat(coupon.minimum_purchase_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const isValid = isCouponValid(coupon);
                    const isDisabled = isApplying || !isValid;
                    return (
                      <button
                        onClick={() => handleApplyCoupon(coupon.code)}
                        disabled={isDisabled}
                        className={`w-full mt-4 px-4 py-3 rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-2 ${isDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#ec1b45] text-white hover:bg-[#d91b40]'
                          }`}
                      >
                        {isApplying ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle size={16} />
                            <span>Apply Coupon</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponPage;

