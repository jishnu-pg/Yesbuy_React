const ProductVariants = ({
  variants,
  selectedColorVariant,
  selectedSize,
  selectedVariant,
  product,
  isRunningMaterial,
  onColorSelect,
  onSizeSelect,
  onSizeChartClick
}) => {
  return (
    <>
      {/* Color Variants */}
      {variants.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">
              Color: <span className="font-normal">{selectedVariant?.color || selectedColorVariant?.data?.[0]?.color || "Select a color"}</span>
            </h3>
            {selectedVariant && !isRunningMaterial && selectedVariant.quantity !== undefined && selectedVariant.quantity !== null && selectedVariant.quantity <= 10 && (
              <span className="text-xs sm:text-sm text-gray-500">
                {selectedVariant.quantity === 0 ? '0 item left' : `Only ${selectedVariant.quantity} Left`}
              </span>
            )}
            {selectedVariant && isRunningMaterial && (product.available_meter !== undefined || selectedVariant.maximum_meter !== undefined) && (product.available_meter || selectedVariant.maximum_meter || 0) <= 10 && (
              <span className="text-xs sm:text-sm text-gray-500">
                {(product.available_meter || selectedVariant.maximum_meter || 0) === 0 
                  ? '0 meter left' 
                  : `Only ${product.available_meter || selectedVariant.maximum_meter} meter Left`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {variants.map((variant, index) => {
              const firstVariant = variant.data?.[0];
              
              // Match mobile app: variant?.data?.firstOrNull?.thumbImages
              // Mobile app uses thumbImages (camelCase) which maps from JSON's thumb_images (snake_case)
              // Web receives raw JSON with thumb_images (snake_case)
              
              let variantImage = product?.main_image || '';
              let imageFound = false;
              
              // Priority 1: Check thumb_images first (matches mobile app's thumbImages priority)
              // API response shows: thumb_images as string URL (e.g., "https://yb-live.../thumb_images/xxx.jpg")
              // Mobile uses: variant?.data?.firstOrNull?.thumbImages
              const thumbImages = firstVariant?.thumb_images;
              if (thumbImages !== undefined && thumbImages !== null) {
                // API returns thumb_images as a string URL
                if (typeof thumbImages === 'string' && thumbImages.trim() !== '') {
                  variantImage = thumbImages;
                  imageFound = true;
                } else if (typeof thumbImages === 'object' && thumbImages !== null && !Array.isArray(thumbImages)) {
                  // Handle edge case where thumb_images might be an object (shouldn't happen with current API)
                  if (Object.keys(thumbImages).length > 0 && thumbImages.image && typeof thumbImages.image === 'string') {
                    variantImage = thumbImages.image;
                    imageFound = true;
                  }
                }
                // If thumb_images is {} (empty object) or invalid, imageFound stays false, check variant_images
              }
              
              // Priority 2: Check variant_images array (fallback if thumb_images is missing/empty)
              // This matches mobile's fallback behavior
              if (!imageFound && firstVariant?.variant_images) {
                if (Array.isArray(firstVariant.variant_images) && firstVariant.variant_images.length > 0) {
                  variantImage = firstVariant.variant_images[0];
                  imageFound = true;
                }
              }
              
              // Final fallback to main_image if nothing found
              if (!imageFound) {
                variantImage = product?.main_image || '';
              }
              
              // Debug logging (can be removed after confirming)
              if (process.env.NODE_ENV === 'development' && index === 0) {
                console.log('Variant image selection:', {
                  variantName: variant.name,
                  thumb_images: firstVariant?.thumb_images,
                  variant_images: firstVariant?.variant_images,
                  selectedImage: variantImage,
                  mainImage: product.main_image
                });
              }
              // Use unique identifier: first variant's id or combination of name and index
              const variantKey = firstVariant?.id || `${variant.name}-${index}`;
              // Compare by object reference to ensure only one variant is selected
              const isSelected = selectedColorVariant === variant;
              
              return (
                <button
                  key={variantKey}
                  onClick={() => onColorSelect(variant)}
                  className="flex flex-col items-center"
                >
                  <img
                    src={variantImage}
                    alt={firstVariant?.color || variant.name}
                    className={`w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 rounded-lg transition-all ${
                      isSelected
                        ? "border-[#ec1b45]"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onError={(e) => {
                      // Fallback to main image if variant image fails to load
                      e.target.src = product.main_image;
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Chart Button for Running Material (if available) */}
      {isRunningMaterial && product.size_chart && product.size_chart.length > 0 && (
        <div className="mt-4">
          <button
            onClick={onSizeChartClick}
            className="text-xs sm:text-sm text-[#ec1b45] font-medium hover:underline"
          >
            Size Chart / Measurement Guide
          </button>
        </div>
      )}

      {/* Sizes - Only show for non-running_material products */}
      {!isRunningMaterial && selectedColorVariant && selectedColorVariant.available_sizes && selectedColorVariant.available_sizes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">
              Size: <span className="font-normal">{selectedSize || "Select a size"}</span>
            </h3>
            {product.size_chart && product.size_chart.length > 0 && (
              <button
                onClick={onSizeChartClick}
                className="text-xs sm:text-sm text-[#ec1b45] font-medium hover:underline"
              >
                Size Chart
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedColorVariant.available_sizes.map((sizeOption) => {
              const isAvailable = sizeOption.available_count > 0;
              const isSelected = selectedSize === sizeOption.size;
              
              // Find the variant data for this size to get variant images
              const sizeVariantData = selectedColorVariant.data?.find(
                (v) => v.size === sizeOption.size || v.var_id === sizeOption.var_id
              );
              
              // Get variant image - match mobile app logic
              // Backend returns: thumb_images as string URL or {} (empty object)
              // Backend returns: variant_images as array of string URLs
              let variantImage = null;
              
              // Priority 1: Check variant_images array
              if (sizeVariantData?.variant_images && Array.isArray(sizeVariantData.variant_images) && sizeVariantData.variant_images.length > 0) {
                variantImage = sizeVariantData.variant_images[0];
              } 
              // Priority 2: Check thumb_images (snake_case from API)
              else if (sizeVariantData?.thumb_images) {
                if (typeof sizeVariantData.thumb_images === 'string' && sizeVariantData.thumb_images.trim() !== '') {
                  variantImage = sizeVariantData.thumb_images;
                } else if (typeof sizeVariantData.thumb_images === 'object' && sizeVariantData.thumb_images !== null && sizeVariantData.thumb_images.image) {
                  variantImage = sizeVariantData.thumb_images.image;
                }
              }
              // Priority 3: Check thumbImages (camelCase - in case API returns it)
              else if (sizeVariantData?.thumbImages) {
                if (typeof sizeVariantData.thumbImages === 'string' && sizeVariantData.thumbImages.trim() !== '') {
                  variantImage = sizeVariantData.thumbImages;
                } else if (typeof sizeVariantData.thumbImages === 'object' && sizeVariantData.thumbImages !== null && sizeVariantData.thumbImages.image) {
                  variantImage = sizeVariantData.thumbImages.image;
                }
              }
              
              return (
                <button
                  key={sizeOption.var_id}
                  className={`min-w-10 sm:min-w-12 h-9 sm:h-10 px-2 sm:px-3 flex items-center justify-center gap-2 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#ec1b45] text-white border-[#ec1b45]"
                      : isAvailable
                      ? "border-gray-300 hover:border-[#ec1b45] cursor-pointer"
                      : "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                  onClick={() => isAvailable && onSizeSelect(sizeOption.size)}
                  disabled={!isAvailable}
                  title={!isAvailable ? "Out of stock" : ""}
                >
                  <span>{sizeOption.size}</span>
                  {variantImage && (
                    <img
                      src={variantImage}
                      alt={`${sizeOption.size} variant`}
                      className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductVariants;

