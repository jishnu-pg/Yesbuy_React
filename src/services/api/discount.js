// src/services/api/discount.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all discount offers/campaigns
 * @returns {Promise<{results: Array<{id: number, name: string, discount_percent: number, image: string, description: string, start_date: string, end_date: string}>}>}
 */
export const getAllDiscounts = async () => {
  const response = await get(endpoints.discount.getAllDiscounts);
  return response;
};

/**
 * Get limited discounted products (for featured section)
 * @returns {Promise<{results: Array}>}
 */
export const getDiscountedProductsLimitedList = async () => {
  const response = await get(endpoints.discount.getDiscountedProductsLimitedList);
  return response;
};

/**
 * Get discounted products list by discount ID
 * @param {number|string} discountId - Discount ID (optional, if not provided returns all discounted products)
 * @returns {Promise<{results: Array, count: number}>}
 */
export const getDiscountedProductsList = async (discountId = null) => {
  const response = await get(endpoints.discount.getDiscountedProductsList(discountId));
  return response;
};

