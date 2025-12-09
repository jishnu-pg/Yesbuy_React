// src/services/api/bankAccount.js
import { get, post, put, del, patch } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all user bank accounts
 * @returns {Promise<{results: Array}>}
 */
export const listBankAccounts = async () => {
  const response = await get(endpoints.bankAccount.listBankAccounts);
  return response;
};

/**
 * Get bank account by ID
 * @param {number} accountId - Bank account ID
 * @returns {Promise<{results: {...}}>}
 */
export const getBankAccountById = async (accountId) => {
  const response = await get(endpoints.bankAccount.getBankAccountById(accountId));
  return response;
};

/**
 * Add new bank account
 * @param {FormData} formData - FormData containing account_holder_name, account_number, ifsc_code, bank_name, branch_name (optional), account_type (optional)
 * @returns {Promise<{message: string, results: []}>}
 */
export const addBankAccount = async (formData) => {
  const response = await post(endpoints.bankAccount.addBankAccount, formData, true); // true for FormData
  return response;
};

/**
 * Update bank account
 * @param {number} accountId - Bank account ID
 * @param {FormData} formData - FormData containing bank account fields to update
 * @returns {Promise<{message: string, data: []}>}
 */
export const updateBankAccount = async (accountId, formData) => {
  const response = await put(endpoints.bankAccount.updateBankAccount(accountId), formData, true); // true for FormData
  return response;
};

/**
 * Delete bank account
 * @param {number} accountId - Bank account ID
 * @returns {Promise<{results: [], message: string}>}
 */
export const deleteBankAccount = async (accountId) => {
  const response = await del(endpoints.bankAccount.deleteBankAccount(accountId));
  return response;
};

/**
 * Set bank account as default
 * @param {number} accountId - Bank account ID
 * @returns {Promise<{message: string, data: {...}}>}
 */
export const setDefaultBankAccount = async (accountId) => {
  const response = await patch(endpoints.bankAccount.updateBankAccount(accountId)); // PATCH with no body
  return response;
};

