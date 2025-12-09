// src/services/api/product.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get products by category ID
 * @param {number|string} categoryId - Category ID
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getProductsByCategoryId = async (categoryId) => {
  if (!categoryId) {
    throw new Error("Category ID is required");
  }
  
  const response = await get(endpoints.product.getProductsByCategoryId(categoryId));
  return response;
};

/**
 * Get products by subcategory ID
 * @param {number|string} subcategoryId - Subcategory ID
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getProductsBySubcategoryId = async (subcategoryId) => {
  if (!subcategoryId) {
    throw new Error("Subcategory ID is required");
  }
  
  const response = await get(endpoints.product.getProductsBySubcategoryId(subcategoryId));
  return response;
};

/**
 * Get discounted products list
 * @param {number|string|null} discountId - Optional discount ID to filter by
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getDiscountedProductsList = async (discountId = null) => {
  const response = await get(endpoints.discount.getDiscountedProductsList(discountId));
  return response;
};

/**
 * Get product by ID
 * @param {number|string} productId - Product ID
 * @returns {Promise<Object>}
 */
export const getProductById = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  
  const response = await get(endpoints.product.getProductById(productId));
  return response;
};

/**
 * Get all products
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getProductList = async () => {
  const response = await get(endpoints.product.getProductList);
  return response;
};

/**
 * Get product variants by product ID
 * @param {number|string} productId - Product ID
 * @param {number|string|null} variantId - Optional variant ID
 * @param {string|null} size - Optional size filter
 * @returns {Promise<{status: boolean, message: string, data: {product: Object, variants: Array, lowest_price_variant_id: number}}>}
 */
export const getProductVariantsById = async (productId, variantId = null, size = null) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  
  const response = await get(endpoints.product.getProductVariantsById(productId, variantId, size));
  return response;
};

/**
 * Get available filters
 * @returns {Promise<{result: Array<{brand: Array, size: Array, category: Array, color: Array, fit: Array, material: Array}>}>}
 */
export const getFilters = async () => {
  const response = await get(endpoints.product.getFilters);
  return response;
};

/**
 * Get available sort options
 * @returns {Promise<{result: Array<{type: string, sort: string, name: string}>}>}
 */
export const getSortOptions = async () => {
  const response = await get(endpoints.product.getSortOptions);
  return response;
};

/**
 * Get products with sorting and filtering applied
 * @param {Object} filters - Filter and sort parameters
 * @param {number|string|null} filters.sub_category_id - Subcategory ID
 * @param {number|string|null} filters.brand - Brand ID
 * @param {number|string|null} filters.size - Size ID
 * @param {number|string|null} filters.category - Category ID
 * @param {number|string|null} filters.color - Color ID
 * @param {number|string|null} filters.fit - Fit ID
 * @param {number|string|null} filters.material - Material ID
 * @param {string|null} filters.sort - Sort option (e.g., "price", "-price", "discount")
 * @returns {Promise<{results: Array}>}
 */
export const sortFilterProductsList = async (filters = {}) => {
  const response = await get(endpoints.product.sortFilterProductsList(filters));
  return response;
};

