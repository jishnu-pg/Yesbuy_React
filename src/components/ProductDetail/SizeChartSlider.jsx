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

      {/* Product Variant Info */}
      {selectedVariant && (
        <div className="border-b border-gray-200 px-3 sm:px-5 py-3 sm:py-4 bg-gray-50">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <img
                src={selectedVariant.variant_images?.[0] || product.main_image}
                alt={product.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200"
              />
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 truncate mb-1">
                {product.name}
              </h3>
              {selectedColorVariant && (
                <p className="text-xs text-gray-600 mb-1 sm:mb-2">
                  Color: {selectedVariant?.color || selectedColorVariant.name}
                </p>
              )}
              {!isRunningMaterial && selectedSize && (
                <p className="text-xs text-gray-600 mb-1 sm:mb-2">
                  Size: {selectedSize}
                </p>
              )}
              {isRunningMaterial && meter && (
                <p className="text-xs text-gray-600 mb-1 sm:mb-2">
                  Meter: {meter}
                </p>
              )}
              
              {/* Price */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-[#ec1b45]">
                  ₹{currentPrice?.toLocaleString('en-IN')}
                </span>
                {hasOffer && (discountPercentage > 0 || isBogo) && (
                  <>
                    {discountPercentage > 0 && (
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        ₹{originalPrice?.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xs text-[#ec1b45] font-semibold bg-red-50 px-1.5 sm:px-2 py-0.5 rounded">
                      {isBogo && discountText ? discountText : `${discountPercentage}% OFF`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Size Chart Content */}
      <div className="overflow-y-auto h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] p-3 sm:p-5">
        {product.size_chart.map((chart, index) => (
          <div key={index} className="h-full flex flex-col">
            {chart.measurement && (
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium flex-shrink-0">Measurement: {chart.measurement}</p>
            )}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img
                src={chart.measurement_image}
                alt={`Size Chart - ${chart.measurement || 'Standard'}`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeChartSlider;

