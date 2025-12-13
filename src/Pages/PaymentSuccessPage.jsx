// src/Pages/PaymentSuccessPage.jsx
// Handles Easebuzz payment success redirect from backend
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updateTransactionStatus } from "../services/api/order";
import { isPaymentSuccess, getTransactionId } from "../utils/easebuzz";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get payment response from URL parameters (GET parameters from redirection)
        const paymentResponse = {};
        
        // Extract all query parameters
        searchParams.forEach((value, key) => {
          paymentResponse[key] = value;
        });

        // Log payment response for debugging
        console.log('Payment Success Response:', {
          ...paymentResponse,
          hash: paymentResponse.hash ? '***' : undefined,
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

        // Verify payment was successful
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

          // Show success message
          showSuccess("Payment successful! Your order has been placed.");

          // Navigate to order success page (same page used for COD)
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
          // Payment response indicates failure even though we're on success page
          showError("Payment verification failed. Please contact support.");
          sessionStorage.removeItem('easebuzz_payment_data');
          sessionStorage.removeItem('easebuzz_cart_data');
          
          setTimeout(() => {
            navigate("/cartpage", { replace: true });
          }, 1000);
        }
      } catch (error) {
        console.error("Error processing payment success:", error);
        showError("Error processing payment. Please contact support.");
        sessionStorage.removeItem('easebuzz_payment_data');
        sessionStorage.removeItem('easebuzz_cart_data');
        
        setTimeout(() => {
          navigate("/cartpage", { replace: true });
        }, 1000);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
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

export default PaymentSuccessPage;