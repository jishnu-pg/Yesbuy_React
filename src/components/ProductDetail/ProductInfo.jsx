const ProductInfo = ({ 
  product, 
  currentPrice, 
  originalPrice, 
  discountPercentage, 
  isBogo, 
  discountText, 
  hasOffer,
  selectedVariant 
}) => {
  return (
    <div className="w-full lg:flex-1 lg:max-w-lg lg:pl-8">
      <div className="sticky top-4 space-y-4 sm:space-y-6">
        {/* Brand */}
        {product.brand_name && (
          <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {product.brand_name}
          </p>
        )}
        
        {/* Product Name */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {product.name}
        </h2>
        
        {/* Price */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <p className="text-xl sm:text-2xl font-bold text-[#ec1b45]">
            ₹{currentPrice?.toLocaleString('en-IN')}
          </p>
          {hasOffer && (discountPercentage > 0 || isBogo) && (
            <>
              {discountPercentage > 0 && (
                <p className="text-base sm:text-lg text-gray-500 line-through">
                  ₹{originalPrice?.toLocaleString('en-IN')}
                </p>
              )}
              <span className="text-xs sm:text-sm text-[#ec1b45] font-semibold bg-red-50 px-2 py-1 rounded">
                {isBogo && discountText ? discountText : `${discountPercentage}% OFF`}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Product Details */}
        {(selectedVariant?.material || selectedVariant?.fit) && (
          <div className="mt-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Product Details</h3>
            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              {selectedVariant?.material && (
                <div>
                  <span className="text-gray-600">Material: </span>
                  <span className="font-medium capitalize">{selectedVariant.material}</span>
                </div>
              )}
              {selectedVariant?.fit && (
                <div>
                  <span className="text-gray-600">Fit: </span>
                  <span className="font-medium capitalize">{selectedVariant.fit}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Details */}
        {(() => {
          // Get additional details from variant (preferred) or product
          const details = selectedVariant?.additional_details || product.additional_details || {};
          const hasDetails = Object.keys(details).length > 0;
          
          if (!hasDetails) return null;
          
          // Helper function to format field names
          const formatFieldName = (key) => {
            return key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
          };
          
          return (
            <div className="mt-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Additional Details</h3>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                {/* Dynamic additional details from variant or product */}
                {Object.entries(details).map(([key, value]) => {
                  // Format the value
                  let displayValue = value;
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else if (typeof value === 'string') {
                    displayValue = value;
                  }
                  
                  // Special handling for certain fields
                  const fieldName = formatFieldName(key);
                  
                  return (
                    <div key={key}>
                      <span className="text-gray-600">{fieldName}: </span>
                      <span className="font-medium capitalize">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ProductInfo;

