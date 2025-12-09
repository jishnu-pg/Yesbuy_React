import { useEffect, useRef, useState } from "react";
import ProductCard from "../ProductCard";
import LoaderSpinner from "../LoaderSpinner";

const SimilarProducts = ({
  similarProducts,
  isLoadingSimilarProducts
}) => {
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const autoScrollIntervalRef = useRef(null);

  // Calculate total pages based on visible products (6 per page)
  const productsPerPage = 6;

  useEffect(() => {
    if (similarProducts.length > 0) {
      const pages = Math.ceil(similarProducts.length / productsPerPage);
      setTotalPages(pages);
    }
  }, [similarProducts]);

  // Check scroll position to update current page
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
      const page = Math.round(scrollPercentage * (totalPages - 1));
      setCurrentPage(page);
    }
  };

  // Auto-scroll functionality
  const startAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const nextPage = (currentPage + 1) % totalPages;
        scrollToPage(nextPage);
      }
    }, 3000); // Auto-scroll every 3 seconds
  };

  // Stop auto-scroll
  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // Scroll to specific page
  const scrollToPage = (pageIndex) => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollPosition = (scrollWidth - clientWidth) * (pageIndex / (totalPages - 1));

      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentPage(pageIndex);
    }
  };

  // Handle dot click
  const handleDotClick = (pageIndex) => {
    stopAutoScroll();
    scrollToPage(pageIndex);
    // Restart auto-scroll after a delay
    setTimeout(() => {
      startAutoScroll();
    }, 5000);
  };

  // Initialize auto-scroll and scroll position check
  useEffect(() => {
    if (similarProducts.length > 0 && !isLoadingSimilarProducts && totalPages > 1) {
      checkScrollPosition();
      startAutoScroll();

      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollPosition);
      }

      return () => {
        stopAutoScroll();
        if (container) {
          container.removeEventListener('scroll', checkScrollPosition);
        }
      };
    }
  }, [similarProducts, isLoadingSimilarProducts, totalPages, currentPage]);

  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-left tracking-tight">
        You may Like
      </h2>
      {isLoadingSimilarProducts ? (
        <div className="py-8">
          <LoaderSpinner label="Loading similar products..." />
        </div>
      ) : (
        <div>
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={stopAutoScroll}
            onMouseLeave={startAutoScroll}
            className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {similarProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentPage === index
                      ? 'bg-[#ec1b45]'
                      : 'bg-[#ffccd5] hover:bg-[#ffb3c1]'
                    }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SimilarProducts;

