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
            {selectedVariant && !isRunningMaterial && selectedVariant.quantity > 0 && selectedVariant.quantity <= 10 && (
              <span className="text-xs sm:text-sm text-gray-500">
                Only {selectedVariant.quantity} Left
              </span>
            )}
            {selectedVariant && isRunningMaterial && (product.available_meter || selectedVariant.maximum_meter) && (product.available_meter || selectedVariant.maximum_meter) <= 10 && (
              <span className="text-xs sm:text-sm text-gray-500">
                Only {product.available_meter || selectedVariant.maximum_meter} meter Left
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {variants.map((variant, index) => {
              const firstVariant = variant.data?.[0];
              // Use variant_images first (full product image), then thumb_images (handle string or object), then fallback
              let variantImage = product.main_image;
              if (firstVariant?.variant_images?.[0]) {
                variantImage = firstVariant.variant_images[0];
              } else if (firstVariant?.thumb_images) {
                // thumb_images can be a string URL or empty object {}
                variantImage = typeof firstVariant.thumb_images === 'string' 
                  ? firstVariant.thumb_images 
                  : (firstVariant.thumb_images?.image || product.main_image);
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
              
              return (
                <button
                  key={sizeOption.var_id}
                  className={`min-w-10 sm:min-w-12 h-9 sm:h-10 px-3 sm:px-4 flex items-center justify-center border rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
                  {sizeOption.size}
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

