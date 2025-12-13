import { useState, useEffect } from "react";
import { CiHeart } from "react-icons/ci";
import { FaHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  addToWishlist,
  removeFromWishlist,
  selectIsInWishlist,
} from "../features/wishlist/wishlistSlice";
import { createToggleFavorite } from "../services/api/wishlist";
import { showError, showSuccess } from "../utils/toast";

const ProductCard = ({ product, size = 'normal' }) => {
  // Destructure with safe defaults - handle both old and new API formats
  const {
    title,
    name, // New API format
    price,
    originalPrice: originalPriceProp,
    discountPercentage: discount = 0,
    is_bogo = false,
    discount_text = null,
    has_offer = false,
    images = [],
    brand, // No default - show nothing if missing
    brand_name, // New API format
    main_image, // New API format
    additional_images = [], // New API format
    slug,
    product_id,
    variant_id,
    isFavourite,
    is_favourite,
    size_type, // For checking if running_material
    minimum_meter, // For running_material badge
  } = product;

  // Use new format if available, otherwise fall back to old format
  const productTitle = name || title;
  // Only use brand_name or brand if they exist and are non-empty strings, don't fallback to category
  const productBrand = (brand_name && brand_name.trim()) || (brand && brand.trim()) || null;
  const productImages = images.length > 0
    ? images
    : (main_image ? [{ url: main_image }, ...additional_images.map(img => ({ url: typeof img === 'string' ? img : img.image || img }))] : []);

  // Get product ID - MUST use product_id (not variant_id) to match mobile app
  // Mobile app uses: productId (maps to product_id from API)
  // API get-product-variants-by-id requires product_id, not variant_id
  const productId = product_id || product.product_id || product.id;
  
  // If product_id is missing, log error (should not happen)
  if (!productId && (variant_id || product.variant_id)) {
    console.warn('ProductCard: Missing product_id, only variant_id available. This may cause navigation issues.', {
      product_id,
      variant_id,
      product: product
    });
  }

  // Calculate original price safely
  const originalPrice = originalPriceProp || (discount > 0
    ? Math.round((price * 100) / (100 - discount))
    : price);

  const dispatch = useDispatch();
  const reduxIsInWishlist = useSelector((state) =>
    selectIsInWishlist(state, productId)
  );

  // Check if user is logged in (for showing favorite button)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const accessToken = localStorage.getItem("accessToken");
  const isLogin = isAuthenticated || !!accessToken;

  // Local state to track favorite status (from API or initial state)
  // Initialize from product prop
  const [isFavorite, setIsFavorite] = useState(isFavourite || is_favourite || false);
  const [isToggling, setIsToggling] = useState(false);

  // Check if in wishlist - prioritize Redux, then local state
  // This gives us the most accurate current state
  const isInWishlist = reduxIsInWishlist || isFavorite;

  // Get first image URL safely
  const productImage = productImages[0]?.url || main_image || '/placeholder-image.jpg';

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    if (!token) {
      showError("Please login to add favorites");
      return;
    }

    if (isToggling) return; // Prevent multiple clicks

    // Use isInWishlist to determine current state (combines Redux + local state)
    const wasFavorite = isInWishlist; // Store previous state for error handling

    try {
      setIsToggling(true);

      // Optimistically update UI
      setIsFavorite(!wasFavorite);

      // Call API to toggle favorite
      await createToggleFavorite(productId);

      // Update Redux state
      if (wasFavorite) {
        dispatch(removeFromWishlist(productId));
        showSuccess("Removed from favorites");
      } else {
        dispatch(addToWishlist(product));
        showSuccess("Added to favorites");
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorite(wasFavorite);
      console.error("Failed to toggle favorite:", error);
      // Error message is already shown by http.js error handler
    } finally {
      setIsToggling(false);
    }
  };

  // Check if product is trending (you can add this field to your API response)
  const isTrending = product.is_trending || product.trending || false;

  // Get minimum meter from API response
  // Check both direct props and product object for minimum_meter
  // Show badge if minimum_meter exists in API response and is greater than 0
  const minMeterValue = minimum_meter !== undefined && minimum_meter !== null
    ? minimum_meter
    : (product.minimum_meter !== undefined && product.minimum_meter !== null
      ? product.minimum_meter
      : null);

  // Parse to float and check if greater than 0
  // Handle string values like "5.00" from API
  const minMeter = minMeterValue !== null ? parseFloat(minMeterValue) : null;
  const shouldShowBadge = minMeter !== null && !isNaN(minMeter) && minMeter > 0;

  // Size variants
  const isCompact = size === 'compact';
  const heartSize = isCompact ? 15 : 18;
  const paddingClass = isCompact ? 'p-2.5' : 'p-3';
  const brandTextSize = isCompact ? 'text-xs' : 'text-sm';
  const titleTextSize = isCompact ? 'text-xs' : 'text-sm';
  const priceTextSize = isCompact ? 'text-sm' : 'text-base';
  const discountTextSize = isCompact ? 'text-xs' : 'text-sm';
  const trendingTextSize = isCompact ? 'text-[10px]' : 'text-xs';
  const trendingPadding = isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const heartButtonPadding = isCompact ? 'p-1.5' : 'p-1.5';
  const heartButtonPosition = isCompact ? 'top-2 right-2' : 'top-2 right-2';
  // Fixed dimensions for card - Product images are 725×725 (1:1 ratio)
  // Using aspect-square to maintain 1:1 ratio, with fixed height for consistency
  const imageHeight = isCompact ? 'h-32' : 'h-48';
  const imageAspect = 'aspect-square'; // Maintain 1:1 ratio as per spec (725×725)

  return (
    <Link
      to={`/product/${productId}`}
      className="relative flex flex-col bg-white rounded-lg overflow-hidden h-full"
    >
      {/* Image Container - Product images: 725×725 (1:1 ratio) */}
      <div className={`relative w-full ${imageAspect} bg-gray-50 flex-shrink-0 overflow-hidden`}>
        <img
          src={productImage}
          alt={productTitle}
          className="w-full h-full object-contain"
        />

        {/* Trending Label */}
        {isTrending && (
          <div className={`absolute top-1.5 left-1.5 bg-green-500 text-white ${trendingTextSize} font-semibold ${trendingPadding} rounded`}>
            Trending
          </div>
        )}

        {/* Running Material Badge - Bottom Right - Only show if minimum_meter exists in API response and is greater than 0 */}
        {shouldShowBadge && (
          <div className={`absolute bottom-1.5 right-1.5 bg-[#ec1b45] text-white ${trendingTextSize} font-semibold ${trendingPadding} rounded z-10`}>
            {minMeter} meter
          </div>
        )}

        {/* Wishlist Button - Only visible when logged in (matches Flutter) */}
        {isLogin && (
        <button
          onClick={handleWishlistToggle}
          disabled={isToggling}
          className={`absolute ${heartButtonPosition} ${heartButtonPadding} rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm z-10 ${isToggling ? 'opacity-50 cursor-wait' : ''
            }`}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isInWishlist ? (
            <FaHeart size={heartSize} className="text-red-500" />
          ) : (
            <CiHeart size={heartSize} className="text-gray-700" />
          )}
        </button>
        )}
      </div>

      {/* Product Info */}
      <div className={`${paddingClass} flex flex-col gap-1`}>
        {/* Brand Name - Always show space, empty if no brand */}
        <h3 className={`${brandTextSize} font-semibold text-gray-800 uppercase tracking-wide ${!productBrand ? 'invisible' : ''}`}>
          {productBrand || '\u00A0'}
        </h3>

        {/* Product Description/Title - Single line (matches Flutter) */}
        <p className={`${titleTextSize} text-gray-700 line-clamp-1`}>
          {productTitle}
        </p>

        {/* Price Section - Matches Flutter's price row layout */}
        <div className={`flex items-center ${isCompact ? 'gap-1.5' : 'gap-2'} mt-1`}>
          <span className={`${priceTextSize} font-bold text-gray-900 ${isCompact ? 'whitespace-nowrap' : ''}`}>
            ₹{price?.toLocaleString('en-IN')}
          </span>
          {has_offer && (
            <>
              {originalPrice > price && (
                <span className={`${discountTextSize} text-gray-500 line-through ${isCompact ? 'whitespace-nowrap' : ''}`}>
                  ₹{originalPrice?.toLocaleString('en-IN')}
                </span>
              )}
              {/* Discount Text - Right aligned, matches Flutter (shows discountText if available, else percentage) */}
              <span className={`${discountTextSize} font-semibold text-red-500 ml-auto ${isCompact ? 'whitespace-nowrap' : ''}`}>
                {discount_text || (discount > 0 ? `${discount}% OFF` : '')}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;