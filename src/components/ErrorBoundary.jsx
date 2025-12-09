import React from 'react';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Fallback UI Component
const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const handleGoHome = () => {
    onReset();
    window.location.href = '/home';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </div>

        {/* Error Details - Collapsible */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Error Message:</p>
                <pre className="text-xs text-red-600 bg-white p-2 rounded border border-red-200 overflow-auto max-h-32">
                  {error.toString()}
                </pre>
              </div>
              {errorInfo && errorInfo.componentStack && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Component Stack:</p>
                  <pre className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
          >
            <FaHome size={16} />
            <span>Go to Home</span>
          </button>
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <FaRedo size={16} />
            <span>Reload Page</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
          >
            <span>Try Again</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            If the problem persists, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
};

const ErrorBoundary = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;

