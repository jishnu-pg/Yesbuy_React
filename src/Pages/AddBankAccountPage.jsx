import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { addBankAccount } from "../services/api/bankAccount";
import { showError, showSuccess } from "../utils/toast";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";

const AddBankAccountPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const validateForm = () => {
    if (!formData.account_number) {
      showError("Please enter account number");
      return false;
    }
    if (formData.account_number.length < 9 || formData.account_number.length > 18) {
      showError("Account number must be between 9 and 18 digits");
      return false;
    }
    if (formData.account_number !== formData.confirm_account_number) {
      showError("Account numbers do not match");
      return false;
    }
    if (!formData.ifsc_code) {
      showError("Please enter IFSC code");
      return false;
    }
    if (formData.ifsc_code.length !== 11) {
      showError("IFSC code must be 11 characters");
      return false;
    }
    if (!formData.account_holder_name) {
      showError("Please enter account holder name");
      return false;
    }
    if (!formData.bank_name) {
      showError("Please enter bank name");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitFormData = new FormData();
      submitFormData.append('account_number', formData.account_number);
      submitFormData.append('ifsc_code', formData.ifsc_code.toUpperCase());
      submitFormData.append('account_holder_name', formData.account_holder_name);
      submitFormData.append('bank_name', formData.bank_name);
      if (formData.branch_name) {
        submitFormData.append('branch_name', formData.branch_name);
      }

      await addBankAccount(submitFormData);
      
      setShowSuccessPopup(true);
      
      // After 2 seconds, navigate back to refund page
      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate(`/order/${orderId}/return/refund`, {
          state: location.state,
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to add bank account:", error);
      showError(error.message || "Failed to add bank account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.account_number &&
      formData.confirm_account_number &&
      formData.ifsc_code &&
      formData.account_holder_name &&
      formData.bank_name &&
      formData.account_number === formData.confirm_account_number &&
      formData.ifsc_code.length === 11
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/order/${orderId}/return/refund`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm font-medium">Add New Account</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Order Refund Account</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              placeholder="Enter account number"
              maxLength={18}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
            />
          </div>

          {/* Confirm Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Account Number
            </label>
            <input
              type="text"
              name="confirm_account_number"
              value={formData.confirm_account_number}
              onChange={handleInputChange}
              placeholder="Re-enter account number"
              maxLength={18}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
            />
            {formData.confirm_account_number && 
             formData.account_number !== formData.confirm_account_number && (
              <p className="text-sm text-red-600 mt-1">Account numbers do not match</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  ifsc_code: e.target.value.toUpperCase(),
                }));
              }}
              placeholder="Enter IFSC code"
              maxLength={11}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none uppercase"
            />
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleInputChange}
              placeholder="Enter account holder name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleInputChange}
              placeholder="Enter bank name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
            />
          </div>

          {/* Branch Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="branch_name"
              value={formData.branch_name}
              onChange={handleInputChange}
              placeholder="Enter branch name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ec1b45] focus:border-[#ec1b45] outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border sm:mt-6">
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Continue"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <FaCheckCircle size={40} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              New Account Added Successfully!
            </h3>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                navigate(`/order/${orderId}/return/refund`, {
                  state: location.state,
                });
              }}
              className="mt-6 w-full bg-[#ec1b45] text-white py-3 px-6 rounded-md hover:bg-[#d91b40] transition-colors font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBankAccountPage;

