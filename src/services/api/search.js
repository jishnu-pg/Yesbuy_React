// src/services/api/search.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Search subcategories
 * @param {string} query - Search query
 * @returns {Promise<{results: Array}>}
 */
export const searchSubcategories = async (query) => {
  if (!query || query.trim() === '') {
    return { results: [] };
  }
  
  const response = await get(endpoints.search.searchSubcategories(query));
  return response;
};

/**
 * Search products
 * @param {string} query - Search query
 * @returns {Promise<{results: Array}>}
 */
export const searchProducts = async (query) => {
  if (!query || query.trim() === '') {
    return { results: [] };
  }
  
  const response = await get(endpoints.search.searchProducts(query));
  return response;
};

