// src/services/http.js
import { config } from "../config/env";

// Base API URL from environment configuration
const API_BASE = config.api.baseUrl;

// Get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

// Get headers with authentication
const getHeaders = (isFormData = false, includeContentType = true, skipAuth = false) => {
  const headers = {};

  if (!isFormData && includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Extract error message from API response
const extractErrorMessage = (data) => {
  // Handle different error response formats
  if (data.error) {
    // Single error string
    if (typeof data.error === 'string') {
      return data.error;
    }
    // Error object with message
    if (data.error.message) {
      return data.error.message;
    }
    // Error array
    if (Array.isArray(data.error)) {
      return data.error.join(', ');
    }
  }

  // Handle errors array
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      // If array of strings
      if (typeof data.errors[0] === 'string') {
        return data.errors.join(', ');
      }
      // If array of objects with message
      if (data.errors[0]?.message) {
        return data.errors.map(e => e.message).join(', ');
      }
      // If array of objects with error
      if (data.errors[0]?.error) {
        return data.errors.map(e => e.error).join(', ');
      }
    }
    // If errors is an object
    if (typeof data.errors === 'object') {
      const errorMessages = Object.values(data.errors).flat();
      return errorMessages.join(', ');
    }
  }

  // Handle message field
  if (data.message) {
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
  }

  // Handle detail field (common in Django REST Framework)
  if (data.detail) {
    return data.detail;
  }

  // Handle non_field_errors (Django REST Framework)
  if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
    return data.non_field_errors.join(', ');
  }

  return null;
};

// Handle API response
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  // If response is not ok, extract error message and throw
  if (!response.ok) {
    const errorMessage = extractErrorMessage(data) || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.response = data; // Attach response data to error for component handling
    error.status = response.status;
    throw error;
  }

  // Check if response has status field and it indicates an error (even if response.ok is true)
  // Handle both boolean false and numeric error status codes (400, 401, 403, 404, 500, etc.)
  if (data.status === false || data.success === false || (typeof data.status === 'number' && data.status >= 400)) {
    const errorMessage = extractErrorMessage(data) || data.message || 'Request failed';
    const error = new Error(errorMessage);
    error.response = data; // Attach response data to error for component handling
    error.status = typeof data.status === 'number' ? data.status : response.status;
    throw error;
  }

  return data;
};

// GET request
export const get = async (path, useBaseUrl = true, skipAuth = false) => {
  const url = useBaseUrl ? `${API_BASE}${path}` : path;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(false, true, skipAuth),
  });
  return handleResponse(response);
};

// POST request
export const post = async (path, data, isFormData = false, skipAuth = false) => {
  const url = `${API_BASE}${path}`;
  const options = {
    method: "POST",
    headers: getHeaders(isFormData, true, skipAuth),
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);
  return handleResponse(response);
};

// PUT request
export const put = async (path, data, isFormData = false, skipAuth = false) => {
  const url = `${API_BASE}${path}`;
  const options = {
    method: "PUT",
    headers: getHeaders(isFormData, true, skipAuth),
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);
  return handleResponse(response);
};

// PATCH request
export const patch = async (path, data, isFormData = false, skipAuth = false) => {
  const url = `${API_BASE}${path}`;
  // Don't include Content-Type if no data is being sent
  const includeContentType = !!data;
  const options = {
    method: "PATCH",
    headers: getHeaders(isFormData, includeContentType, skipAuth),
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);
  return handleResponse(response);
};

// DELETE request
export const del = async (path, skipAuth = false) => {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(false, true, skipAuth),
  });
  return handleResponse(response);
};
