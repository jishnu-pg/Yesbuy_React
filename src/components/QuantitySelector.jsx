// components/QuantitySelector.jsx
import { useState } from "react";

const QuantitySelector = ({ quantity, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Main button */}
      <div className="relative inline-block text-left">
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Qty: {quantity} ▾
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-gray-900 opacity-50"
          />
          {/* Quantity selector panel */}
          <div
            className={`relative w-full max-w-md bg-white rounded-lg shadow-xl p-4 z-10 transition-all duration-300 ease-out ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Quantity</h3>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`w-12 h-12 rounded-full border-1 border-gray-200 text-sm flex items-center justify-center transition-colors ${
                    quantity === i + 1 
                      ? 'bg-[#ec1b45] text-white border-[#ec1b45]'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    onSelect(i + 1);
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {/* Done button */}
            <button
              className="mt-6 w-full py-2 bg-[#ec1b45] text-white rounded-md font-semibold text-base hover:bg-[#b91536] transition-colors"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuantitySelector;