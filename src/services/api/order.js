// src/services/api/order.js
import { get, post, patch } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * List user orders
 * @param {Object} params - Optional query parameters
 * @param {string} params.start_date - Filter by start date (format: YYYY-MM-DD)
 * @param {string} params.end_date - Filter by end date (format: YYYY-MM-DD)
 * @param {string} params.ordering - Sort by created_at (e.g., '-created_at' for descending)
 * @param {number} params.page - Page number (default: 1)
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const listUserOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.start_date) {
    queryParams.append('start_date', params.start_date);
  }
  if (params.end_date) {
    queryParams.append('end_date', params.end_date);
  }
  if (params.ordering) {
    queryParams.append('ordering', params.ordering);
  }
  if (params.page) {
    queryParams.append('page', params.page);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `${endpoints.order.listUserOrders}?${queryString}`
    : endpoints.order.listUserOrders;

  const response = await get(url);
  return response;
};

/**
 * Get order details by order ID
 * @param {number|string} orderId - Order ID
 * @returns {Promise<{result: Object}>}
 */
export const getOrderDetails = async (orderId) => {
  const response = await get(endpoints.order.getOrderDetails(orderId));
  return response;
};

/**
 * Get return and exchange reasons
 * @returns {Promise<{status: boolean, return_reasons: Object, exchange_reasons: Object, cancel_reasons: Object}>}
 */
export const getReturnExchangeReasons = async () => {
  const response = await get(endpoints.order.getReasons);
  return response;
};

/**
 * Return an order
 * @param {Object} returnData - Return order data
 * @param {number|string} returnData.order_id - Cart item ID (required)
 * @param {number|string} returnData.address_id - Address ID (optional, required for delivery return)
 * @param {string} returnData.reason - Return reason (required)
 * @param {string} returnData.sub_reason - Sub reason (optional)
 * @param {number|string} returnData.bank_account_id - Bank account ID (optional)
 * @param {string} returnData.return_type - 'DELIVERY' or 'IN_STORE' (optional, default: DELIVERY)
 * @returns {Promise<{message: string}>}
 */
export const returnOrder = async (returnData) => {
  const formData = new FormData();
  formData.append('order_id', returnData.order_id);

  if (returnData.address_id) {
    formData.append('address_id', returnData.address_id);
  }

  formData.append('reason', returnData.reason);

  if (returnData.sub_reason) {
    formData.append('sub_reason', returnData.sub_reason);
  }

  if (returnData.bank_account_id) {
    formData.append('bank_account_id', returnData.bank_account_id);
  }

  if (returnData.return_type) {
    formData.append('return_type', returnData.return_type);
  }

  const response = await post(endpoints.order.returnOrder, formData, true);
  return response;
};

/**
 * Exchange an order
 * @param {Object} exchangeData - Exchange order data
 * @param {number|string} exchangeData.previous_order_id - Cart item ID to exchange (required)
 * @param {number|string} exchangeData.product_id - New product ID (required)
 * @param {number|string} exchangeData.product_variant_id - New variant ID (required)
 * @param {string} exchangeData.size_type - 'clothing_size', 'running_material', or 'others' (required)
 * @param {string} exchangeData.size - Size (required for clothing_size)
 * @param {number} exchangeData.quantity - Quantity (required for clothing_size and others)
 * @param {number} exchangeData.meter - Meter (required for running_material)
 * @param {string} exchangeData.color_name - Color name (optional)
 * @param {string} exchangeData.reason - Exchange reason (optional)
 * @param {string} exchangeData.sub_reason - Exchange sub-reason (optional)
 * @param {string} exchangeData.exchange_type - 'DELIVERY' or 'IN_STORE' (optional, default: DELIVERY)
 * @returns {Promise<{message: string}>}
 */
export const exchangeOrder = async (exchangeData) => {
  const formData = new FormData();
  formData.append('previous_order_id', exchangeData.previous_order_id);
  formData.append('product_id', exchangeData.product_id);
  formData.append('product_variant_id', exchangeData.product_variant_id);
  formData.append('size_type', exchangeData.size_type);

  if (exchangeData.size_type === 'clothing_size') {
    formData.append('size', exchangeData.size);
    formData.append('quantity', exchangeData.quantity);
  } else if (exchangeData.size_type === 'running_material') {
    formData.append('meter', exchangeData.meter);
  } else if (exchangeData.size_type === 'others') {
    formData.append('quantity', exchangeData.quantity);
  }

  if (exchangeData.color_name) {
    formData.append('color_name', exchangeData.color_name);
  }

  if (exchangeData.reason) {
    formData.append('reason', exchangeData.reason);
  }

  if (exchangeData.sub_reason) {
    formData.append('sub_reason', exchangeData.sub_reason);
  }

  if (exchangeData.exchange_type) {
    formData.append('exchange_type', exchangeData.exchange_type);
  }

  const response = await post(endpoints.order.exchangeOrder, formData, true);
  return response;
};

/**
 * Cancel an order
 * @param {number|string} lastOrderId - Last order ID (from order detail response order_id field)
 * @returns {Promise<{message: string, data: []}>}
 */
export const cancelOrder = async (lastOrderId) => {
  const response = await patch(endpoints.order.cancelOrder(lastOrderId)); // PATCH with no body
  return response;
};
