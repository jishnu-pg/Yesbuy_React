import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import logo from "../assets/logo.png";
import { createNewAccount } from "../services/api/auth";
import { setLoading, setError } from "../features/auth/authSlice";
import { showSuccess, showError } from "../utils/toast";

const Register = () => {
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);

  const validatePhoneNumber = (phoneNumber) => {
    // Regex: ^(?!.*(\d)\1{9})[6-9]\d{9}$
    const phoneRegex = /^(?!.*(\d)\1{9})[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    // If first digit is entered, validate it must be 6, 7, 8, or 9
    if (numericValue.length > 0) {
      const firstDigit = numericValue[0];
      if (firstDigit && !['6', '7', '8', '9'].includes(firstDigit)) {
        // Don't allow invalid first digit
        return;
      }
    }
    
    // Limit to exactly 10 digits
    if (numericValue.length <= 10) {
      setPhone(numericValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number using regex
    if (!phone || phone.length !== 10) {
      showError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      showError("Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits");
      return;
    }
    if (!username || username.trim() === "") {
      showError("Please enter a username");
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await createNewAccount(username.trim(), phone);
      
      // Store phone and OTP for OTP verification step
      // The OTP from response.data.otp will be used as otp_token in step 2
      localStorage.setItem("tempPhone", phone);
      localStorage.setItem("tempUsername", username.trim());
      localStorage.setItem("flowType", "registration"); // Track flow type
      
      // Show success message
      showSuccess(response.message || "OTP sent successfully!");
      
      // Show OTP for testing (remove in production)
      if (response.data?.otp) {
        console.log(`OTP for testing: ${response.data.otp}`);
      }
      
      dispatch(setLoading(false));
      navigate("/otp");
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
          Create a new account
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#ec1b45]"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              pattern="^(?!.*(\d)\1{9})[6-9]\d{9}$"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#ec1b45]"
              placeholder="Enter your 10 digit phone number"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#ec1b45] px-4 py-2 font-semibold text-white hover:bg-[#ef395d] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending OTP..." : "Get Code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-[#ec1b45] hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
