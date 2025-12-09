// src/services/api/cart.js
import { get, put, del } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get cart details
 * @param {string} cartId - Optional cart UUID
 * @param {string} uniqueToken - Optional guest user token
 * @returns {Promise<{status: boolean, message: string, data: Object}>}
 */
export const getCart = async (cartId = null, uniqueToken = null) => {
  const queryParams = new URLSearchParams();
  if (cartId) {
    queryParams.append('cart_id', cartId);
  }
  if (uniqueToken) {
    queryParams.append('unique_token', uniqueToken);
  }
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${endpoints.cart.getCart}?${queryString}`
    : endpoints.cart.getCart;
  
  const response = await get(url);
  return response;
};

/**
 * Add item to cart
 * @param {string} uuid - Cart UUID (use '0' for new cart)
 * @param {Object} itemData - Cart item data
 * @param {number} itemData.product_id - Product ID
 * @param {number} itemData.product_variant_id - Variant ID
 * @param {string} itemData.size_type - 'clothingsize', 'runningmaterial', or 'others'
 * @param {string} itemData.size - Size (required for clothing_size/others)
 * @param {number} itemData.quantity - Quantity (required for clothing_size/others)
 * @param {number} itemData.meter - Meter value (required for running_material)
 * @param {string} itemData.color_name - Optional color name
 * @param {string} itemData.unique_token - Optional guest user token
 * @returns {Promise<{status: boolean, message: string, cart_id: string, data: Array}>}
 */
export const addToCart = async (uuid, itemData) => {
  const formData = new FormData();
  
  // Normalize size_type to backend format (with underscore)
  let sizeType = itemData.size_type;
  if (sizeType === 'runningmaterial' || sizeType === 'running_material') {
    sizeType = 'running_material';
  } else if (sizeType === 'clothingsize' || sizeType === 'clothing_size') {
    sizeType = 'clothing_size';
  }
  
  // Required fields
  formData.append('product_id', itemData.product_id);
  formData.append('product_variant_id', itemData.product_variant_id);
  formData.append('size_type', sizeType);
  
  // Conditional fields based on size_type
  // Backend expects 'running_material' (with underscore)
  if (sizeType === 'running_material') {
    formData.append('meter', itemData.meter);
  } else {
    // For clothing_size or others
    formData.append('size', itemData.size);
    formData.append('quantity', itemData.quantity);
  }
  
  // Optional fields
  if (itemData.color_name) {
    formData.append('color_name', itemData.color_name);
  }
  if (itemData.unique_token) {
    formData.append('unique_token', itemData.unique_token);
  }
  
  const response = await put(endpoints.cart.addToCart(uuid), formData, true);
  return response;
};

/**
 * Delete cart item by ID
 * @param {number|string} itemId - Cart item ID
 * @returns {Promise<{status: boolean, message: string, data: Array}>}
 */
export const deleteCartItem = async (itemId) => {
  const response = await del(endpoints.cart.deleteCartItem(itemId));
  return response;
};

