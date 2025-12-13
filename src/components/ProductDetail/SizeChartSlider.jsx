/**
 * Get variant image URL using the same logic as ProductVariants component
 * Matches mobile app: variant?.data?.firstOrNull?.thumbImages
 */
const getVariantImage = (variant, fallbackImage) => {
  // Priority 1: Check thumb_images first (matches mobile app priority)
  const thumbImages = variant?.thumb_images;
  let variantImage = fallbackImage || '';
  
  if (thumbImages !== undefined && thumbImages !== null) {
    if (typeof thumbImages === 'string' && thumbImages.trim() !== '') {
      variantImage = thumbImages;
      return variantImage;
    } else if (typeof thumbImages === 'object' && Object.keys(thumbImages).length > 0) {
      if (thumbImages.image && typeof thumbImages.image === 'string') {
        variantImage = thumbImages.image;
        return variantImage;
      }
    }
  }
  
  // Priority 2: Check variant_images array (fallback if thumb_images is missing/empty)
  if (variant?.variant_images && Array.isArray(variant.variant_images) && variant.variant_images.length > 0) {
    variantImage = variant.variant_images[0];
    return variantImage;
  }
  
  // Final fallback
  return fallbackImage || '';
};

const SizeChartSlider = ({
  showSizeChart,
  onClose,
  product,
  selectedVariant,
  selectedColorVariant,
  selectedSize,
  isRunningMaterial,
  meter,
  currentPrice,
  originalPrice,
  discountPercentage,
  isBogo,
  discountText,
  hasOffer
}) => {
  if (!showSizeChart || !product.size_chart || product.size_chart.length === 0) {
    return null;
  }
  
  // Get variant image using same logic as ProductVariants
  const variantImage = getVariantImage(selectedVariant, product?.main_image);

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-full sm:w-[55%] sm:min-w-[500px] sm:max-w-[700px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out border-l-2 border-gray-300 ${
        showSizeChart ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between z-10">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Size Chart</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close size chart"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Size Chart Content */}
      <div className="overflow-y-auto h-full p-3 sm:p-5">
        {product.size_chart.length > 0 && (
          <div className="h-full flex flex-col">
            {product.size_chart[0].measurement && (
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium flex-shrink-0">Measurement: {product.size_chart[0].measurement}</p>
            )}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img
                src={product.size_chart[0].measurement_image}
                alt={`Size Chart - ${product.size_chart[0].measurement || 'Standard'}`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeChartSlider;

