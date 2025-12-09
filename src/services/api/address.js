// src/services/api/address.js
import { get, post, put, del, patch } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all user addresses
 * @returns {Promise<{results: Array<{id, latitude, longitude, landmark, location_address, address, phone_number, tag, country, state, city, pincode, is_default}>}>}
 */
export const listAddresses = async () => {
  const response = await get(endpoints.address.listAddresses);
  return response;
};

/**
 * Get address by ID
 * @param {number} addressId - Address ID
 * @returns {Promise<{results: {...}}>}
 */
export const getAddressById = async (addressId) => {
  const response = await get(endpoints.address.getAddressById(addressId));
  return response;
};

/**
 * Add new address
 * @param {FormData} formData - FormData containing phone_number, landmark, location_address, address, city, state, pincode, country, is_default (optional)
 * @returns {Promise<{message: string, data: []}>}
 */
export const addAddress = async (formData) => {
  const response = await post(endpoints.address.addAddress, formData, true); // true for FormData
  return response;
};

/**
 * Update address
 * @param {number} addressId - Address ID
 * @param {FormData} formData - FormData containing address fields to update
 * @returns {Promise<{message: string, data: []}>}
 */
export const updateAddress = async (addressId, formData) => {
  const response = await put(endpoints.address.updateAddress(addressId), formData, true); // true for FormData
  return response;
};

/**
 * Delete address
 * @param {number} addressId - Address ID
 * @returns {Promise<{results: [], message: string}>}
 */
export const deleteAddress = async (addressId) => {
  const response = await del(endpoints.address.deleteAddress(addressId));
  return response;
};

/**
 * Set address as default
 * @param {number} addressId - Address ID
 * @returns {Promise<{message: string, data: []}>}
 */
export const setDefaultAddress = async (addressId) => {
  // PATCH with no body - just call the endpoint
  const response = await patch(endpoints.address.setDefaultAddress(addressId)); // No body needed
  return response;
};

