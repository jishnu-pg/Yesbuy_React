import React from 'react';
import { useRouteError, useNavigate, Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaRedo, FaLock, FaBan } from 'react-icons/fa';
import { logout } from '../utils/auth';

const HttpErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  
  // Extract status code from error
  const status = error?.status || error?.response?.status || 500;
  const errorMessage = error?.message || 'An unexpected error occurred';

  // Determine error type and message
  const getErrorDetails = () => {
    switch (status) {
      case 401:
        return {
          title: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
          icon: <FaLock className="w-8 h-8 text-red-600" />,
          showLogout: true,
        };
      case 403:
        return {
          title: 'Forbidden',
          message: 'You do not have permission to access this resource.',
          icon: <FaBan className="w-8 h-8 text-red-600" />,
          showLogout: false,
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource was not found.',
          icon: <FaExclamationTriangle className="w-8 h-8 text-red-600" />,
          showLogout: false,
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          icon: <FaExclamationTriangle className="w-8 h-8 text-red-600" />,
          showLogout: false,
        };
      default:
        return {
          title: `Error ${status}`,
          message: errorMessage,
          icon: <FaExclamationTriangle className="w-8 h-8 text-red-600" />,
          showLogout: status === 401,
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            {errorDetails.icon}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {errorDetails.title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mb-2">
            {errorDetails.message}
          </p>
          {status && (
            <p className="text-xs text-gray-500">
              Error Code: {status}
            </p>
          )}
        </div>

        {/* Error Details - Collapsible (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Error Message:</p>
                <pre className="text-xs text-red-600 bg-white p-2 rounded border border-red-200 overflow-auto max-h-32">
                  {errorMessage}
                </pre>
              </div>
              {error?.response && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Response Data:</p>
                  <pre className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                    {JSON.stringify(error.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {errorDetails.showLogout ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              <FaLock size={16} />
              <span>Log In Again</span>
            </button>
          ) : (
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              <FaHome size={16} />
              <span>Go to Home</span>
            </button>
          )}
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <FaRedo size={16} />
            <span>Reload Page</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HttpErrorPage;

