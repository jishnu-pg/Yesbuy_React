// src/utils/toast.js
import toast from "react-hot-toast";

/**
 * Show success toast message
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
  });
};

/**
 * Show error toast message
 * @param {string} message - Error message to display
 */
export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
  });
};

/**
 * Show loading toast message
 * @param {string} message - Loading message to display
 * @returns {string} - Toast ID for dismissing
 */
export const showLoading = (message = "Loading...") => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

