// src/Pages/PaymentFailPage.jsx
// Handles Easebuzz payment failure redirect from backend
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentError } from "../utils/easebuzz";
import { showError } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

const PaymentFailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentFailure = async () => {
      try {
        // Get payment response from URL parameters
        const paymentResponse = {};
        
        // Extract all query parameters
        searchParams.forEach((value, key) => {
          paymentResponse[key] = value;
        });

        // Log payment response for debugging
        console.log('Payment Failure Response:', {
          ...paymentResponse,
          hash: paymentResponse.hash ? '***' : undefined,
        });

        // Extract error message from Easebuzz response
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
      } catch (error) {
        console.error("Error processing payment failure:", error);
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

    handlePaymentFailure();
  }, [searchParams, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoaderSpinner label="Processing payment response..." />
      </div>
    );
  }

  return null;
};

export default PaymentFailPage;

