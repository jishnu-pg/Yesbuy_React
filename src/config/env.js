// src/config/env.js
// Environment configuration for the application

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value or default
 */
const getEnv = (key, defaultValue = '') => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Application environment configuration
 */
export const config = {
  // API Configuration
  api: {
    // Base URL for API requests
    baseUrl: getEnv('VITE_API_BASE_URL', 'http://127.0.0.1:8050/api'),
    // Timeout for API requests (in milliseconds)
    timeout: parseInt(getEnv('VITE_API_TIMEOUT', '30000'), 10),
  },

  // Application Configuration
  app: {
    // Application name
    name: getEnv('VITE_APP_NAME', 'YesBuy'),
    // Application version
    version: getEnv('VITE_APP_VERSION', '1.0.0'),
    // Environment (development, staging, production)
    env: getEnv('MODE', 'development'),
    // Is production environment
    isProduction: getEnv('MODE', 'development') === 'production',
    // Is development environment
    isDevelopment: getEnv('MODE', 'development') === 'development',
  },

  // External Services (if any)
  external: {
    // External API URLs (for third-party services)
    netlifyApi: getEnv('VITE_NETLIFY_API_URL', 'https://yesbuyapi.netlify.app/.netlify/functions'),
  },
};

export default config;

