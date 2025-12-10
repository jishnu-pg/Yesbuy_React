import { useEffect, useState } from "react";
import { getAllProductsList } from "../services/api/product";
import ProductCard from "./ProductCard";
import LoaderSpinner from "./LoaderSpinner";
import { showError } from "../utils/toast";

const YBProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        total_pages: 1,
        current_page: 1,
    });

    useEffect(() => {
        fetchProducts(1);
    }, []);

    const fetchProducts = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await getAllProductsList(page);

            if (response.results && Array.isArray(response.results)) {
                const mappedProducts = response.results.map(product => {
                    const mapped = { ...product };
                    if (product.discount_price) {
                        mapped.has_offer = product.discount_price.has_offer;
                        mapped.discountPercentage = product.discount_price.percentage;
                        mapped.discount_text = product.discount_price.discount_text;

                        if (product.discount_price.has_offer) {
                            mapped.price = product.discount_price.discounted_price;
                            mapped.originalPrice = product.discount_price.base_price;
                        }
                    }
                    return mapped;
                });

                // Calculate total pages assuming default page size of 20 or deriving from first page count
                // A safer bet without PAGE_SIZE in API is using the count. 
                // However, without knowing explicit page size, we can only trust 'next' and 'previous' for navigation,
                // or we infer it if we assume the first page is full. 
                // Let's rely on simple prev/next logic but try to display page numbers if possible.
                // For now, let's just use 10 as an estimated page size if not provided, or better yet,
                // if we don't have page size, simple Prev/Next is best.
                // But the user asked for "pagination", implying page numbers usually.
                // Let's assume standard page size of 10 for now if we want to show numbers, 
                // but checking `results.length` on page 1 is a good heuristic.

                const pageSize = 20; // Default guess, but let's just use next/prev for safety or update dynamically
                const count = response.count || 0;
                // We'll calculate total pages if we can, otherwise just assume based on count
                const totalPages = Math.ceil(count / pageSize) || 1;

                setProducts(mappedProducts);
                setPagination({
                    count: count,
                    next: response.next,
                    previous: response.previous,
                    total_pages: Math.ceil(response.count / 20), // estimating 20 items per page based on standard DRF
                    current_page: page,
                });
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Failed to fetch YB products:", error);
            showError("Failed to load products. Please try again.");
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        fetchProducts(newPage);
        // Scroll to top of the section
        const element = document.getElementById("yb-products-section");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    if (isLoading && pagination.current_page === 1) {
        return (
            <div className="px-2 sm:px-4 py-4 sm:py-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold text-gray-800 mt-4 sm:mt-6 md:mt-10 mb-4 sm:mb-6 md:mb-10 tracking-tight">
                    YB <span className="text-[#ec1b45]">Products</span>
                </h1>
                <LoaderSpinner label="Loading products..." />
            </div>
        );
    }

    return (
        <div id="yb-products-section" className="px-2 sm:px-4 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold text-gray-800 mt-4 sm:mt-6 md:mt-10 mb-4 sm:mb-6 md:mb-10 tracking-tight">
                YB <span className="text-[#ec1b45]">Products</span>
            </h1>

            {products.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {products.map((product) => (
                            <div key={product.product_id || product.id} className="h-full">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center mt-8 gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={!pagination.previous}
                            className={`px-4 py-2 rounded-lg border ${!pagination.previous
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                    : "bg-white text-gray-700 hover:bg-[#ec1b45] hover:text-white border-gray-300 transition-colors"
                                }`}
                        >
                            Previous
                        </button>

                        <span className="px-4 py-2 text-gray-600 font-medium">
                            Page {pagination.current_page}
                        </span>

                        <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={!pagination.next}
                            className={`px-4 py-2 rounded-lg border ${!pagination.next
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                    : "bg-white text-gray-700 hover:bg-[#ec1b45] hover:text-white border-gray-300 transition-colors"
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No products found.
                </div>
            )}
        </div>
    );
};

export default YBProducts;
