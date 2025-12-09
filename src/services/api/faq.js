// src/services/api/faq.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all FAQs
 * @returns {Promise<{results: Array<{id: number, question: string, answer: string, is_active: boolean}>}>}
 */
export const getFAQs = async () => {
  const response = await get(endpoints.faq.getFAQs);
  return response;
};

