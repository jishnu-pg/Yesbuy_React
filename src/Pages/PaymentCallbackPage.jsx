// src/Pages/PaymentCallbackPage.jsx
// Handles Easebuzz payment callback after redirect
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updateTransactionStatus } from "../services/api/order";
import { isPaymentSuccess, getTransactionId, getPaymentError } from "../utils/easebuzz";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get payment response from URL parameters
        // Easebuzz typically sends response as query parameters
        const paymentResponse = {};
        
        // Extract all query parameters
        searchParams.forEach((value, key) => {
          paymentResponse[key] = value;
        });

        // Get stored payment data from sessionStorage
        const storedData = sessionStorage.getItem('easebuzz_payment_data');
        if (!storedData) {
          showError("Payment data not found. Please try again.");
          setTimeout(() => {
            navigate("/cartpage", { replace: true });
          }, 1000);
          return;
        }

        const paymentData = JSON.parse(storedData);
        const orderId = paymentData.order_id;
        const amount = paymentData.amount;
        
        // Get cart data if available
        const cartDataStr = sessionStorage.getItem('easebuzz_cart_data');
        const cartData = cartDataStr ? JSON.parse(cartDataStr) : null;

        // Check if payment was successful
        if (isPaymentSuccess(paymentResponse)) {
          const transactionId = getTransactionId(paymentResponse);

          // Update transaction status
          if (transactionId) {
            try {
              await updateTransactionStatus(transactionId);
            } catch (error) {
              console.error("Failed to update transaction status:", error);
              // Don't fail the flow, payment was successful
            }
          }

          // Clear stored payment data
          sessionStorage.removeItem('easebuzz_payment_data');
          sessionStorage.removeItem('easebuzz_cart_data');

          // Clear cart data
          localStorage.setItem('cartId', '');

          // Navigate to order success page
          navigate('/order-success', {
            state: {
              orderData: {
                order_id: orderId,
                last_order_id: orderId,
                amount: amount,
              },
              cartData: cartData,
            }
          });
        } else {
          // Payment failed - extract error message from Easebuzz response
          const paymentError = getPaymentError(paymentResponse);
          
          // Clear stored payment data
          sessionStorage.removeItem('easebuzz_payment_data');
          sessionStorage.removeItem('easebuzz_cart_data');
          
          // Show user-friendly error message
          showError(paymentError.message);
          
          // Store flag to refresh cart when returning
          sessionStorage.setItem('refresh_cart_on_return', 'true');
          
          // Small delay to ensure toast is visible before navigation
          setTimeout(() => {
            navigate("/cartpage", { replace: true });
          }, 1000);
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        showError("Error processing payment. Please contact support.");
        sessionStorage.removeItem('easebuzz_payment_data');
        sessionStorage.removeItem('easebuzz_cart_data');
        
        // Small delay to ensure toast is visible before navigation
        setTimeout(() => {
          navigate("/cartpage", { replace: true });
        }, 1000);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoaderSpinner label="Processing your payment..." />
      </div>
    );
  }

  return null;
};

export default PaymentCallbackPage;

