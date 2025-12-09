import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTimes, FaChevronRight } from "react-icons/fa";
import { addToCart as addToCartAPI, getCart } from "../../services/api/cart";
import { showError, showSuccess } from "../../utils/toast";

const BOGOPopup = ({ isOpen, onClose, freeProducts, discountText }) => {
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState({});

  if (!isOpen || !freeProducts || freeProducts.length === 0) return null;

  const getCartId = async () => {
    try {
      const response = await getCart();
      if (response.status && response.data?.cart_id) {
        return response.data.cart_id;
      }
      return '0'; // Return '0' for new cart
    } catch (error) {
      console.error("Failed to fetch cart ID:", error);
      return '0'; // Return '0' if API fails
    }
  };

  const handleAddToCart = async (product) => {
    try {
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));

      const cartId = await getCartId();
      const cartItemData = {
        product_id: product.id,
        product_variant_id: product.id, // Using product id as variant id for free products
        size_type: 'others',
        quantity: 1,
      };

      const response = await addToCartAPI(cartId, cartItemData);

      if (response.status) {
        window.dispatchEvent(new Event('cartUpdated'));
        showSuccess("Free product added to cart!");
      } else {
        showError(response.message || "Failed to add product to cart");
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      showError("Failed to add product to cart. Please try again.");
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[40%] sm:min-w-[400px] sm:max-w-[500px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out border-l-2 border-gray-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Select Your Free Product</h2>
          {discountText && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{discountText}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Free Products List - Vertical Layout */}
      <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 sm:p-6">
        <div className="space-y-4">
          {freeProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-4"
            >
              <div className="flex gap-4">
                {/* Product Image - Left Side */}
                <div className="flex-shrink-0">
                  <Link
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="block w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-lg overflow-hidden"
                  >
                    <img
                      src={product.main_image || '/placeholder-image.jpg'}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                  </Link>
                </div>

                {/* Product Info - Right Side */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Brand Name */}
                    {product.brand && (
                      <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
                        {product.brand}
                      </p>
                    )}

                    {/* Product Name */}
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Free Badge */}
                    <span className="inline-block text-[#ec1b45] text-base sm:text-lg font-semibold mb-3">
                      Free
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart[product.id]}
                    className="flex items-center justify-end gap-1 text-[#ec1b45] hover:text-[#d91b40] font-medium text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                  >
                    <span>{addingToCart[product.id] ? 'Adding...' : 'Add to cart'}</span>
                    {!addingToCart[product.id] && <FaChevronRight size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BOGOPopup;

