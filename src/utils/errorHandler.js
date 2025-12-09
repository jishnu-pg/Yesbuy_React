import { logout } from './auth';
import { showError } from './toast';

/**
 * Handle HTTP errors with appropriate actions
 * @param {Error} error - The error object from API call
 * @param {Object} options - Options for error handling
 * @param {boolean} options.showToast - Whether to show error toast (default: true)
 * @param {boolean} options.autoLogout - Whether to auto logout on 401 (default: true)
 * @param {Function} options.onError - Custom error handler callback
 */
export const handleHttpError = (error, options = {}) => {
  const {
    showToast = true,
    autoLogout = true,
    onError = null,
  } = options;

  const status = error?.status || error?.response?.status;
  const errorMessage = error?.message || 'An error occurred';

  // Handle 401 Unauthorized
  if (status === 401 && autoLogout) {
    if (showToast) {
      showError('Your session has expired. Please log in again.');
    }
    // Small delay to show toast before logout
    setTimeout(() => {
      logout();
    }, 1500);
    return;
  }

  // Handle 403 Forbidden
  if (status === 403) {
    if (showToast) {
      showError('You do not have permission to perform this action.');
    }
    if (onError) onError(error);
    return;
  }

  // Handle 404 Not Found
  if (status === 404) {
    if (showToast) {
      showError('The requested resource was not found.');
    }
    if (onError) onError(error);
    return;
  }

  // Handle 500 Server Error
  if (status === 500) {
    if (showToast) {
      showError('Server error. Please try again later.');
    }
    if (onError) onError(error);
    return;
  }

  // Handle other errors
  if (showToast) {
    showError(errorMessage);
  }
  if (onError) onError(error);
};

/**
 * Check if error is a specific HTTP status code
 * @param {Error} error - The error object
 * @param {number} statusCode - The status code to check
 * @returns {boolean}
 */
export const isHttpError = (error, statusCode) => {
  const status = error?.status || error?.response?.status;
  return status === statusCode;
};

/**
 * Check if error is a 401 Unauthorized error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isUnauthorizedError = (error) => {
  return isHttpError(error, 401);
};

/**
 * Check if error is a 404 Not Found error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isNotFoundError = (error) => {
  return isHttpError(error, 404);
};

