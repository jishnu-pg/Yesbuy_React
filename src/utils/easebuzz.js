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
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="easypay"]');
    if (existingScript) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.Easebuzz) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.Easebuzz) {
          reject(new Error('Easebuzz SDK loading timeout'));
        }
      }, 10000);
      return;
    }

    // Load Easebuzz SDK script
    // Note: The SDK URL might vary - check with Easebuzz documentation
    // Common SDK URLs:
    // - https://easypay.easebuzz.in/easepay/easepay.js
    // - https://pay.easebuzz.in/easepay/easepay.js
    // - https://testpay.easebuzz.in/easepay/easepay.js
    const defaultSdkUrl = 'https://easypay.easebuzz.in/easepay/easepay.js';
    const finalSdkUrl = sdkUrl || defaultSdkUrl;
    
    console.log('Loading Easebuzz SDK from:', finalSdkUrl);
    
    const script = document.createElement('script');
    script.src = finalSdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('Easebuzz SDK script loaded, waiting for initialization...');
      // Wait a bit for Easebuzz to initialize - try multiple times
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.Easebuzz) {
          console.log('Easebuzz SDK initialized successfully');
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('Easebuzz SDK loaded but window.Easebuzz not available after', maxAttempts, 'attempts');
          reject(new Error('Easebuzz SDK failed to initialize - window.Easebuzz not found'));
        }
      }, 200);
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

  console.log('Initializing Easebuzz payment with data:', {
    hasAccessKey: !!paymentData.access_key,
    hasEnv: !!paymentData.env,
    hasOrderId: !!paymentData.order_id,
    env: paymentData.env,
  });

  try {
    // Get SDK URL from payment data or use default
    const sdkUrl = paymentData?.sdk_url || null;
    
    // Try to load Easebuzz SDK first
    let sdkLoaded = false;
    const sdkUrlsToTry = sdkUrl 
      ? [sdkUrl] 
      : [
          'https://easypay.easebuzz.in/easepay/easepay.js',
          'https://pay.easebuzz.in/easepay/easepay.js',
          'https://testpay.easebuzz.in/easepay/easepay.js'
        ];
    
    for (const urlToTry of sdkUrlsToTry) {
      try {
        console.log('Attempting to load Easebuzz SDK from:', urlToTry);
        await loadEasebuzzSDK(urlToTry);
        sdkLoaded = !!window.Easebuzz;
        
        if (sdkLoaded) {
          console.log('Easebuzz SDK loaded successfully from:', urlToTry);
          break; // Success, exit loop
        } else {
          console.warn('Easebuzz SDK script loaded but window.Easebuzz is not available');
        }
      } catch (error) {
        console.error('Easebuzz SDK loading error from', urlToTry, ':', error.message);
        // Continue to next URL
        continue;
      }
    }
    
    if (!sdkLoaded) {
      console.error('All Easebuzz SDK URLs failed to load');
    }

    // Easebuzz primarily uses SDK-based integration
    // If form submission is needed, the backend should provide the correct payment URL
    // Common Easebuzz payment URLs (verify with your Easebuzz account):
    // Test: https://testpay.easebuzz.in/ or https://easypay.easebuzz.in/
    // Production: https://pay.easebuzz.in/ or https://easypay.easebuzz.in/
    const paymentUrl = paymentData.payment_url || 
      (paymentData.env === 'production' 
        ? 'https://pay.easebuzz.in/'
        : 'https://testpay.easebuzz.in/');

    // Prepare payment parameters
    // IMPORTANT: Use the exact parameter names that your Easebuzz account expects
    // The backend should provide all necessary parameters including hash if required
    const easebuzzParams = {
      // Try both 'key' and 'access_key' - use what backend provides
      ...(paymentData.access_key && { key: paymentData.access_key }),
      ...(paymentData.access_key && { access_key: paymentData.access_key }),
      amount: paymentData.amount?.toString() || paymentData.amount,
      currency: paymentData.currency || 'INR',
      name: paymentData.customer_name || paymentData.name,
      email: paymentData.customer_email || paymentData.email || '',
      phone: paymentData.mobile || paymentData.phone || paymentData.customer_phone,
      txnid: paymentData.order_id?.toString() || paymentData.txnid || paymentData.order_id,
      productinfo: paymentData.productinfo || `Order ${paymentData.order_id}`,
      surl: paymentData.surl || paymentData.redirect_url || window.location.origin + '/payment-callback',
      furl: paymentData.furl || paymentData.cancel_url || window.location.origin + '/payment-callback',
    };

    // Add hash if provided by backend (required for security)
    if (paymentData.hash) {
      easebuzzParams.hash = paymentData.hash;
    } else {
      console.warn('WARNING: Hash is missing from payment data. Easebuzz may reject the payment.');
      // Don't add empty hash - let backend handle it
    }

    // Add any additional parameters from backend
    if (paymentData.additional_params) {
      Object.assign(easebuzzParams, paymentData.additional_params);
    }

    // Log parameters for debugging (remove in production)
    console.log('Easebuzz Payment Parameters:', { ...easebuzzParams, key: '***', access_key: '***', hash: paymentData.hash ? '***' : 'MISSING' });

    // Easebuzz primarily uses SDK-based integration
    // Try SDK approach first - this is the recommended method
    if (sdkLoaded && window.Easebuzz) {
      try {
        // Easebuzz SDK initialization
        // The SDK constructor typically takes: access_key and environment mode
        const easebuzzMode = paymentData.env === 'production' ? 'PROD' : 'TEST';
        const easebuzz = new window.Easebuzz(paymentData.access_key, easebuzzMode);

        // Prepare SDK parameters
        // Note: Easebuzz SDK might use different parameter names - adjust based on actual SDK
        const sdkParams = {
          key: paymentData.access_key,
          amount: paymentData.amount.toString(),
          currency: paymentData.currency || 'INR',
          name: paymentData.customer_name,
          email: paymentData.customer_email || '',
          phone: paymentData.mobile,
          txnid: paymentData.order_id.toString(),
          productinfo: paymentData.productinfo || `Order ${paymentData.order_id}`,
          surl: paymentData.surl || window.location.origin + '/payment-callback',
          furl: paymentData.furl || window.location.origin + '/payment-callback',
        };

        // Add hash if provided (required for security)
        if (paymentData.hash) {
          sdkParams.hash = paymentData.hash;
        }

        // Initialize payment with SDK
        easebuzz.init({
          ...sdkParams,
          onSuccess: (response) => {
            console.log('Easebuzz Payment Success:', response);
            onSuccess(response);
          },
          onFailure: (error) => {
            console.error('Easebuzz Payment Failure:', error);
            onFailure(error);
          },
        });
        return; // SDK approach used, exit
      } catch (sdkError) {
        console.error('SDK initialization failed:', sdkError);
        // If SDK fails, we need to inform the user
        onFailure(new Error('Failed to initialize payment gateway. Please try again or contact support.'));
        return;
      }
    }

    // If SDK is not available, use access_key redirect approach
    // Based on backend implementation: backend calls initiateLink API and returns access_key
    // Frontend should redirect to: https://pay.easebuzz.in/pay/{access_key}
    if (!sdkLoaded) {
      console.warn('Easebuzz SDK not available, using access_key redirect approach');
      
      // Check if access_key is provided (this is what backend returns from initiateLink API)
      if (!paymentData.access_key) {
        console.error('Access key is missing - cannot proceed with payment');
        onFailure(new Error('Payment gateway configuration error: Access key is missing. Please contact support.'));
        return;
      }

      // Store payment data in sessionStorage for callback page
      sessionStorage.setItem('easebuzz_payment_data', JSON.stringify({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        access_key: paymentData.access_key,
        env: paymentData.env,
      }));

      // Determine correct payment URL based on environment
      // Backend returns access_key from initiateLink API
      // Frontend redirects to: https://pay.easebuzz.in/pay/{access_key}
      const baseUrl = paymentData.env === 'production' || paymentData.env === 'prod'
        ? 'https://pay.easebuzz.in'
        : 'https://testpay.easebuzz.in';
      
      const paymentRedirectUrl = `${baseUrl}/pay/${paymentData.access_key}`;

      console.log('Redirecting to Easebuzz payment page:', paymentRedirectUrl);

      // Redirect to Easebuzz payment page
      window.location.href = paymentRedirectUrl;
      
      // Note: After redirect, user will complete payment on Easebuzz
      // Payment response will come via redirect to callback URL
      return;
    }
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

