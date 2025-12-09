import { BsHandbag } from "react-icons/bs";
import { CiHeart } from "react-icons/ci";
import { FaHeart } from "react-icons/fa";

const ProductActions = ({
  selectedVariant,
  isAddingToCart,
  isAddingToFavorite,
  isFavorite,
  product,
  onAddToCart,
  onAddToFavorite
}) => {
  const isCartDisabled = !selectedVariant || isAddingToCart;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
      <button
        className="flex items-center justify-center gap-2 bg-[#ec1b45] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-md hover:bg-[#d91b40] flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        onClick={onAddToCart}
        disabled={isCartDisabled}
      >
        {isAddingToCart ? (
          <>
            <span className="animate-spin">⏳</span> Adding...
          </>
        ) : (
          <>
            <BsHandbag /> Add to Cart
          </>
        )}
      </button>
      <button
        className="flex items-center justify-center gap-2 border-2 border-[#ec1b45] bg-white text-[#ec1b45] px-4 sm:px-6 py-2.5 sm:py-3 rounded-md hover:bg-[#ec1b45] hover:text-white flex-1 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        onClick={onAddToFavorite}
        disabled={isAddingToFavorite}
      >
        {isAddingToFavorite ? (
          <>
            <span className="animate-spin">⏳</span> {isFavorite ? "Removing..." : "Adding..."}
          </>
        ) : (
          <>
            {isFavorite ? <FaHeart /> : <CiHeart />} {isFavorite ? "Remove from Favorite" : "Add to Favorite"}
          </>
        )}
      </button>
    </div>
  );
};

export default ProductActions;

