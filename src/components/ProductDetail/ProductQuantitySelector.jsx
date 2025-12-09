import { useEffect } from "react";

const ProductQuantitySelector = ({
  isRunningMaterial,
  product,
  selectedVariant,
  quantity,
  setQuantity,
  meter,
  setMeter
}) => {
  if (!selectedVariant) return null;

  // Ensure quantity is always at least 1 when component renders or quantity changes
  useEffect(() => {
    if (!isRunningMaterial && (quantity <= 0 || !quantity || quantity === 0)) {
      setQuantity(1);
    }
  }, [quantity, setQuantity, isRunningMaterial]);

  return (
    <div className="mt-4">
      {/* Check if it's running material type - ONLY check size_type, not minimum_meter */}
      {isRunningMaterial || 
       selectedVariant.size_type === 'running_material' || 
       selectedVariant.size_type === 'runningmaterial' ? (
        <div>
          <div className="flex items-center bg-[#fef2f2] rounded-lg border border-gray-200 w-fit">
            <button
              onClick={() => {
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                const currentMeter = parseFloat(meter) || minMeter;
                const newMeter = Math.max(minMeter, currentMeter - 1);
                setMeter(newMeter);
              }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={(() => {
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                const currentMeter = parseFloat(meter) || minMeter;
                return currentMeter <= minMeter;
              })()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min={product.minimum_meter || selectedVariant.minimum_meter || 0}
              max={product.available_meter || product.maximum_meter || selectedVariant.maximum_meter || 9999}
              step="1"
              value={meter || (() => {
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                return minMeter > 0 ? minMeter : 0;
              })()}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                const maxMeter = parseFloat(product.available_meter || product.maximum_meter || selectedVariant.maximum_meter || 9999);
                // Ensure value is never less than minimum_meter - user cannot buy less than minimum
                const clampedVal = Math.max(minMeter, Math.min(maxMeter, val));
                setMeter(clampedVal);
              }}
              onBlur={(e) => {
                // If user clears the field or enters value less than minimum, reset to minimum_meter
                const val = parseFloat(e.target.value) || 0;
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                if (val < minMeter) {
                  setMeter(minMeter);
                }
              }}
              className="w-16 px-2 py-2 bg-transparent border-0 focus:outline-none text-center text-sm font-bold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => {
                const maxMeter = parseFloat(product.available_meter || product.maximum_meter || selectedVariant.maximum_meter || 9999);
                const minMeter = parseFloat(product.minimum_meter || selectedVariant.minimum_meter || 0);
                const currentMeter = parseFloat(meter) || minMeter;
                const newMeter = Math.min(maxMeter, currentMeter + 1);
                setMeter(newMeter);
              }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={(() => {
                const maxMeter = parseFloat(product.available_meter || product.maximum_meter || selectedVariant.maximum_meter || 9999);
                const currentMeter = parseFloat(meter) || 0;
                return currentMeter >= maxMeter;
              })()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {selectedVariant.price_per_meter && (
            <p className="text-xs text-gray-500 mt-1">
              Price per meter: ₹{selectedVariant.price_per_meter}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center bg-[#fef2f2] rounded-lg border border-gray-200 w-fit">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={quantity <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={selectedVariant.quantity || 999}
              value={Math.max(1, quantity || 1)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1 || val === 0 || !e.target.value) {
                  setQuantity(1);
                } else {
                  setQuantity(Math.min(val, selectedVariant.quantity || 999));
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1 || val === 0 || !e.target.value || e.target.value.trim() === '') {
                  setQuantity(1);
                }
              }}
              className="w-16 px-2 py-2 bg-transparent border-0 focus:outline-none text-center text-sm font-bold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setQuantity(prev => Math.min(selectedVariant.quantity || 999, prev + 1))}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={quantity >= (selectedVariant.quantity || 999)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductQuantitySelector;

