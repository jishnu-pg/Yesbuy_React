// src/services/api/category.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all categories
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getAllCategories = async () => {
  const response = await get(endpoints.category.getAllCategories);
  return response;
};

/**
 * Get subcategories by category ID
 * @param {number|string|null} categoryId - Category ID (optional, if not provided returns all categories)
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export const getSubcategories = async (categoryId = null) => {
  const response = await get(endpoints.category.getSubcategories(categoryId));
  return response;
};
