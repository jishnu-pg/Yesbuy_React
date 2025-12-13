import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { getAllDiscounts } from "../services/api/discount";

import "swiper/css";
import "swiper/css/pagination";

const Banner = ({ heading }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await getAllDiscounts();
        
        // Filter for BIGGEST_SALE offers only (matches Flutter)
        if (response.results && response.results.length > 0) {
          const biggestSaleOffers = response.results.filter(
            (discount) => discount.offer_type === "BIGGEST_SALE"
          );
          
          // Map discount API response to banner format
          const mappedBanners = biggestSaleOffers.flatMap((discount) => {
            // Get images from discount.images array
            if (discount.images && discount.images.length > 0) {
              return discount.images.map((img) => ({
                bannerUrl: img.image,
                altText: img.alt_text || discount.name || "Banner",
                discountId: discount.id, // Store discount ID for navigation
                discountName: discount.name, // Store discount name
                hotspots: [],
                openInNewTab: false,
              }));
            }
            return [];
          });
          setBanners(mappedBanners);
        } else {
          setBanners([]);
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (banner) => {
    if (banner.discountId) {
      // Navigate to discount products page with discount_id
      navigate(`/discount/${banner.discountId}`);
    }
  };

  
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full mt-3 h-30 md:h-60 bg-gray-200 animate-pulse rounded"></div>
    );
  }

  // Don't render if no banners
  if (banners.length === 0) {
    return null;
  }
  
  return (
    <div className="w-full mt-2 sm:mt-3">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} custom-bullet"></span>`,
          el: '.banner-pagination',
        }}
        loop={banners.length > 1}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
        }}
        spaceBetween={10}
        className="w-full"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <button
              onClick={() => handleBannerClick(banner)}
              className="block w-full cursor-pointer"
            >
              {/* Banner images: 16:9 aspect ratio (matches Flutter) */}
              <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden rounded">
                <img
                  src={banner.bannerUrl}
                  alt={banner.altText}
                  className="w-full h-full"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Pagination dots outside banner - bottom center */}
      <div className="banner-pagination flex justify-center items-center mt-3"></div>
    </div>
  );
};

export default Banner;
