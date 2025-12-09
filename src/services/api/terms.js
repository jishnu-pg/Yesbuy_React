// src/services/api/terms.js
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get Terms and Conditions
 * @returns {Promise<{results: Array<{id: number, title: string, content: string, created_at: string, updated_at: string}>}>}
 */
export const getTermsAndConditions = async () => {
  const response = await get(endpoints.terms.getTermsAndConditions);
  return response;
};

