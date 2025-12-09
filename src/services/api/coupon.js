// src/services/api/coupon.js
import { get, post } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get list of available coupons
 * @returns {Promise<Array>} Array of coupon objects
 */
export const getCouponList = async () => {
  const response = await get(endpoints.coupon.getCouponList);
  return response;
};

/**
 * Apply coupon to cart
 * @param {Object} couponData - Coupon application data
 * @param {string} couponData.coupon_code - Coupon code
 * @param {string} couponData.cart_id - Cart UUID
 * @param {number} couponData.product_id - Optional product ID
 * @param {number} couponData.variant_id - Optional variant ID
 * @returns {Promise<{success: boolean, message: string, applied_to_items: Array}>}
 */
export const applyCoupon = async (couponData) => {
  const formData = new FormData();
  
  // Ensure values are strings and not null/undefined
  const couponCode = String(couponData.coupon_code || '').trim();
  const cartId = String(couponData.cart_id || '').trim();
  
  if (!couponCode) {
    throw new Error('Coupon code is required');
  }
  if (!cartId) {
    throw new Error('Cart ID is required');
  }
  
  formData.append('coupon_code', couponCode);
  formData.append('cart_id', cartId);
  
  if (couponData.product_id) {
    formData.append('product_id', String(couponData.product_id));
  }
  if (couponData.variant_id) {
    formData.append('variant_id', String(couponData.variant_id));
  }
  
  const response = await post(endpoints.coupon.applyCoupon, formData, true);
  return response;
};

/**
 * Remove coupon from cart
 * @param {Object} couponData - Coupon removal data
 * @param {string} couponData.coupon_code - Coupon code
 * @param {string} couponData.cart_id - Cart UUID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const removeCoupon = async (couponData) => {
  const formData = new FormData();
  
  // Ensure values are strings and not null/undefined
  const couponCode = String(couponData.coupon_code || '').trim();
  const cartId = String(couponData.cart_id || '').trim();
  
  if (!couponCode) {
    throw new Error('Coupon code is required');
  }
  if (!cartId) {
    throw new Error('Cart ID is required');
  }
  
  formData.append('coupon_code', couponCode);
  formData.append('cart_id', cartId);
  
  // Debug: Log FormData contents
  console.log('Remove Coupon FormData:', {
    coupon_code: couponCode,
    cart_id: cartId
  });
  
  // Log actual FormData entries
  for (let pair of formData.entries()) {
    console.log('FormData entry:', pair[0], '=', pair[1]);
  }
  
  const response = await post(endpoints.coupon.removeCoupon, formData, true);
  return response;
};

