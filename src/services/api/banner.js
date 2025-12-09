// src/services/api/banner.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get trending offers/banners
 * @returns {Promise<{results: {id: number, name: string, additional_images: Array<{image: string}>}}>}
 */
export const getTrendingOffers = async () => {
  const response = await get(endpoints.banner.getTrendingOffers);
  return response;
};

