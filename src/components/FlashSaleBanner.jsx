import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDiscounts } from "../services/api/discount";

const FlashSaleBanner = () => {
  const [flashSaleOffers, setFlashSaleOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlashSaleBanner();
  }, []);

  // Calculate time remaining from end_date
  const calculateTimeRemaining = (endDateString) => {
    if (!endDateString) return { hours: 0, minutes: 0, seconds: 0 };
    
    try {
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
      
      // Convert to hours, minutes, seconds (matches Flutter: inHours, inMinutes.remainder(60), inSeconds.remainder(60))
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

  // Update countdown timer every second (recalculate from end_date each time, matches Flutter)
  useEffect(() => {
    if (flashSaleOffers.length === 0) return;

    const firstFlashSale = flashSaleOffers[0];
    if (!firstFlashSale?.end_date) return;

    // Calculate initial countdown
    const initialTime = calculateTimeRemaining(firstFlashSale.end_date);
    setRemainingTime(initialTime);

    // Update countdown every second - recalculate from actual end_date (matches Flutter)
    const interval = setInterval(() => {
      const recalculated = calculateTimeRemaining(firstFlashSale.end_date);
      setRemainingTime(recalculated);
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSaleOffers]);

  const fetchFlashSaleBanner = async () => {
    try {
      setIsLoading(true);
      const response = await getAllDiscounts();
      
      if (response.status && response.results) {
        // Filter for Flash_Sale offer_type (matches Flutter)
        const flashSales = response.results.filter(
          (offer) => offer.offer_type === "Flash_Sale"
        );
        
        if (flashSales.length > 0) {
          setFlashSaleOffers(flashSales);
        } else {
          setFlashSaleOffers([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Flash Sale banner:", error);
      setFlashSaleOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerClick = (discountId) => {
    if (discountId) {
      navigate(`/discount/${discountId}`);
    }
  };

  // Don't render anything if loading or no flash sale
  if (isLoading) {
    return null;
  }

  if (flashSaleOffers.length === 0) {
    return null;
  }

  const firstFlashSale = flashSaleOffers[0];
  const images = firstFlashSale.images || [];

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-5 md:mb-6">
      {/* Flash Sale Header with Countdown Timer (matches Flutter) */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 tracking-tight">
          Flash <span className="text-[#ec1b45]">Sale</span>
        </h1>
        
        {/* Countdown Timer - Matches Flutter's _FlashSaleHeader */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
            Closing in:
          </span>
          <div className="flex items-center gap-1">
            {/* Hours - Pink background pill (matches Flutter's _TimerPill) */}
            <div className="bg-[#FFEFF6] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                {String(remainingTime.hours).padStart(2, '0')}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 px-0.5 sm:px-1">:</span>
            {/* Minutes */}
            <div className="bg-[#FFEFF6] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                {String(remainingTime.minutes).padStart(2, '0')}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 px-0.5 sm:px-1">:</span>
            {/* Seconds */}
            <div className="bg-[#FFEFF6] rounded px-1.5 sm:px-2 py-1 min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-[#ec1b45]">
                {String(remainingTime.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Banners (matches Flutter - full width items with 16:9 aspect ratio) */}
      <div 
        className="overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          .flash-sale-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex gap-3 sm:gap-4 flash-sale-scroll">
          {images.map((img, index) => (
            <div
              key={img.id || index}
              onClick={() => handleBannerClick(firstFlashSale.id)}
              className="flex-shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-sm"
              style={{ 
                width: 'calc(100vw - 2rem)', // Full width minus padding (matches Flutter: screenW - sidePad * 2)
                aspectRatio: '16/9', // Matches Flutter
              }}
            >
              <img
                src={img.image}
                alt={img.alt_text || firstFlashSale.name || "Flash Sale"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBanner;

