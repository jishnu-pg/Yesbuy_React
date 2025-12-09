// src/utils/auth.js
import { store } from "../app/store";
import { logout as logoutAction } from "../features/auth/authSlice";

/**
 * Logout function - clears all auth data and redirects to login
 * Since backend doesn't have logout API, this handles logout completely on frontend
 */
export const logout = () => {
  console.log('[LOGOUT] Logout function called');
  console.log('[LOGOUT] Current Redux state before logout:', {
    isAuthenticated: store.getState().auth.isAuthenticated,
    hasToken: !!localStorage.getItem("accessToken")
  });
  
  try {
    // Clear Redux auth state
    console.log('[LOGOUT] Dispatching logout action to Redux');
    store.dispatch(logoutAction());
    console.log('[LOGOUT] Redux logout action dispatched');
    
    // Clear any additional localStorage items (in case there are any)
    console.log('[LOGOUT] Clearing localStorage items');
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
    
    console.log('[LOGOUT] localStorage cleared');
    console.log('[LOGOUT] Redux state after logout:', {
      isAuthenticated: store.getState().auth.isAuthenticated,
      hasToken: !!localStorage.getItem("accessToken")
    });
    
    // Redirect to login page
    console.log('[LOGOUT] Redirecting to /login');
    window.location.href = "/login";
  } catch (error) {
    console.error('[LOGOUT] Error during logout:', error);
    // Even if there's an error, try to redirect
    window.location.href = "/login";
  }
};

