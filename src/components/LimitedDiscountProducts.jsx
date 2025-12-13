import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import Carousel from "./Carousel";
import { getDiscountedProductsLimitedList } from "../services/api/discount";
import LoaderSpinner from "./LoaderSpinner";
import { showError } from "../utils/toast";

const ITEMS_PER_PAGE = 6;

const LimitedDiscountProducts = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await getDiscountedProductsLimitedList();

      if (response.results && response.results.length > 0) {
        // Map API response to ProductCard format
        const mappedProducts = response.results.map((product) => ({
          // MUST use product_id (not variant_id) - matches mobile app behavior
          // Mobile app uses: productId (maps to product_id from API)
          // API get-product-variants-by-id requires product_id
          id: product.product_id, // Remove variant_id fallback
          product_id: product.product_id,
          variant_id: product.variant_id, // Keep for reference but don't use for navigation
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
          is_trending: true, // All products from limited list API show trending badge (matches Flutter)
          size_type: product.size_type,
          minimum_meter: product.minimum_meter,
        }));

        setData(mappedProducts);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch limited discount products:", error);
      showError("Failed to load featured deals. Please try again.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="relative">
        <div className="py-8">
          <LoaderSpinner label="Loading featured deals..." />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <div className="relative">
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

export default LimitedDiscountProducts;

