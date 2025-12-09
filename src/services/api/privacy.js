// src/services/api/privacy.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get Privacy Policy
 * @returns {Promise<{results: Array<{id: number, title: string, content: string, created_at: string, updated_at: string}>}>}
 */
export const getPrivacyPolicy = async () => {
  const response = await get(endpoints.privacy.getPrivacyPolicy);
  return response;
};

