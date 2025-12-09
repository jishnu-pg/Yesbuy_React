// src/services/api/profile.js
import { get, post } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get user profile
 * @returns {Promise<{results: {id, user_name, first_name, email, profile_picture, wallet_amount, available_points, user_bio, referral_code, dob, gender, phone_number, is_verified}}>}
 */
export const getUserProfile = async () => {
  const response = await get(endpoints.profile.getUserProfile);
  return response;
};

/**
 * Update user profile
 * @param {FormData} formData - FormData containing user_name, email, dob, gender, profile_picture
 * @returns {Promise<{message: string}>}
 */
export const updateUserProfile = async (formData) => {
  const response = await post(endpoints.profile.updateUserProfile, formData, true); // true for FormData
  return response;
};

