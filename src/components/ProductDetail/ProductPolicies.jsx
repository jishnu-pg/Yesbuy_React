import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const ProductPolicies = ({ product }) => {
  // Check if any policy has status true
  const hasReturnPolicy = product.return_policy?.status;
  const hasExchangePolicy = product.exchange_policy?.status;
  const hasDeliveryPolicy = product.delivery_policy?.status;
  
  // State to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);

  if (!hasReturnPolicy && !hasExchangePolicy && !hasDeliveryPolicy) {
    return null;
  }

  const toggleDropdown = (policy) => {
    setOpenDropdown(openDropdown === policy ? null : policy);
  };

  return (
    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Policies</h3>
      <div className="space-y-2">
        {hasReturnPolicy && (
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDropdown('return')}
              className="w-full flex items-center justify-between gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[#ec1b45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-left">Returns</p>
              </div>
              {openDropdown === 'return' ? (
                <FaChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <FaChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openDropdown === 'return' && (
              <div className="px-3 pb-3 pt-2 bg-white">
                <p className="text-sm text-gray-600">
                  {product.return_policy.description || `Available within ${product.return_policy.days_allowed} days`}
                </p>
              </div>
            )}
          </div>
        )}
        {hasExchangePolicy && (
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDropdown('exchange')}
              className="w-full flex items-center justify-between gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[#ec1b45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-left">Exchange</p>
              </div>
              {openDropdown === 'exchange' ? (
                <FaChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <FaChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openDropdown === 'exchange' && (
              <div className="px-3 pb-3 pt-2 bg-white">
                <p className="text-sm text-gray-600">
                  {product.exchange_policy.description || `Available within ${product.exchange_policy.days_allowed} days`}
                </p>
              </div>
            )}
          </div>
        )}
        {hasDeliveryPolicy && (
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDropdown('delivery')}
              className="w-full flex items-center justify-between gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[#ec1b45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-left">Delivery</p>
              </div>
              {openDropdown === 'delivery' ? (
                <FaChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <FaChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openDropdown === 'delivery' && (
              <div className="px-3 pb-3 pt-2 bg-white">
                <p className="text-sm text-gray-600">
                  {product.delivery_policy.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPolicies;

