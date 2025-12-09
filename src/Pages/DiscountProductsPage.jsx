import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDiscountedProductsList } from "../services/api/discount";
import ProductCard from "../components/ProductCard";
import LoaderSpinner from "../components/LoaderSpinner";
import { showError } from "../utils/toast";
import { FaArrowLeft } from "react-icons/fa";

const DiscountProductsPage = () => {
  const { discountId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [discountName, setDiscountName] = useState("");

  useEffect(() => {
    if (discountId) {
      fetchDiscountedProducts();
    }
  }, [discountId]);

  const fetchDiscountedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getDiscountedProductsList(discountId);
      
      if (response && response.results) {
        // Map products to match ProductCard format
        const mappedProducts = response.results.map((product) => ({
          id: product.product_id || product.id,
          product_id: product.product_id,
          variant_id: product.variant_id,
          name: product.name,
          title: product.name,
          price: product.discount_price?.has_offer 
            ? product.discount_price.discounted_price 
            : product.price,
          originalPrice: product.discount_price?.base_price || product.price,
          discountPercentage: product.discount_price?.percentage || 0,
          discount: product.discount_price?.percentage || 0,
          discount_text: product.discount_price?.discount_text || null,
          discountText: product.discount_price?.discount_text || null,
          is_bogo: product.discount_price?.is_bogo || false,
          has_offer: product.discount_price?.has_offer || false,
          images: [
            { url: product.main_image },
            ...(product.additional_images || []).map(img => ({ 
              url: typeof img === 'string' ? img : img.image || img 
            }))
          ],
          main_image: product.main_image,
          additional_images: product.additional_images || [],
          brand: product.brand_name || null,
          brand_name: product.brand_name || null,
          category: product.category_name,
          subCategory: product.sub_category_name,
          stock: product.stock,
          description: product.description,
          gender: product.gender,
          slug: product.slug,
          isFavourite: product.is_favourite,
          is_favourite: product.is_favourite,
          size_type: product.size_type,
          minimum_meter: product.minimum_meter,
        }));
        
        setProducts(mappedProducts);
        
        // Try to get discount name from first product's discount_price if available
        if (response.results.length > 0 && response.results[0].discount_price?.discount_name) {
          setDiscountName(response.results[0].discount_price.discount_name);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch discounted products:", error);
      showError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoaderSpinner label="Loading products..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-manrope">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {discountName || "Discounted Products"}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {products.length > 0 
              ? `${products.length} product${products.length !== 1 ? 's' : ''} found`
              : 'No products found'}
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-8">There are no products available for this discount.</p>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors font-medium"
            >
              <FaArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountProductsPage;


