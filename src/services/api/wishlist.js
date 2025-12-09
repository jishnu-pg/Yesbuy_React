// src/services/api/wishlist.js
import { post } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Create or toggle favorite for a product
 * @param {number|string} productId - Product ID to favorite/unfavorite
 * @returns {Promise<{message: string}>}
 */
export const createToggleFavorite = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  
  const formData = new FormData();
  formData.append("product_id", productId);
  
  const response = await post(endpoints.wishlist.createToggleFavorite, formData, true);
  return response;
};

