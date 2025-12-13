import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDiscountedProductsList, getAllDiscounts } from "../services/api/discount";
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
  const [endDate, setEndDate] = useState("");
  const [remainingTime, setRemainingTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (discountId) {
      fetchDiscountedProducts();
      fetchDiscountInfo();
    }
  }, [discountId]);

  // Calculate time remaining from end_date (matches Flutter)
  const calculateTimeRemaining = (endDateString) => {
    if (!endDateString) return { hours: 0, minutes: 0, seconds: 0 };
    
    try {
      // Parse date format: "31-12-2025 10:25:00" (DD-MM-YYYY HH:mm:ss)
      const [datePart, timePart] = endDateString.split(' ');
      const [day, month, year] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      // Create end date (month is 0-indexed in JavaScript Date)
      const endDateObj = new Date(year, month - 1, day, hours, minutes, seconds);
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diff = endDateObj - now;
      
      // If time has passed, return zeros
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      // Convert to hours, minutes, seconds (matches Flutter: inHours, remainder(60))
      const totalSeconds = Math.floor(diff / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      
      return {
        hours: totalHours, // Total hours (can be > 24, matches Flutter's inHours)
        minutes: totalMinutes % 60, // Minutes remainder (0-59, matches Flutter's remainder(60))
        seconds: totalSeconds % 60, // Seconds remainder (0-59, matches Flutter's remainder(60))
      };
    } catch (error) {
      console.error("Error parsing end date:", error);
      return { hours: 0, minutes: 0, seconds: 0 };
    }
  };

  // Update countdown timer every second (matches Flutter)
  useEffect(() => {
    if (!endDate) return;

    // Calculate initial countdown
    const initialTime = calculateTimeRemaining(endDate);
    setRemainingTime(initialTime);

    // Update countdown every second - recalculate from actual end_date (matches Flutter)
    const interval = setInterval(() => {
      const recalculated = calculateTimeRemaining(endDate);
      setRemainingTime(recalculated);
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const fetchDiscountInfo = async () => {
    try {
      const response = await getAllDiscounts();
      if (response.status && response.results) {
        const discount = response.results.find(d => d.id?.toString() === discountId);
        if (discount) {
          if (discount.name) {
            setDiscountName(discount.name);
          }
          if (discount.end_date) {
            setEndDate(discount.end_date);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch discount info:", error);
    }
  };

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

        {/* Header with Countdown (matches Flutter) */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {discountName || "Discounted Products"}
          </h1>
            
            {/* Countdown Timer (matches Flutter's OfferDetailCountDownComponent) */}
            {endDate && remainingTime.hours >= 0 && remainingTime.minutes >= 0 && remainingTime.seconds >= 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1">
                  {/* Hours */}
                  <div className="bg-[#FFEFF2] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                      {String(remainingTime.hours).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 px-0.5 sm:px-1">:</span>
                  {/* Minutes */}
                  <div className="bg-[#FFEFF2] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                      {String(remainingTime.minutes).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 px-0.5 sm:px-1">:</span>
                  {/* Seconds */}
                  <div className="bg-[#FFEFF2] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                      {String(remainingTime.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
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


