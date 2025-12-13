import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDiscounts } from "../services/api/discount";

const OtherOffers = () => {
  const [otherOffers, setOtherOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOtherOffers();
  }, []);

  const fetchOtherOffers = async () => {
    try {
      setIsLoading(true);
      const response = await getAllDiscounts();
      
      if (response.status && response.results) {
        // Filter for offers that are NOT BIGGEST_SALE or Flash_Sale (matches Flutter)
        const offers = response.results.filter(
          (offer) => offer.offer_type !== "BIGGEST_SALE" && offer.offer_type !== "Flash_Sale"
        );
        
        if (offers.length > 0) {
          setOtherOffers(offers);
        } else {
          setOtherOffers([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch other offers:", error);
      setOtherOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerClick = (discountId) => {
    if (discountId) {
      navigate(`/discount/${discountId}`);
    }
  };

  // Don't render anything if loading or no offers
  if (isLoading) {
    return null;
  }

  if (otherOffers.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-5 md:mb-6 space-y-4 sm:space-y-6">
      {otherOffers.map((offer) => {
        const images = offer.images || [];
        if (images.length === 0) return null;

        return (
          <div key={offer.id} className="space-y-2 sm:space-y-3">
            {/* Offer Title */}
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {offer.name || "Special Offer"}
            </h2>

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
                .other-offers-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex gap-3 sm:gap-4 other-offers-scroll">
                {images.map((img, index) => (
                  <div
                    key={img.id || index}
                    onClick={() => handleBannerClick(offer.id)}
                    className="flex-shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-sm"
                    style={{ 
                      width: 'calc(100vw - 2rem)', // Full width minus padding (matches Flutter)
                      aspectRatio: '16/9', // Matches Flutter
                    }}
                  >
                    <img
                      src={img.image}
                      alt={img.alt_text || offer.name || "Offer"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OtherOffers;

