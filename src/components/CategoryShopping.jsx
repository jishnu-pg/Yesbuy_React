import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllCategories } from "../services/api/category";
import LoaderSpinner from "./LoaderSpinner";
import { showError } from "../utils/toast";

const CategoryShopping = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCategories();

      if (response.results && response.results.length > 0) {
        const mappedCategories = response.results.map((category) => ({
          id: category.id,
          name: category.name,
          image: category.category_image || "https://via.placeholder.com/300?text=No+Image",
          slug: category.id, // Use category ID as slug for navigation
        }));
        setCategories(mappedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      showError("Failed to load categories. Please try again.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-2 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold text-gray-800 mt-4 sm:mt-6 md:mt-10 mb-4 sm:mb-6 md:mb-10 tracking-tight">
          Shop <span className="text-[#ec1b45]">YB</span> Category
        </h1>
        <LoaderSpinner label="Loading categories..." />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold text-gray-800 mt-4 sm:mt-6 md:mt-10 mb-4 sm:mb-6 md:mb-10 tracking-tight">
        Shop <span className="text-[#ec1b45]">YB</span> Category
      </h1>
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="bg-white flex flex-col items-center justify-center text-lg font-semibold text-gray-700 hover:text-white transition relative overflow-hidden rounded-lg aspect-square"
            >
              {/* Category images: 684×684 pixels (1:1 ratio) */}
              <div className="w-full h-full aspect-square overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top-right"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
              </div>

              {/* Badge Overlay - Bottom aligned with proper text alignment */}
              <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center bg-[#ec1b45]/90 text-white px-2 sm:px-3 py-2 sm:py-2.5 rounded-b-lg">
                <span className="text-sm sm:text-base font-bold text-center leading-tight mb-0.5 sm:mb-1">
                  {cat.name}
                </span>
                <span className="text-xs sm:text-sm font-medium text-center">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No categories found.
        </div>
      )}
    </div>
  );
};

export default CategoryShopping;
