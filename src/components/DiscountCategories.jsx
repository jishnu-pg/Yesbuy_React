import { useEffect, useState } from "react";
import { getTrendingOffers } from "../services/api/banner";
import LoaderSpinner from "./LoaderSpinner";
import { showError } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const DiscountCategories = () => {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Countdown timer state
  const [countdowns, setCountdowns] = useState({});
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Calculate time remaining from end_date (returns hours, minutes, seconds only)
  const calculateTimeRemaining = (endDateString) => {
    if (!endDateString) return null;
    
    // Parse date format: "31-12-2025 10:25:00" (DD-MM-YYYY HH:mm:ss)
    const [datePart, timePart] = endDateString.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    // Create end date (month is 0-indexed in JavaScript Date)
    const endDate = new Date(year, month - 1, day, hours, minutes, seconds);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diff = endDate - now;
    
    // If time has passed, return zeros
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    // Convert to total hours, minutes, seconds (days converted to hours)
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const hoursRemaining = totalHours % 24; // Hours within current day
    const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Return total hours (including days converted to hours), minutes, seconds
    return {
      hours: totalHours, // Total hours including days
      minutes: minutesRemaining,
      seconds: secondsRemaining,
    };
  };

  // Update countdown timers every second - Live countdown
  useEffect(() => {
    if (discounts.length === 0) return;

    // Calculate initial countdowns from end_date
    const initialCountdowns = {};
    discounts.forEach((discount) => {
      if (discount.end_date) {
        initialCountdowns[discount.id] = calculateTimeRemaining(discount.end_date);
      } else if (discount.sale_ends_in) {
        // Fallback to sale_ends_in if end_date is not available
        initialCountdowns[discount.id] = formatSaleEndsIn(discount.sale_ends_in);
      }
    });
    setCountdowns(initialCountdowns);

    // Update countdown every second - recalculate from actual end_date
    const interval = setInterval(() => {
      setCountdowns(() => {
        const newCountdowns = {};
        discounts.forEach((discount) => {
          if (discount.end_date) {
            newCountdowns[discount.id] = calculateTimeRemaining(discount.end_date);
          } else if (discount.sale_ends_in) {
            // Fallback to sale_ends_in if end_date is not available
            newCountdowns[discount.id] = formatSaleEndsIn(discount.sale_ends_in);
          }
        });
        return newCountdowns;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [discounts]);

  // Format sale ends in timer (fallback function) - converts days to hours
  const formatSaleEndsIn = (saleEndsIn) => {
    if (!saleEndsIn) return null;
    // Format: "28:00:00:00" -> convert days to hours -> {hours: 672, minutes: 0, seconds: 0}
    const parts = saleEndsIn.split(':');
    if (parts.length === 4) {
      const [days, hours, minutes, seconds] = parts.map(Number);
      // Convert days to hours and add to hours
      const totalHours = (days * 24) + hours;
      return { hours: totalHours, minutes, seconds };
    }
    return null;
  };

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await getTrendingOffers();
      
      // Map trending offers API response to discount format
      // The trending offers API returns: {results: {id, name, additional_images: [{image}]}}
      if (response.results) {
        // Convert trending offers format to discount format
        const trendingOffer = response.results;
        const discountId = trendingOffer.id; // Store the discount ID for navigation
        const mappedDiscounts = trendingOffer.additional_images?.map((img, index) => ({
          id: discountId || index, // Use the discount ID from API
          discountId: discountId, // Store discount ID separately for navigation
          offer_type: "Flash_Sale", // Default to Flash_Sale for trending offers
          name: trendingOffer.name || "Trending Offer",
          images: [{ image: img.image, alt_text: img.alt_text || "" }],
          sale_ends_in: null, // Trending offers might not have countdown
          end_date: null,
        })) || [];
        
        setDiscounts(mappedDiscounts);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
      showError("Failed to load discount offers. Please try again.");
      setDiscounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscountClick = (discount) => {
    // Navigate to discount products page with discount_id
    const discountId = discount.discountId || discount.id;
    if (discountId) {
      navigate(`/discount/${discountId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full">
        <div className="py-8">
          <LoaderSpinner label="Loading offers..." />
        </div>
      </div>
    );
  }

  if (discounts.length === 0) {
    return null; // Don't show section if no discounts
  }

  // Check if any discount is a Flash Sale
  const hasFlashSale = discounts.some(d => d.offer_type === 'Flash_Sale');
  
  // Get the active discount's countdown for display
  const activeDiscount = discounts[activeSlideIndex] || discounts[0];
  const displayCountdown = activeDiscount 
    ? (countdowns[activeDiscount.id] || 
       (activeDiscount.end_date 
         ? calculateTimeRemaining(activeDiscount.end_date) 
         : formatSaleEndsIn(activeDiscount.sale_ends_in))) 
    : null;

  return (
    <div className="relative w-full">
      {/* Top Section: Flash Sale (centered) + Countdown (below) - Outside banner */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-5">
        {/* Flash Sale Header - Centered - Matching Featured Deals font size */}
        {hasFlashSale && (
          <h1 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-gray-800 w-full tracking-tight"
          >
            Flash <span className="text-[#ec1b45]">Sale</span>
          </h1>
        )}
        
        {/* Countdown Timer - Below heading */}
        {displayCountdown && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <span 
              className="text-gray-600 font-medium whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-xl"
              style={{ fontSize: 'clamp(14px, 3vw, 30px)' }}
            >
              Closing in :
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span 
                className="font-bold text-red-600"
                style={{ fontSize: 'clamp(16px, 3.5vw, 25px)' }}
              >
                {String(displayCountdown.hours || 0).padStart(2, '0')}
              </span>
              <span 
                className="text-gray-500"
                style={{ fontSize: 'clamp(16px, 3.5vw, 25px)' }}
              >
                :
              </span>
              <span 
                className="font-bold text-red-600"
                style={{ fontSize: 'clamp(16px, 3.5vw, 25px)' }}
              >
                {String(displayCountdown.minutes || 0).padStart(2, '0')}
              </span>
              <span 
                className="text-gray-500"
                style={{ fontSize: 'clamp(16px, 3.5vw, 25px)' }}
              >
                :
              </span>
              <span 
                className="font-bold text-red-600"
                style={{ fontSize: 'clamp(16px, 3.5vw, 25px)' }}
              >
                {String(displayCountdown.seconds || 0).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          loop={discounts.length > 1}
          spaceBetween={20}
          className="w-full"
          onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
        >
        {discounts.map((discount) => {
          // Get first image from images array
          const discountImage = discount.images && discount.images.length > 0 
            ? discount.images[0].image 
            : null;
          const imageAltText = discount.images && discount.images.length > 0 
            ? discount.images[0].alt_text 
            : discount.name || "Discount Offer";
          
          const countdown = countdowns[discount.id] || formatSaleEndsIn(discount.sale_ends_in);

          return (
            <SwiperSlide key={discount.id}>
              <div
                onClick={() => handleDiscountClick(discount)}
                className="relative w-full rounded-lg overflow-hidden cursor-pointer min-h-[250px] sm:min-h-[350px] md:min-h-[450px]"
              >
                {discountImage ? (
                  <img
                    src={discountImage}
                    alt={imageAltText}
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{
                      background: 'linear-gradient(to right, #fb923c, #ef4444, #dc2626)',
                    }}
                  />
                )}
              </div>
            </SwiperSlide>
          );
        })}
        </Swiper>
      </div>
    </div>
  );
};

export default DiscountCategories;

