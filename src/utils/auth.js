// src/utils/auth.js
import { store } from "../app/store";
import { logout as logoutAction } from "../features/auth/authSlice";

/**
 * Logout function - clears all auth data and redirects to login
 * Since backend doesn't have logout API, this handles logout completely on frontend
 */
export const logout = () => {
  // Clear Redux auth state
  store.dispatch(logoutAction);
  
  // Clear any additional localStorage items (in case there are any)
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("access_token"); // In case it was stored with different key
  localStorage.removeItem("refresh_token"); // In case it was stored with different key
  
  // Clear any temporary auth data
  localStorage.removeItem("tempPhone");
  localStorage.removeItem("tempUsername");
  localStorage.removeItem("otp_token");
  localStorage.removeItem("flowType");
  
  // Redirect to login page
  window.location.href = "/login";
};

