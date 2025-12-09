import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import logo from "../assets/logo.png";
import { verifyRegistrationOTP, verifyLoginOTP, requestLoginOTP, createNewAccount } from "../services/api/auth";
import { registerSuccess, loginSuccess, setLoading, setError } from "../features/auth/authSlice";
import { showSuccess, showError } from "../utils/toast";

const OtpVerify = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [resendEnabled, setResendEnabled] = useState(false);
  const inputsRef = useRef([]);

  const flowType = localStorage.getItem("flowType"); // "login" or "registration"
  const phone = localStorage.getItem("tempPhone");
  const username = localStorage.getItem("tempUsername");

  // Countdown timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setResendEnabled(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputsRef.current[index + 1].focus(); // Auto-focus next
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const enteredOtp = otp.join("");
    
    if (enteredOtp.length !== 4) {
      showError("Please enter complete OTP");
      return;
    }

    if (!phone) {
      showError("Phone number not found. Please start over.");
      navigate(flowType === "login" ? "/login" : "/register");
      return;
    }

    try {
      dispatch(setLoading(true));
      let response;

      if (flowType === "registration") {
        // Registration flow: Use entered OTP as otp_token
        response = await verifyRegistrationOTP(phone, enteredOtp);
        dispatch(registerSuccess({ 
          access: response.access, 
          refresh: response.refresh, 
          user: response.data 
        }));
      } else {
        // Login flow: Use entered OTP as otp_token
        response = await verifyLoginOTP(phone, enteredOtp);
        dispatch(loginSuccess({ 
          access: response.access, 
          refresh: response.refresh, 
          user: response.data 
        }));
      }

      // Clear temporary storage
      localStorage.removeItem("tempPhone");
      localStorage.removeItem("tempUsername");
      localStorage.removeItem("otp_token");
      localStorage.removeItem("flowType");

      // Show success message
      const successMessage = flowType === "registration" 
        ? "Account created successfully! Welcome!" 
        : "Login successful! Welcome back!";
      showSuccess(successMessage);

      dispatch(setLoading(false));
      navigate("/home");
    } catch (error) {
      dispatch(setLoading(false));
      // Error toast is already shown by http.js
      dispatch(setError(error.message));
    }
  };

  const handleResendOTP = async () => {
    if (!resendEnabled || !phone) return;

    try {
      dispatch(setLoading(true));
      
      if (flowType === "registration") {
        // Resend OTP for registration
        if (!username) {
          showError("Username not found. Please register again.");
          navigate("/register");
          return;
        }
        const response = await createNewAccount(username, phone);
        showSuccess(response.message || "OTP resent successfully!");
    } else {
        // Resend OTP for login
        const response = await requestLoginOTP(phone);
        showSuccess(response.message || "OTP resent successfully!");
      }

      // Reset timer
      setTimer(60);
      setResendEnabled(false);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      // Error toast is already shown by http.js
      dispatch(setError(error.message));
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="flex justify-center mb-6">
        <img src={logo} alt="Logo" className="w-40 h-fill" />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Enter OTP Code
        </h2>

        <p className="text-center text-sm text-gray-500 mb-4">
          Enter the code from the SMS we sent to your number.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputsRef.current[index] = el)}
                onChange={(e) => handleChange(e, index)}
                disabled={isLoading}
                className="w-10 h-12 text-center text-lg rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-[#ec1b45] disabled:opacity-50"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#ec1b45] px-4 py-2 font-semibold text-white hover:bg-[#ef395d] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Didn't receive the code?{" "}
          {resendEnabled ? (
          <span
              onClick={handleResendOTP}
              className="text-[#ec1b45] hover:underline cursor-pointer font-medium"
          >
            Resend OTP
          </span>
          ) : (
            <span className="text-gray-400">
              Resend OTP in {timer}s
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default OtpVerify;
