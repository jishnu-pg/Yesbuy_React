import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getAllCategories } from "../services/api/category";

const HeaderCategoryText = () => {
  const linkRefs = useRef([]);
  const navRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCategories();
        // Store full category objects with ID
        const categoryObjects = response.results.map((category) => ({
          id: category.id,
          name: category.name,
        }));
        setCategories(categoryObjects);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // GSAP animations - run when categories are loaded
  useEffect(() => {
    if (categories.length === 0 || isLoading) return;

    // Set initial state for nav (fade + move up)
    gsap.set(navRef.current, {
      y: -50,
      opacity: 0,
    });

    // Set initial state for each link (fade + move up)
    gsap.set(linkRefs.current, {
      y: -15,
      opacity: 0,
    });

    // Animate nav bar in from top
    gsap.to(navRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });

    // Animate links one-by-one in from top
    gsap.to(linkRefs.current, {
      y: 0,
      opacity: 1,
      stagger: 0.07,
      duration: 0.6,
      ease: "power1.out",
      delay: 0.2,
    });
  }, [categories, isLoading]);

  const location = useLocation();
  const currentPath = location.pathname;

  // Get the selected category ID from the URL
  const selectedCategoryId = currentPath.startsWith("/category/")
    ? currentPath.split("/category/")[1]?.split("/")[0] // Get category ID
    : null;

  // Don't render if loading or no categories
  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <nav 
      ref={navRef}
      className="hidden sticky top-[72px] z-55 w-full md:flex justify-center bg-white px-2 py-1 shadow"
      style={{ opacity: 0, transform: 'translateY(-50px)' }}
    >
      <div className="flex gap-6 whitespace-nowrap max-w-full">
        {categories.map((category, index) => {
          const isSelected = String(category.id) === String(selectedCategoryId);
          
          return (
          <Link
              key={category.id}
            ref={(el) => (linkRefs.current[index] = el)}
              to={`/category/${category.id}`}
            className={`text-sm font-semibold transition-colors px-1 py-0.5 rounded flex-shrink-0 ${
                isSelected
                ? "text-[#ec1b45]"
                : "text-gray-700 hover:text-[#ec1b45]"
            }`}
            style={{ opacity: 0, transform: 'translateY(-15px)' }}
          >
              {category.name}
          </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default HeaderCategoryText;
