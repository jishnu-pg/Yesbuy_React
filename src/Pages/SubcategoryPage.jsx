import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubcategories } from "../services/api/category";
import Banner from "../components/Banner";
import { Link } from "react-router-dom";
import LoaderSpinner from "../components/LoaderSpinner";
import { showError } from "../utils/toast";

const SubcategoryPage = () => {
  const { categoryId } = useParams();
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories();
    }
  }, [categoryId]);

  const fetchSubcategories = async () => {
    try {
      setIsLoading(true);
      const response = await getSubcategories(categoryId);
      
      if (response.results && response.results.length > 0) {
        const mappedSubcategories = response.results.map((subcat) => ({
          id: subcat.id,
          name: subcat.name,
          category_name: subcat.category_name,
          image: subcat.sub_category_image || "https://via.placeholder.com/300?text=No+Image",
          product_count: subcat.product_count || 0,
        }));
        setSubcategories(mappedSubcategories);
        // Set category name from first subcategory if available
        if (mappedSubcategories[0]?.category_name) {
          setCategoryName(mappedSubcategories[0].category_name);
        }
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
      showError("Failed to load subcategories. Please try again.");
      setSubcategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="w-full px-4 pt-6 sm:pt-8">
        <Banner />
      </div>
      
      <div className="w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
          {categoryName || "Category"}
        </h1>

        {isLoading ? (
          <div className="py-12">
            <LoaderSpinner label="Loading subcategories..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {subcategories.length > 0 ? (
              subcategories.map((subcat) => (
                <Link
                  key={subcat.id}
                  to={`/category/${categoryId}/products?subcategory=${subcat.id}`}
                  className="block bg-white rounded-lg overflow-hidden"
                >
                  <div className="flex flex-col">
                    {/* Image Section - Subcategory images: 684×684 pixels (1:1 ratio) */}
                    <div className="w-full aspect-square flex-shrink-0 overflow-hidden">
                      <img
                        src={subcat.image}
                        alt={subcat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300?text=No+Image";
                        }}
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col justify-center p-3 sm:p-4">
                      <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-1 uppercase line-clamp-2">
                        {subcat.name}
                      </h2>
                      <p className="text-xs text-gray-500 mb-2">
                        {subcat.product_count || 0} {subcat.product_count === 1 ? "Product" : "Products"}
                      </p>
                      <span className="text-xs sm:text-sm text-[#ec1b45] font-medium hover:underline inline-block">
                        Shop Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No subcategories found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcategoryPage;

