const ProductStockInfo = ({ 
  isRunningMaterial, 
  product, 
  selectedVariant 
}) => {
  if (!selectedVariant) return null;

  return (
    <div className="mt-4">
      {isRunningMaterial ? (
        // For running_material, show available meter
        (product.available_meter || selectedVariant.maximum_meter) > 0 ? (
          <p className="text-xs sm:text-sm text-green-600 font-medium">
            In Stock ({product.available_meter || selectedVariant.maximum_meter || 'N/A'} meter available)
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-red-600 font-medium">
            Out of Stock
          </p>
        )
      ) : (
        // For regular products, show quantity
        selectedVariant.quantity > 0 ? (
          <p className="text-xs sm:text-sm text-green-600 font-medium">
            In Stock ({selectedVariant.quantity} available)
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-red-600 font-medium">
            Out of Stock
          </p>
        )
      )}
    </div>
  );
};

export default ProductStockInfo;

