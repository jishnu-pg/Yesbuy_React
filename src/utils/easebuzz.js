// src/utils/easebuzz.js
// Easebuzz Payment Gateway Integration Utility
// Version: 2.0 - Fixed paymentData scope issue

/**
 * Load Easebuzz SDK script dynamically
 * @param {string} [sdkUrl] - Optional custom SDK URL
 * @returns {Promise<void>}
 */
const loadEasebuzzSDK = (sdkUrl = null) => {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.Easebuzz) {
      console.log('Easebuzz: SDK already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="easepay"], script[src*="easebuzz"]');
    if (existingScript) {
      console.log('Easebuzz: Found existing script tag', existingScript.src);
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.Easebuzz && typeof window.Easebuzz === 'function') {
          console.log('Easebuzz: Existing script loaded SDK successfully');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.Easebuzz) {
          console.error('Easebuzz: SDK loading timeout for existing script');
          reject(new Error('Easebuzz SDK loading timeout'));
        }
      }, 10000);
      return;
    }

    // Load Easebuzz SDK script
    // Note: The SDK URL might vary - check with Easebuzz documentation
    // Common SDK URLs:
    // - https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js
    // - https://pay.easebuzz.in/easepay/easepay.js
    // - https://testpay.easebuzz.in/easepay/easepay.js
    const defaultSdkUrl = 'https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js';
    const finalSdkUrl = sdkUrl || defaultSdkUrl;
    
    console.log('Loading Easebuzz SDK from:', finalSdkUrl);
    
    const script = document.createElement('script');
    script.src = finalSdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('Easebuzz SDK script loaded, waiting for initialization...');
      // Wait a bit for Easebuzz to initialize - try multiple times
      let attempts = 0;
      const maxAttempts = 25; // Increase attempts to give more time
      const checkInterval = setInterval(() => {
        attempts++;
        // Check multiple possible locations for the Easebuzz object
        const easebuzzObj = window.Easebuzz || window.easebuzz || window.EasebuzzCheckout;
        
        // Log what we have available for debugging
        if (attempts === 1 || attempts % 5 === 0) {
          console.log('Easebuzz: Checking for SDK availability (attempt ' + attempts + ')', {
            hasWindowEasebuzz: !!window.Easebuzz,
            windowEasebuzzType: typeof window.Easebuzz,
            hasEasebuzzObj: !!easebuzzObj,
            easebuzzObjType: typeof easebuzzObj,
            hasInitMethod: easebuzzObj && typeof easebuzzObj.init === 'function'
          });
        }
        
        if (easebuzzObj && (typeof easebuzzObj === 'function' || typeof easebuzzObj.init === 'function')) {
          console.log('Easebuzz SDK initialized successfully', { easebuzzObjType: typeof easebuzzObj, easebuzzObjName: Object.keys(window).find(key => window[key] === easebuzzObj) });
          // Make sure window.Easebuzz is set correctly
          if (!window.Easebuzz) {
            window.Easebuzz = easebuzzObj;
          }
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('Easebuzz SDK loaded but window.Easebuzz not available or not a function after', maxAttempts, 'attempts');
          console.log('Available window objects:', Object.keys(window).filter(key => key.toLowerCase().includes('ease')));
          reject(new Error('Easebuzz SDK failed to initialize - window.Easebuzz not found or not a function'));
        }
      }, 200); // Check more frequently
    };
    script.onerror = (error) => {
      console.error('Failed to load Easebuzz SDK script:', error);
      reject(new Error(`Failed to load Easebuzz SDK from ${finalSdkUrl}. Please check the URL or network connection.`));
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Easebuzz payment
 * Uses JavaScript SDK if available, otherwise falls back to form submission
 * @param {Object} paymentData - Payment data from complete-payment API
 * @param {string} paymentData.access_key - Easebuzz access key
 * @param {string} paymentData.env - Environment (test/production)
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Currency (INR)
 * @param {string} paymentData.customer_name - Customer name
 * @param {string} paymentData.mobile - Customer mobile number
 * @param {number} paymentData.order_id - Order ID
 * @param {Function} onSuccess - Success callback (for SDK approach)
 * @param {Function} onFailure - Failure callback (for SDK approach)
 */
export const initializeEasebuzzPayment = async (
  paymentData,
  onSuccess,
  onFailure
) => {
  // Validate paymentData
  if (!paymentData) {
    console.error('Payment data is missing');
    onFailure(new Error('Payment data is required'));
    return;
  }

  console.log('Initializing Easebuzz payment with redirection approach (like Django app)', {
    hasAccessKey: !!paymentData.access_key,
    hasEnv: !!paymentData.env,
    hasOrderId: !!paymentData.order_id,
    env: paymentData.env,
  });

  try {
    // Use redirection approach consistently (like Django app)
    // Store payment data in sessionStorage for callback page
    sessionStorage.setItem('easebuzz_payment_data', JSON.stringify({
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      access_key: paymentData.access_key,
      env: paymentData.env,
    }));

    // Determine correct payment URL based on environment
    const baseUrl = paymentData.env === 'production' || paymentData.env === 'prod'
      ? 'https://pay.easebuzz.in'
      : 'https://testpay.easebuzz.in';
      
    console.log('Easebuzz: Using redirection URL', { baseUrl, env: paymentData.env });
    
    const paymentRedirectUrl = `${baseUrl}/pay/${paymentData.access_key}`;
    
    console.log('Easebuzz: Constructed redirection URL', { paymentRedirectUrl, baseUrl, accessKey: paymentData.access_key });

    console.log('Redirecting to Easebuzz payment page (redirection approach):', paymentRedirectUrl);

    // Redirect to Easebuzz payment page
    window.location.href = paymentRedirectUrl;
    
    // Note: After redirect, user will complete payment on Easebuzz
    // Payment response will come via redirect to callback URL
    return;
  } catch (error) {
    console.error('Error initializing Easebuzz payment:', error);
    onFailure(error);
  }
};

/**
 * Check if payment response indicates success
 * @param {Object} response - Payment response from Easebuzz
 * @returns {boolean}
 */
export const isPaymentSuccess = (response) => {
  if (!response) return false;

  // Easebuzz can return status in various formats
  const status = 
    response.status || 
    response.payment_status || 
    response.paymentStatus ||
    response.paymentresponse?.status ||
    '';
  
  const statusLower = status.toLowerCase().trim();

  // Check for success status values (based on Easebuzz documentation)
  const successStatuses = [
    'payment_successfull',
    'paymentsuccessfull',
    'payment_successful',
    'payment successful',
    'success',
    'successful',
    '1', // Some APIs return 1 for success
    'true',
  ];

  // Check if status matches any success value
  if (successStatuses.includes(statusLower)) {
    return true;
  }

  // Also check if there's no error and status is not failure
  const hasError = response.error || response.error_Message || response.errorMessage;
  const isFailure = statusLower === 'failure' || statusLower === 'failed' || statusLower === '0';
  
  // If no error and not explicitly failed, and we have a transaction ID, consider it success
  if (!hasError && !isFailure && getTransactionId(response)) {
    return true;
  }

  return false;
};

/**
 * Extract transaction ID from payment response
 * @param {Object} response - Payment response from Easebuzz
 * @returns {string|null}
 */
export const getTransactionId = (response) => {
  if (!response) return null;

  return (
    response.txnid ||
    response.transaction_id ||
    response.transactionId ||
    response.payment_response?.txnid ||
    null
  );
};

/**
 * Extract error message from Easebuzz payment response
 * @param {Object} response - Payment response from Easebuzz
 * @returns {Object} - { message: string, code: string }
 */
export const getPaymentError = (response) => {
  if (!response) {
    return { message: 'Payment failed', code: null };
  }

  const errorMessage = 
    response.error || 
    response.error_Message || 
    response.errorMessage ||
    response.message || 
    'Payment failed';

  const errorCode = 
    response.error_Code || 
    response.errorCode || 
    response.error_code ||
    null;

  // Map common error codes to user-friendly messages
  const errorCodeMap = {
    'GC0C05': 'International cards are not supported. Please use an Indian debit/credit card or try another payment method like COD (Cash on Delivery).',
    'WC0E03': 'Invalid payment parameters. Please try again or use another payment method.',
    'failure': 'Payment failed. Please try again or use another payment method.',
    'cancelled': 'Payment was cancelled. You can try again when ready.',
    'error': 'Payment error occurred. Please try again or use another payment method.',
  };

  let userMessage = errorMessage;
  
  // Check for error code mapping first
  if (errorCode && errorCodeMap[errorCode]) {
    userMessage = errorCodeMap[errorCode];
  } 
  // Check if error message contains keywords for better mapping
  else if (errorMessage) {
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes('international') || lowerMessage.includes('not supported')) {
      userMessage = 'International cards are not supported. Please use an Indian debit/credit card or try another payment method like COD (Cash on Delivery).';
    } else if (lowerMessage.includes('cancelled') || lowerMessage.includes('cancel')) {
      userMessage = 'Payment was cancelled. You can try again when ready.';
    } else if (lowerMessage.includes('failed') || lowerMessage.includes('failure')) {
      userMessage = 'Payment failed. Please try again or use another payment method.';
    } else if (lowerMessage.includes('declined') || lowerMessage.includes('rejected')) {
      userMessage = 'Payment was declined. Please check your card details or try another payment method.';
    } else if (lowerMessage.includes('insufficient') || lowerMessage.includes('balance')) {
      userMessage = 'Insufficient balance. Please use another card or payment method.';
    } else {
      // Use the original error message but make it more user-friendly
      userMessage = errorMessage;
      if (errorCode) {
        userMessage += ` (Error Code: ${errorCode})`;
      }
    }
  } else {
    // Default message if no error message found
    userMessage = 'Payment failed. Please try again or use another payment method.';
    if (errorCode) {
      userMessage += ` (Error Code: ${errorCode})`;
    }
  }

  return {
    message: userMessage,
    code: errorCode,
  };
};

