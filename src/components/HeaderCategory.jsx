import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getAllCategories } from "../services/api/category";

const HeaderCategory = () => {
  const location = useLocation();
  const containerRef = useRef(null);
  const linkRefs = useRef([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCategories();
        // Map API response to component format
        const mappedCategories = response.results.map((category) => ({
          id: category.id,
          name: category.name,
          img: category.category_image || "https://via.placeholder.com/100?text=No+Image",
        }));
        setCategories(mappedCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Keep empty array on error, or you could set a fallback
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get the selected category ID from the URL
  const selectedCategoryId = location.pathname.startsWith("/category/")
    ? location.pathname.split("/category/")[1]?.split("/")[0] // Get category ID
    : null;

  // Center the selected category in the scrollable container (on mobile)
  useEffect(() => {
    if (!selectedCategoryId || categories.length === 0) return;
    const idx = categories.findIndex(
      (item) => String(item.id) === String(selectedCategoryId)
    );
    if (idx !== -1 && linkRefs.current[idx]) {
      linkRefs.current[idx].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedCategoryId, categories]);

  // Show loading state or empty state
  if (isLoading) {
    return (
      <div className="shadow-md sm:shadow-none flex h-14 sm:h-36 sticky top-[80px] sm:static z-40">
        <div className="flex justify-start lg:justify-center gap-4 sm:gap-8 px-2 bg-white rounded overflow-x-auto w-full max-w-full scrollbar-hide">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="flex flex-row sm:flex-col items-center min-w-[80px] sm:min-w-[64px] flex-shrink-0 gap-2 sm:gap-0 animate-pulse"
            >
              <div className="w-8 h-8 sm:w-20 sm:h-20 bg-gray-200 rounded"></div>
              <div className="block sm:hidden w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null; // Don't show anything if no categories
  }

  return (
    <div className="shadow-md sm:shadow-none flex h-14 sm:h-36 sticky top-[80px] sm:static z-40">
      <div
        ref={containerRef}
        className="flex justify-start lg:justify-center gap-4 sm:gap-8  px-2 bg-white rounded overflow-x-auto w-full max-w-full scrollbar-hide"
      >
        {categories.map((item, idx) => {
          const isSelected = String(item.id) === String(selectedCategoryId);
          return (
            <Link
              key={item.id}
              ref={(el) => (linkRefs.current[idx] = el)}
              to={`/category/${item.id}`}
              className={`flex flex-row sm:flex-col items-center min-w-[80px] sm:min-w-[64px] flex-shrink-0 gap-2 sm:gap-0
                ${isSelected ? "border-b-4 border-[#ec1b45]   sm:border-[#ec1b45]" : ""}
                ${isSelected ? "sm:pb-1" : ""}
              `}
              style={{
                borderBottom: isSelected && window.innerWidth < 640 ? "4px solid #1f2937" : undefined,
              }}
            >
              {/* Category images: 684×684 pixels (1:1 ratio) */}
              <div className="relative sm:w-20 sm:h-20">
                <div className="w-8 h-8 sm:w-full sm:h-full aspect-square overflow-hidden border border-gray-200 shadow-sm bg-gray-50 rounded">
                <img
                  src={item.img}
                  alt={item.name}
                    className="w-full h-full object-cover"
                />
                </div>

                {/* Label on sm+ screens: positioned over image */}
                <div className="hidden sm:block absolute bottom--1 left-0 w-full  text-center text-gray-800 text-[8px] sm:text-[12px] font-semibold py-0.5 rounded-b">
                  {item.name}
                </div>
              </div>

              {/* Label on xs screens: right side of image */}
              <div className="block sm:hidden text-[12px] font-bold text-gray-700 ">
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HeaderCategory;
