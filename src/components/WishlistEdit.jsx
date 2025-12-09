import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectWishlistItems,
} from "../features/wishlist/wishlistSlice";
import { IoHeartOutline } from "react-icons/io5";
import ProductCard from "./ProductCard";

const WishlistEdit = () => {
  const wishlistItems = useSelector(selectWishlistItems);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">My Favorites</h2>
        <p className="text-gray-600">
          {wishlistItems.length > 0 
            ? `You have ${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} in your favorites`
            : 'Your favorites is empty'
          }
        </p>
      </div>
      
      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <IoHeartOutline size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No items in favorites</h3>
          <p className="text-gray-500 mb-4 text-sm">Start adding products you love</p>
          <Link 
            to="/home"
            className="inline-block bg-[#ec1b45] text-white px-4 py-2 rounded-md hover:bg-[#d91b40] transition-colors text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {wishlistItems.map((product) => (
            <ProductCard 
              key={product.id || product.product_id || product.variant_id} 
              product={product}
              size="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistEdit;
