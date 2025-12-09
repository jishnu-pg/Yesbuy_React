import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import Carousel from "./Carousel";
import { getDiscountedProductsList } from "../services/api/product";
import LoaderSpinner from "./LoaderSpinner";
import { showError } from "../utils/toast";

const ITEMS_PER_PAGE = 6;

const Trending = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await getDiscountedProductsList();
      
      if (response.results && response.results.length > 0) {
        // Map API response to ProductCard format
            const mappedProducts = response.results.map((product) => ({
              id: product.product_id || product.variant_id,
              product_id: product.product_id,
              variant_id: product.variant_id,
              title: product.name,
              name: product.name,
              price: product.discount_price?.has_offer 
                ? product.discount_price.discounted_price 
                : product.price,
              originalPrice: product.discount_price?.base_price || product.price,
              discountPercentage: product.discount_price?.percentage || 0,
              is_bogo: product.discount_price?.is_bogo || false,
              discount_text: product.discount_price?.discount_text || null,
              has_offer: product.discount_price?.has_offer || false,
          images: [
            { url: product.main_image },
            ...(product.additional_images || []).map(img => ({ 
              url: typeof img === 'string' ? img : img.image || img 
            }))
          ],
          main_image: product.main_image,
          additional_images: product.additional_images || [],
          brand: product.brand_name || null, // Don't fallback to category_name
          brand_name: product.brand_name || null, // Use null if empty string
          category: product.category_name,
          subCategory: product.sub_category_name,
          stock: product.stock,
          description: product.description,
          gender: product.gender,
          slug: product.slug,
          isFavourite: product.is_favourite,
          is_favourite: product.is_favourite,
          is_trending: product.discount_price?.offer_type === "Trending_Offers",
          size_type: product.size_type,
          minimum_meter: product.minimum_meter,
        }));
        
        setData(mappedProducts);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch trending products:", error);
      showError("Failed to load trending products. Please try again.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="relative w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-gray-800 mb-3 sm:mb-4 tracking-tight">
          <span className="text-[#ec1b45]">YB</span> Trendings
        </h1>
        <div className="py-8">
          <LoaderSpinner label="Loading trending products..." />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="relative w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-gray-800 mb-3 sm:mb-4 tracking-tight">
          <span className="text-[#ec1b45]">YB</span> Trendings
        </h1>
        <div className="text-center py-8 text-gray-500">
          No trending products available.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-gray-800 mb-2 sm:mb-4 md:mb-5 tracking-tight">
        <span className="text-[#ec1b45]">YB</span> Trendings
      </h1>
      <div className="mt-1 sm:mt-3">
        <Carousel
        items={data}
        itemsPerPage={ITEMS_PER_PAGE}
        renderItem={(item) => (
          <ProductCard 
            key={item.id || item.product_id || item.variant_id}
            product={item} 
          />
        )}
        />
      </div>
    </div>
  );
};

export default Trending;
