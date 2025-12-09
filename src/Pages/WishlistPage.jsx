import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectWishlistItems } from "../features/wishlist/wishlistSlice";
import ProductCard from "../components/ProductCard";

const WishlistPage = () => {
  const wishlistItems = useSelector(selectWishlistItems);

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <FaHeart className="mx-auto text-gray-300 text-6xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Favorites is Empty</h1>
          <p className="text-gray-600 mb-6">Start adding products to your favorites to see them here!</p>
          <Link 
            to="/home" 
            className="bg-[#ec1b45] text-white px-6 py-3 rounded-md hover:bg-[#d91b40] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Favorites</h1>
        <p className="text-gray-600">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {wishlistItems.map((product) => (
          <ProductCard 
            key={product.id || product.product_id || product.variant_id} 
            product={product}
            size="compact"
          />
        ))}
      </div>
    </div>
  );
};

export default WishlistPage; 