// src/services/api/auth.js
import { post, put, patch } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Registration Step 1: Create new account (Send OTP)
 * @param {string} user_name - Username
 * @param {string} phone_number - Phone number
 * @returns {Promise<{status: number, message: string, data: {phone_number, user_name, otp}}>}
 */
/**
 * Registration Step 1: Create new account (Send OTP)
 * @param {string} user_name - Username
 * @param {string} phone_number - Phone number
 * @returns {Promise<{status: number, message: string, data: {phone_number, user_name, otp}}>}
 */
export const createNewAccount = async (user_name, phone_number) => {
  const formData = new FormData();
  formData.append("user_name", user_name);
  formData.append("phone_number", phone_number);

  const response = await post(endpoints.auth.createAccount, formData, true, true);
  return response;
};

/**
 * Registration Step 2: Verify OTP and activate account
 * @param {string} phone_number - Phone number
 * @param {string} otp_token - OTP entered by user (from step 1 data.otp)
 * @returns {Promise<{status: number, message: string, data: {id}, access: string, refresh: string}>}
 */
export const verifyRegistrationOTP = async (phone_number, otp_token) => {
  const formData = new FormData();
  formData.append("otp_token", otp_token);

  const response = await put(endpoints.auth.verifyRegistrationOTP(phone_number), formData, true, true);
  return response;
};

/**
 * Login Step 1: Request login OTP
 * @param {string} phone_number - Phone number
 * @returns {Promise<{status: number, message: string, data: {phone_number}}>}
 */
export const requestLoginOTP = async (phone_number) => {
  const response = await patch(endpoints.auth.requestLoginOTP(phone_number), null, false, true);
  return response;
};

/**
 * Login Step 2: Verify OTP and login
 * @param {string} phone_number - Phone number
 * @param {string} otp_token - OTP entered by user
 * @returns {Promise<{status: number, message: string, data: string, access: string, refresh: string}>}
 */
export const verifyLoginOTP = async (phone_number, otp_token) => {
  const formData = new FormData();
  formData.append("phone_number", phone_number);
  formData.append("otp_token", otp_token);

  const response = await post(endpoints.auth.verifyLoginOTP, formData, true, true);
  return response;
};

