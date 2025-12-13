import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getFilters, getSortOptions, sortFilterProductsList, getProductsBySubcategoryId } from "../services/api/product";
import ProductCard from "../components/ProductCard";
import AccordionPM from "../components/AccordionPM";
import FilterCheckbox from "../components/FilterCheckbox";
import LoaderSpinner from "../components/LoaderSpinner";
import { showError } from "../utils/toast";

const ProductListWithFilters = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const subcategoryId = searchParams.get("subcategory");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  
  // Filter options from API
  const [filters, setFilters] = useState({
    brand: [],
    size: [],
    category: [],
    color: [],
    fit: [],
    material: [],
  });
  
  // Sort options from API
  const [sortOptions, setSortOptions] = useState([]);
  
  // Selected filters
  const [selectedFilters, setSelectedFilters] = useState({
    brand: [],
    size: [],
    category: [],
    color: [],
    fit: [],
    material: [],
  });
  
  // Selected sort option
  const [selectedSort, setSelectedSort] = useState("");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    brand: false,
    size: false,
    category: false,
    color: false,
    fit: false,
    material: false,
  });

  // Fetch filters and sort options on mount
  useEffect(() => {
    fetchFiltersAndSortOptions();
  }, []);

  // Fetch products when filters, sort, category, or subcategory changes
  useEffect(() => {
    if (categoryId || subcategoryId) {
      fetchFilteredProducts();
    }
  }, [categoryId, subcategoryId, selectedFilters, selectedSort]);

  const fetchFiltersAndSortOptions = async () => {
    try {
      setIsLoadingFilters(true);
      const [filtersResponse, sortResponse] = await Promise.all([
        getFilters(),
        getSortOptions(),
      ]);

      // Extract filters from API response
      if (filtersResponse.result && filtersResponse.result.length > 0) {
        const filterData = filtersResponse.result[0];
        setFilters({
          brand: filterData.brand || [],
          size: filterData.size || [],
          category: filterData.category || [],
          color: filterData.color || [],
          fit: filterData.fit || [],
          material: filterData.material || [],
        });
  }

      // Extract sort options from API response
      if (sortResponse.result && sortResponse.result.length > 0) {
        setSortOptions(sortResponse.result);
      }
    } catch (error) {
      console.error("Failed to fetch filters/sort options:", error);
      showError("Failed to load filters. Please try again.");
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchFilteredProducts = async () => {
    try {
      setIsLoading(true);
      
      // Always use sort-filter API to support filters and sorting
      // Build filter parameters
      const filterParams = {};

      // Add category or subcategory ID
      if (subcategoryId) {
        filterParams.sub_category_id = subcategoryId;
      } else if (categoryId) {
        filterParams.category_id = categoryId;
      }

      // Add selected filters - support multiple selections
      // Send all selected IDs as arrays
      if (selectedFilters.brand.length > 0) {
        filterParams.brand = selectedFilters.brand; // Send all selected brands
      }
      if (selectedFilters.size.length > 0) {
        filterParams.size = selectedFilters.size;
  }
      if (selectedFilters.category.length > 0) {
        filterParams.category = selectedFilters.category;
      }
      if (selectedFilters.color.length > 0) {
        filterParams.color = selectedFilters.color;
      }
      if (selectedFilters.fit.length > 0) {
        filterParams.fit = selectedFilters.fit;
      }
      if (selectedFilters.material.length > 0) {
        filterParams.material = selectedFilters.material;
      }
      if (selectedSort) {
        filterParams.sort = selectedSort;
      }

      const response = await sortFilterProductsList(filterParams);
      
      // Map API response to component format
      const mappedProducts = (response.results || []).map((product) => ({
        id: product.product_id || product.variant_id,
        product_id: product.product_id,
        variant_id: product.variant_id,
        title: product.name,
        name: product.name,
        price: product.discount_price?.has_offer 
          ? product.discount_price.discounted_price 
          : product.price,
        originalPrice: product.discount_price?.base_price || product.price,
        discountPercentage: product.discount_price?.percentage || 0,
        is_bogo: product.discount_price?.is_bogo || false,
        discount_text: product.discount_price?.discount_text || null,
        has_offer: product.discount_price?.has_offer || false,
        images: [
          { url: product.main_image },
          ...(product.additional_images || []).map(img => ({ 
            url: typeof img === 'string' ? img : img.image || img 
          }))
        ],
        main_image: product.main_image,
        additional_images: product.additional_images || [],
        brand: product.brand_name || null, // Don't fallback to category_name
        brand_name: product.brand_name || null, // Use null if empty string
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
    } catch (error) {
      console.error("Failed to fetch products:", error);
      showError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType, filterId) => {
    setSelectedFilters((prev) => {
      const currentSelection = prev[filterType] || [];
      const isSelected = currentSelection.includes(filterId);
      
      return {
        ...prev,
        [filterType]: isSelected
          ? currentSelection.filter((id) => id !== filterId)
          : [...currentSelection, filterId],
      };
    });
  };

  const handleSortChange = (sortValue) => {
    setSelectedSort(sortValue);
    setIsSortDropdownOpen(false);
  };

  const getSelectedSortName = () => {
    if (!selectedSort) return "Default";
    const selectedOption = sortOptions.find(opt => opt.sort === selectedSort);
    return selectedOption ? selectedOption.name : "Default";
  };

  const toggleAccordion = (filterType) => {
    setAccordionStates((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      brand: [],
      size: [],
      category: [],
      color: [],
      fit: [],
      material: [],
    });
    setSelectedSort("");
  };

  const renderFilterSection = (filterType, filterLabel, filterItems) => {
    if (!filterItems || filterItems.length === 0) return null;

    const selectedItems = selectedFilters[filterType] || [];
    const isOpen = accordionStates[filterType];
    const selectedCount = selectedItems.length;

    return (
      <AccordionPM
        title={
          <div className="flex items-center gap-2">
            <span>{filterLabel}</span>
            {selectedCount > 0 && (
              <span className="bg-[#ec1b45] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {selectedCount}
              </span>
            )}
          </div>
        }
        isOpen={isOpen}
        onToggle={() => toggleAccordion(filterType)}
      >
        <div className="flex flex-col gap-2 pl-4">
          {filterItems.map((item) => {
            const itemId = item.id;
            const itemName = item.name || item.label;
            const isSelected = selectedItems.includes(itemId);

            return (
              <FilterCheckbox
                key={itemId}
                label={itemName}
                checked={isSelected}
                onChange={() => handleFilterChange(filterType, itemId)}
              />
            );
          })}
        </div>
      </AccordionPM>
    );
  };

  return (
    <div className="flex w-full min-h-screen bg-white mt-10">
      {/* Filters Sidebar */}
      <aside className="w-64 p-4 bg-white border-r border-gray-300 overflow-y-auto max-h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Filters</h2>
          {(selectedFilters.brand.length > 0 || 
            selectedFilters.size.length > 0 || 
            selectedFilters.category.length > 0 || 
            selectedFilters.color.length > 0 || 
            selectedFilters.fit.length > 0 || 
            selectedFilters.material.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#ec1b45] hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {isLoadingFilters ? (
          <LoaderSpinner label="Loading filters..." />
        ) : (
          <div>
            {/* Brand Filter */}
            {renderFilterSection("brand", "Brand", filters.brand)}

            {/* Size Filter */}
            {renderFilterSection("size", "Size", filters.size)}

            {/* Category Filter - Commented out */}
            {/* {renderFilterSection("category", "Category", filters.category)} */}

            {/* Color Filter */}
            {renderFilterSection("color", "Color", filters.color)}

            {/* Fit Filter */}
            {renderFilterSection("fit", "Fit", filters.fit)}

            {/* Material Filter */}
            {renderFilterSection("material", "Material", filters.material)}
          </div>
        )}
      </aside>

      {/* Products & Sort */}
      <main className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold capitalize mb-1">
              {products.length > 0 ? products[0].category : "Category"}
            </h1>
            <p className="text-sm text-gray-600">
              Show {products.length} {products.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-[#ec1b45] transition-colors min-w-[180px] justify-between"
            >
              <span className="text-sm font-medium text-gray-700">
                <span className="text-gray-500 mr-2">Sort:</span>
                {getSelectedSortName()}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isSortDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isSortDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSortDropdownOpen(false)}
                />
                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  <button
                    onClick={() => handleSortChange("")}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      !selectedSort
                        ? 'text-[#ec1b45] font-semibold bg-red-50'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Default</span>
                      {!selectedSort && (
                        <svg
                          className="w-4 h-4 text-[#ec1b45]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  {sortOptions.map((option) => (
                    <button
                      key={option.sort}
                      onClick={() => handleSortChange(option.sort)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                        selectedSort === option.sort
                          ? 'text-[#ec1b45] font-semibold bg-red-50'
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.name}</span>
                        {selectedSort === option.sort && (
                          <svg
                            className="w-4 h-4 text-[#ec1b45]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoaderSpinner label="Loading products..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id || product.product_id || product.variant_id} 
                  product={product} 
                />
            ))
          ) : (
              <p className="col-span-full text-center text-gray-500 py-8">
                No products found. Try adjusting your filters.
              </p>
          )}
        </div>
        )}
      </main>
    </div>
  );
};

export default ProductListWithFilters;
