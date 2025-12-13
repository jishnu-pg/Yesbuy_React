import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductDetailShimmer from "../Pages/ProductDetailShimmer ";
import { ToastContext } from "../App";
import { getProductVariantsById, getProductsBySubcategoryId } from "../services/api/product";
import { addToCart as addToCartAPI, getCart } from "../services/api/cart";
import { createToggleFavorite } from "../services/api/wishlist";
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from "../features/wishlist/wishlistSlice";
import { showError, showSuccess } from "../utils/toast";

// Import components
import ProductImageGallery from "../components/ProductDetail/ProductImageGallery";
import ProductInfo from "../components/ProductDetail/ProductInfo";
import ProductVariants from "../components/ProductDetail/ProductVariants";
import ProductQuantitySelector from "../components/ProductDetail/ProductQuantitySelector";
import ProductStockInfo from "../components/ProductDetail/ProductStockInfo";
import ProductActions from "../components/ProductDetail/ProductActions";
import ProductPolicies from "../components/ProductDetail/ProductPolicies";
import SizeChartSlider from "../components/ProductDetail/SizeChartSlider";
import SimilarProducts from "../components/ProductDetail/SimilarProducts";
import BOGOPopup from "../components/ProductDetail/BOGOPopup";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFreeProduct = searchParams.get('isFreeProduct') === 'true';
  const [productData, setProductData] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColorVariant, setSelectedColorVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [imagesInitialized, setImagesInitialized] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [meter, setMeter] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToFavorite, setIsAddingToFavorite] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Similar products state
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoadingSimilarProducts, setIsLoadingSimilarProducts] = useState(false);

  // BOGO popup state
  const [showBOGOPopup, setShowBOGOPopup] = useState(false);
  const [bogoFreeProducts, setBogoFreeProducts] = useState([]);
  const [bogoDiscountText, setBogoDiscountText] = useState("");

  const { showCartToast } = useContext(ToastContext);
  const dispatch = useDispatch();

  // Get product ID for Redux selector - use product_id from API if available, otherwise use id from URL
  const productId = productData?.product?.product_id || parseInt(id) || id;

  // Sync with Redux state to check if product is in wishlist
  const reduxIsInWishlist = useSelector((state) => {
    if (!productId) return false;
    // Check with both number and string versions to handle type mismatches
    const numId = typeof productId === 'string' ? parseInt(productId) : productId;
    const strId = String(productId);
    return selectIsInWishlist(state, productId) ||
      (numId && selectIsInWishlist(state, numId)) ||
      selectIsInWishlist(state, strId);
  });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await getProductVariantsById(id);

        if (response.status && response.data) {
          setProductData(response.data);
          setVariants(response.data.variants || []);

          // Set favorite status from product data (will be synced with Redux in useEffect)
          const initialFavorite = response.data.product?.is_favourite || response.data.product?.isFavourite || false;
          setIsFavorite(initialFavorite);

          // Check if product is running_material type
          const isRunningMaterial = response.data.product?.size_type === 'running_material' ||
            response.data.product?.size_type === 'runningmaterial';

          // Select initial variant and size - always calculate lowest price ourselves
          if (response.data.variants && response.data.variants.length > 0) {
            // Helper function to get the effective price of a variant
            const getVariantPrice = (variant) => {
              if (variant.discount_price?.has_offer && variant.discount_price?.discounted_price) {
                return parseFloat(variant.discount_price.discounted_price);
              }
              return parseFloat(variant.total_price || variant.price || 0);
            };
            
            // Check if all sizes have the same price
            const allPricesAreSame = (() => {
              const firstVariant = response.data.variants[0];
              if (!firstVariant || !firstVariant.data || firstVariant.data.length === 0) {
                return false;
              }
              
              const firstPrice = getVariantPrice(firstVariant.data[0]);
              
              // Check if all variants across all colors have the same price
              for (const colorVariant of response.data.variants) {
                if (!colorVariant.data || colorVariant.data.length === 0) continue;
                
                for (const sizeVariant of colorVariant.data) {
                  const variantPrice = getVariantPrice(sizeVariant);
                  if (Math.abs(variantPrice - firstPrice) > 0.01) { // Allow small floating point differences
                    return false;
                  }
                }
              }
              
              return true;
            })();
            
            // Calculate the lowest price from all variants (ignore API's lowest_price_variant_id)
            let calculatedLowestPrice = Infinity;
            for (const colorVariant of response.data.variants) {
              if (colorVariant.data && colorVariant.data.length > 0) {
                for (const sizeVariant of colorVariant.data) {
                  const variantPrice = getVariantPrice(sizeVariant);
                  if (variantPrice < calculatedLowestPrice) {
                    calculatedLowestPrice = variantPrice;
                  }
                }
              }
            }
            
            // Debug logging (can be removed after confirming)
            if (process.env.NODE_ENV === 'development') {
              console.log('=== VARIANT SELECTION DEBUG ===');
              console.log('All prices are same:', allPricesAreSame);
              console.log('Calculated lowest price:', calculatedLowestPrice);
              
              // Log all variant prices for debugging
              const allVariantsWithPrices = [];
              for (const colorVariant of response.data.variants) {
                if (colorVariant.data && colorVariant.data.length > 0) {
                  for (const sizeVariant of colorVariant.data) {
                    const price = getVariantPrice(sizeVariant);
                    allVariantsWithPrices.push({
                      variantId: sizeVariant.id,
                      size: sizeVariant.size,
                      color: colorVariant.name || colorVariant.data[0]?.color,
                      price: price,
                      isLowestPrice: Math.abs(price - calculatedLowestPrice) < 0.01
                    });
                  }
                }
              }
              
              // Sort by price to find lowest
              allVariantsWithPrices.sort((a, b) => a.price - b.price);
              const variantsWithLowestPrice = allVariantsWithPrices.filter(v => Math.abs(v.price - calculatedLowestPrice) < 0.01);
              
              console.log('All variants with prices:', allVariantsWithPrices);
              console.log('Variants with lowest price:', variantsWithLowestPrice);
              console.log('First variant with lowest price (should be selected):', variantsWithLowestPrice[0]);
            }
            
            let selectedColorVariantToSet = response.data.variants[0]; // Default: first color variant
            let selectedVariantToSet = null;
            let selectedSizeToSet = null;

            // For non-running_material products
            if (!isRunningMaterial) {
              // If all prices are the same, use first available size
              if (allPricesAreSame) {
                const firstVariant = response.data.variants[0];
                if (firstVariant.available_sizes && firstVariant.available_sizes.length > 0) {
                  const firstAvailableSize = firstVariant.available_sizes.find(
                    (size) => size.available_count > 0
                  ) || firstVariant.available_sizes[0];
                  
                  selectedSizeToSet = firstAvailableSize.size;
                  selectedVariantToSet = firstVariant.data?.find(
                    (v) => v.size === firstAvailableSize.size
                  ) || firstVariant.data?.[0];
                } else if (firstVariant.data && firstVariant.data.length > 0) {
                  selectedSizeToSet = firstVariant.data[0].size;
                  selectedVariantToSet = firstVariant.data[0];
                }
              } else {
                // Prices differ - find the FIRST variant (in order) that has the lowest price
                // Go through variants in order and select the first one with lowest price
                for (const colorVariant of response.data.variants) {
                  if (selectedSizeToSet) break; // Already found, exit
                  
                  // Check available_sizes array first (matches UI order)
                  if (colorVariant.available_sizes && colorVariant.available_sizes.length > 0) {
                    for (const sizeInfo of colorVariant.available_sizes) {
                      // Find the variant data for this size
                      const variantForSize = colorVariant.data?.find(v => v.size === sizeInfo.size);
                      if (variantForSize) {
                        const variantPrice = getVariantPrice(variantForSize);
                        // Check if this variant has the lowest price and is available
                        if (Math.abs(variantPrice - calculatedLowestPrice) < 0.01 && sizeInfo.available_count > 0) {
                          selectedColorVariantToSet = colorVariant;
                          selectedSizeToSet = sizeInfo.size;
                          selectedVariantToSet = variantForSize;
                          
                          if (process.env.NODE_ENV === 'development') {
                            console.log('✓ Found FIRST variant with lowest price in available_sizes:', sizeInfo.size, 'variant ID:', variantForSize.id, 'price:', variantPrice);
                            console.log('Selected color variant:', colorVariant.name || colorVariant.data[0]?.color);
                          }
                          break;
                        }
                      }
                    }
                  } else {
                    // Fallback: check data array directly if available_sizes doesn't exist
                    if (colorVariant.data && colorVariant.data.length > 0) {
                      for (const sizeVariant of colorVariant.data) {
                        const variantPrice = getVariantPrice(sizeVariant);
                        // Check if this variant has the lowest price
                        if (Math.abs(variantPrice - calculatedLowestPrice) < 0.01) {
                          selectedColorVariantToSet = colorVariant;
                          selectedSizeToSet = sizeVariant.size;
                          selectedVariantToSet = sizeVariant;
                          
                          if (process.env.NODE_ENV === 'development') {
                            console.log('✓ Found FIRST variant with lowest price in data array:', sizeVariant.size, 'variant ID:', sizeVariant.id, 'price:', variantPrice);
                            console.log('Selected color variant:', colorVariant.name || colorVariant.data[0]?.color);
                          }
                          break;
                        }
                      }
                    }
                  }
                }
                
                // If lowest price variant not found (shouldn't happen, but fallback just in case)
                if (!selectedSizeToSet) {
                  const firstVariant = response.data.variants[0];
                  if (firstVariant.available_sizes && firstVariant.available_sizes.length > 0) {
                    const firstAvailableSize = firstVariant.available_sizes.find(
                      (size) => size.available_count > 0
                    ) || firstVariant.available_sizes[0];
                    
                    selectedSizeToSet = firstAvailableSize.size;
                    selectedVariantToSet = firstVariant.data?.find(
                      (v) => v.size === firstAvailableSize.size
                    ) || firstVariant.data?.[0];
                  } else if (firstVariant.data && firstVariant.data.length > 0) {
                    selectedSizeToSet = firstVariant.data[0].size;
                    selectedVariantToSet = firstVariant.data[0];
                  }
                }
              }
            } else if (isRunningMaterial) {
              // For running_material, just select first variant
              if (selectedColorVariantToSet.data && selectedColorVariantToSet.data.length > 0) {
                selectedVariantToSet = selectedColorVariantToSet.data[0];
              }
            }

            // Final debug logging before setting state
            if (process.env.NODE_ENV === 'development') {
              console.log('=== FINAL SELECTION ===');
              console.log('Selected Color Variant:', selectedColorVariantToSet?.name || selectedColorVariantToSet?.data?.[0]?.color);
              console.log('Selected Size:', selectedSizeToSet);
              console.log('Selected Variant ID:', selectedVariantToSet?.id);
              console.log('Selected Variant Price:', selectedVariantToSet ? getVariantPrice(selectedVariantToSet) : 'N/A');
              console.log('========================');
            }

            // Set selected size and variant BEFORE setting color variant to avoid useEffect race condition
            // This ensures the size is set before the color-change useEffect runs
            if (!isRunningMaterial && selectedSizeToSet) {
              setSelectedSize(selectedSizeToSet);
            }
            if (selectedVariantToSet) {
              setSelectedVariant(selectedVariantToSet);
            }

            // Set the selected color variant (this will trigger useEffect, but size is already set)
            setSelectedColorVariant(selectedColorVariantToSet);

            // For running_material, initialize meter to minimum_meter
            if (isRunningMaterial && selectedVariantToSet) {
              const minMeter = parseFloat(
                response.data.product.minimum_meter || 
                selectedVariantToSet.minimum_meter || 
                0
              );
              setMeter(minMeter > 0 ? minMeter : 0);
            }

            // Set images from selected variant
            let images = [];
            if (selectedVariantToSet?.variant_images && selectedVariantToSet.variant_images.length > 0) {
              images = [...selectedVariantToSet.variant_images];
            }
            setCurrentImages(images);
          } else {
            // Match mobile app: Only use variant_images (no fallback)
            // If no variants exist, show empty array (mobile shows nothing)
            let images = [];
            setCurrentImages(images);
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        showError("Failed to load product details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Sync favorite state with Redux state (updates when wishlist changes from other pages)
  useEffect(() => {
    if (productId && reduxIsInWishlist !== undefined) {
      // Redux state is the source of truth - sync local state with it
      setIsFavorite(reduxIsInWishlist);
    }
  }, [reduxIsInWishlist, productId]);

  // Fetch similar products when product data is loaded
  useEffect(() => {
    if (productData?.product) {
      fetchSimilarProducts();
    }
  }, [productData, id]);

  const fetchSimilarProducts = async () => {
    try {
      setIsLoadingSimilarProducts(true);
      const product = productData.product;

      // Get subcategory_id from product - check multiple possible field names
      const subcategoryId = product.sub_category ||
        product.sub_category_id ||
        product.subcategory_id ||
        product.sub_category?.id ||
        product.subcategory?.id;

      if (!subcategoryId) {
        console.log("No subcategory_id found in product:", product);
        setSimilarProducts([]);
        return;
      }

      // Fetch products by subcategory using API
      const response = await getProductsBySubcategoryId(subcategoryId);

      if (response && response.results && Array.isArray(response.results) && response.results.length > 0) {
        // Filter out the current product and map to ProductCard format
        const currentProductId = parseInt(id);
        const mappedProducts = response.results
          .filter((p) => {
            const productId = p.product_id || p.id;
            return productId && parseInt(productId) !== currentProductId;
          })
          .slice(0, 8)
          .map((product) => ({
            id: product.product_id || product.id,
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
            brand: product.brand_name || null,
            brand_name: product.brand_name || null,
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

        setSimilarProducts(mappedProducts);
      } else {
        setSimilarProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch similar products:", error);
      showError("Failed to load similar products. Please try again.");
      setSimilarProducts([]);
    } finally {
      setIsLoadingSimilarProducts(false);
    }
  };

  // Update images and variant when color changes
  useEffect(() => {
    if (selectedColorVariant && selectedColorVariant.data && selectedColorVariant.data.length > 0) {
      const isRunningMaterial = productData?.product?.size_type === 'running_material' ||
        productData?.product?.size_type === 'runningmaterial';

      if (!isRunningMaterial) {
        // Helper function to get the effective price of a variant
        const getVariantPrice = (variant) => {
          if (variant.discount_price?.has_offer && variant.discount_price?.discounted_price) {
            return parseFloat(variant.discount_price.discounted_price);
          }
          return parseFloat(variant.total_price || variant.price || 0);
        };

        // Calculate the lowest price for this specific color variant
        let lowestPriceForColor = Infinity;
        for (const sizeVariant of selectedColorVariant.data || []) {
          const variantPrice = getVariantPrice(sizeVariant);
          if (variantPrice < lowestPriceForColor) {
            lowestPriceForColor = variantPrice;
          }
        }

        // Find the FIRST size with the lowest price for this color variant
        let sizeToUse = null;
        
        if (selectedColorVariant.available_sizes && selectedColorVariant.available_sizes.length > 0) {
          // Check available_sizes in order to find first one with lowest price
          for (const sizeInfo of selectedColorVariant.available_sizes) {
            if (sizeInfo.available_count > 0) {
              // Find the variant data for this size
              const variantForSize = selectedColorVariant.data?.find(v => v.size === sizeInfo.size);
              if (variantForSize) {
                const variantPrice = getVariantPrice(variantForSize);
                // Check if this variant has the lowest price for this color
                if (Math.abs(variantPrice - lowestPriceForColor) < 0.01) {
                  sizeToUse = sizeInfo.size;
                  break;
                }
              }
            }
          }
          
          // If no size with lowest price found (shouldn't happen), use first available
          if (!sizeToUse) {
            const firstAvailableWithStock = selectedColorVariant.available_sizes.find(
              (size) => size.available_count > 0
            );
            sizeToUse = firstAvailableWithStock 
              ? firstAvailableWithStock.size 
              : selectedColorVariant.available_sizes[0].size;
          }
        } else {
          // Fallback: check data array directly if available_sizes doesn't exist
          for (const sizeVariant of selectedColorVariant.data) {
            const variantPrice = getVariantPrice(sizeVariant);
            if (Math.abs(variantPrice - lowestPriceForColor) < 0.01) {
              sizeToUse = sizeVariant.size;
              break;
            }
          }
          
          // If still no size found, use first one
          if (!sizeToUse && selectedColorVariant.data.length > 0) {
            sizeToUse = selectedColorVariant.data[0].size;
          }
        }
        
        setSelectedSize(sizeToUse);
        
        // Find the matching variant from data array
        const matchingSizeVariant = selectedColorVariant.data.find(
          (v) => v.size === sizeToUse
        ) || selectedColorVariant.data[0];
        setSelectedVariant(matchingSizeVariant);

        // Use the matching variant for images
        let images = [];
        if (matchingSizeVariant?.variant_images && matchingSizeVariant.variant_images.length > 0) {
          images = [...matchingSizeVariant.variant_images];
        }
        setCurrentImages(images);
      } else {
        const firstVariant = selectedColorVariant.data[0];
        setSelectedVariant(firstVariant);
        
        if (isRunningMaterial) {
          const minMeter = parseFloat(productData?.product?.minimum_meter || firstVariant.minimum_meter || 0);
          setMeter(minMeter > 0 ? minMeter : 0);
        }

        // Match mobile app: Only use variant_images (no fallback to additional_images or main_image)
        // Mobile uses: controller.selectedVariantImages which is variantImages array from selected variant
        let images = [];
        if (firstVariant.variant_images && firstVariant.variant_images.length > 0) {
          images = [...firstVariant.variant_images];
        }
        setCurrentImages(images);
      }

      setMainImageIndex(0);
    }
  }, [selectedColorVariant, productData]);

  // Update variant when size changes (only for non-running_material products)
  useEffect(() => {
    const isRunningMaterial = productData?.product?.size_type === 'running_material' ||
      productData?.product?.size_type === 'runningmaterial';

    if (isRunningMaterial) {
      return;
    }

    if (selectedColorVariant && selectedSize) {
      const sizeVariant = selectedColorVariant.data.find(
        (v) => v.size === selectedSize
      );
      if (sizeVariant) {
        setSelectedVariant(sizeVariant);
        setQuantity(1);

        // Match mobile app: Only use variant_images (no fallback)
        let images = [];
        if (sizeVariant.variant_images && sizeVariant.variant_images.length > 0) {
          images = [...sizeVariant.variant_images];
        }
        // Note: Mobile app doesn't fallback to additional_images or main_image

        setCurrentImages(images);
        setMainImageIndex(0);
      }
    }
  }, [selectedSize, selectedColorVariant, productData]);

  // Get cart ID from API instead of localStorage
  const getCartId = async () => {
    try {
      const response = await getCart();
      if (response.status && response.data?.cart_id) {
        return response.data.cart_id;
      }
      return '0'; // Return '0' for new cart
    } catch (error) {
      console.error("Failed to fetch cart ID:", error);
      return '0'; // Return '0' if API fails
    }
  };

  // Determine size type
  const getSizeType = () => {
    let sizeType = productData?.product?.size_type || selectedVariant?.size_type || 'others';
    if (sizeType === 'runningmaterial' || sizeType === 'running_material') {
      sizeType = 'running_material';
    } else if (sizeType === 'clothingsize' || sizeType === 'clothing_size') {
      sizeType = 'clothing_size';
    } else if (!['running_material', 'clothing_size', 'others'].includes(sizeType)) {
      if (productData?.product?.minimum_meter || selectedVariant?.minimum_meter) {
        sizeType = 'running_material';
      } else {
        sizeType = 'clothing_size';
      }
    }
    return sizeType;
  };

  // Validate and prepare cart data
  const prepareCartData = () => {
    const isRunningMaterial = productData?.product?.size_type === 'running_material' ||
      productData?.product?.size_type === 'runningmaterial';

    if (!selectedVariant) {
      if (isRunningMaterial) {
        showError("Please select a color");
      } else {
        showError("Please select a size");
      }
      return null;
    }

    const sizeType = getSizeType();

    // Validate based on size_type
    if (sizeType === 'running_material') {
      if (!meter || parseFloat(meter) <= 0) {
        showError("Please enter a valid meter value");
        return null;
      }
      if (selectedVariant.minimum_meter && parseFloat(meter) < parseFloat(selectedVariant.minimum_meter)) {
        showError(`Meter must be at least ${selectedVariant.minimum_meter}`);
        return null;
      }
      if (selectedVariant.maximum_meter && parseFloat(meter) > parseFloat(selectedVariant.maximum_meter)) {
        showError(`Meter cannot exceed ${selectedVariant.maximum_meter}`);
        return null;
      }
    } else {
      if (!quantity || quantity <= 0) {
        showError("Please enter a valid quantity");
        return null;
      }
      if (selectedVariant.quantity && quantity > selectedVariant.quantity) {
        showError(`Quantity cannot exceed available stock (${selectedVariant.quantity})`);
        return null;
      }
    }

    const cartItemData = {
      product_id: productData.product.product_id,
      product_variant_id: selectedVariant.id,
      size_type: sizeType,
      color_name: selectedColorVariant?.name || selectedVariant?.color || null,
    };

    if (sizeType === 'running_material') {
      cartItemData.meter = parseFloat(meter);
    } else {
      cartItemData.size = selectedSize;
      cartItemData.quantity = quantity;
    }

    return cartItemData;
  };

  const handleAddToCart = async () => {
    const cartItemData = prepareCartData();
    if (!cartItemData) return;

    try {
      setIsAddingToCart(true);
      const cartId = await getCartId();
      const response = await addToCartAPI(cartId, cartItemData);

      if (response.status) {
        window.dispatchEvent(new Event('cartUpdated'));
        showCartToast();

        // Check for BOGO offer and show popup (but skip if this is a free product from BOGO offer)
        if (!isFreeProduct &&
          selectedVariant?.discount_price?.is_bogo &&
          selectedVariant?.discount_price?.products &&
          selectedVariant.discount_price.products.length > 0) {
          setBogoFreeProducts(selectedVariant.discount_price.products);
          setBogoDiscountText(selectedVariant.discount_price.discount_text || "Buy 1 Get 1");
          setShowBOGOPopup(true);
        }
      } else {
        showError(response.message || "Failed to add product to cart");
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      showError("Failed to add product to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToFavorite = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    if (!token) {
      showError("Please login to add favorites");
      return;
    }

    if (!productData?.product?.product_id) {
      showError("Product information not available");
      return;
    }

    const productId = productData.product.product_id;
    // Use Redux state as source of truth (combines with local state for accuracy)
    const wasFavorite = reduxIsInWishlist || isFavorite;

    try {
      setIsAddingToFavorite(true);

      // Optimistically update UI
      setIsFavorite(!wasFavorite);

      // Call API to toggle favorite
      await createToggleFavorite(productId);

      // Update Redux state
      if (wasFavorite) {
        dispatch(removeFromWishlist(productId));
        showSuccess("Removed from favorites");
      } else {
        // Add product to wishlist with minimal product data
        const wishlistProduct = {
          id: productId,
          product_id: productId,
          name: productData.product.name,
          price: productData.product.price,
          main_image: productData.product.main_image,
          brand_name: productData.product.brand_name,
        };
        dispatch(addToWishlist(wishlistProduct));
        showSuccess("Added to favorites");
      }

      // Dispatch event to update wishlist count in header
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorite(wasFavorite);
      console.error("Failed to toggle favorite:", error);
      showError(error.message || "Failed to update favorite. Please try again.");
    } finally {
      setIsAddingToFavorite(false);
    }
  };

  // Prepare images for thumbnail gallery - memoized to prevent hooks issues
  // Must be called before early return to follow Rules of Hooks
  const product = productData?.product;
  const sizeChartImage = useMemo(() => {
    if (!product?.size_chart || product.size_chart.length === 0) {
      return null;
    }
    return product.size_chart[0].measurement_image;
  }, [product?.size_chart]);

  const allThumbnailImages = useMemo(() => {
    if (!sizeChartImage) {
      return currentImages;
    }
    return [...currentImages, sizeChartImage];
  }, [currentImages, sizeChartImage]);

  const allImagesForMainDisplay = useMemo(() => {
    if (!sizeChartImage) {
      return currentImages;
    }
    return [...currentImages, sizeChartImage];
  }, [currentImages, sizeChartImage]);

  // Match mobile app: Use images from array or empty string (mobile shows nothing if no images)
  const mainImage = allImagesForMainDisplay[mainImageIndex] || '';

  // Pause auto-scroll when user manually selects an image
  const handleImageSelect = (index) => {
    setMainImageIndex(index);
    setIsAutoScrollPaused(true);
    // Resume auto-scroll after 5 seconds of no interaction
    setTimeout(() => {
      setIsAutoScrollPaused(false);
    }, 5000);
  };

  // Reset image index to 0 when images are first loaded
  useEffect(() => {
    if (currentImages.length > 0 && !imagesInitialized) {
      setMainImageIndex(0);
      setImagesInitialized(true);
    } else if (currentImages.length === 0) {
      setImagesInitialized(false);
    }
  }, [currentImages.length, imagesInitialized]);

  const [isZooming, setIsZooming] = useState(false);

  // ... (existing helper functions)

  // Auto-scroll through images (including size chart)
  useEffect(() => {
    const totalImages = allImagesForMainDisplay.length;
    if (totalImages <= 1 || isAutoScrollPaused || isZooming || isLoading || !imagesInitialized) {
      return; // Don't auto-scroll if zooming, paused, loading, etc.
    }

    let interval = null;

    // Wait a bit before starting auto-scroll to ensure images are loaded and displayed
    const startDelay = setTimeout(() => {
      interval = setInterval(() => {
        setMainImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % totalImages;
          return nextIndex;
        });
      }, 3000); // Change image every 3 seconds
    }, 2000); // Start auto-scroll after 2 second delay to ensure first image is displayed

    return () => {
      clearTimeout(startDelay);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [allImagesForMainDisplay.length, isAutoScrollPaused, isZooming, isLoading, imagesInitialized]);

  // Early return AFTER all hooks
  if (isLoading || !productData) {
    return <ProductDetailShimmer />;
  }

  const isRunningMaterial = product?.size_type === 'running_material' || product?.size_type === 'runningmaterial';

  // Price calculations
  const currentPrice = selectedVariant?.discount_price?.has_offer
    ? selectedVariant.discount_price.discounted_price
    : selectedVariant?.total_price || product.price;
  const originalPrice = selectedVariant?.discount_price?.base_price || selectedVariant?.total_price || product.price;
  const discountPercentage = selectedVariant?.discount_price?.percentage || 0;
  const isBogo = selectedVariant?.discount_price?.is_bogo || false;
  const discountText = selectedVariant?.discount_price?.discount_text || null;
  const hasOffer = selectedVariant?.discount_price?.has_offer || false;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-12">
        {/* Left Side - Image Gallery and Policies */}
        <div className="w-full lg:flex-1 lg:max-w-xl">
          <ProductImageGallery
            mainImage={mainImage}
            allThumbnailImages={allThumbnailImages}
            mainImageIndex={mainImageIndex}
            setMainImageIndex={handleImageSelect}
            productName={selectedColorVariant?.name || product.name}
            sizeChartImage={sizeChartImage}
            onZoomChange={setIsZooming}
          />
          {/* Policies - Desktop only (below image) */}
          <div className="hidden lg:block">
            <ProductPolicies product={product} />
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full lg:flex-1">
          <div className="sticky top-4 space-y-4 sm:space-y-6">
            <ProductInfo
              product={product}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              discountPercentage={discountPercentage}
              isBogo={isBogo}
              discountText={discountText}
              hasOffer={hasOffer}
              selectedVariant={selectedVariant}
              selectedColorVariant={selectedColorVariant}
            />

            <ProductVariants
              variants={variants}
              selectedColorVariant={selectedColorVariant}
              selectedSize={selectedSize}
              selectedVariant={selectedVariant}
              product={product}
              isRunningMaterial={isRunningMaterial}
              onColorSelect={setSelectedColorVariant}
              onSizeSelect={setSelectedSize}
              onSizeChartClick={() => setShowSizeChart(true)}
            />

            <ProductQuantitySelector
              isRunningMaterial={isRunningMaterial}
              product={product}
              selectedVariant={selectedVariant}
              quantity={quantity}
              setQuantity={setQuantity}
              meter={meter}
              setMeter={setMeter}
            />

            <ProductStockInfo
              isRunningMaterial={isRunningMaterial}
              product={product}
              selectedVariant={selectedVariant}
            />

            <ProductActions
              selectedVariant={selectedVariant}
              isAddingToCart={isAddingToCart}
              isAddingToFavorite={isAddingToFavorite}
              isFavorite={isFavorite}
              product={product}
              onAddToCart={handleAddToCart}
              onAddToFavorite={handleAddToFavorite}
              isRunningMaterial={isRunningMaterial}
            />

            {/* Policies - Mobile only (below favorite button) */}
            <div className="lg:hidden">
              <ProductPolicies product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* Size Chart Slider */}
      <SizeChartSlider
        showSizeChart={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        product={product}
        selectedVariant={selectedVariant}
        selectedColorVariant={selectedColorVariant}
        selectedSize={selectedSize}
        isRunningMaterial={isRunningMaterial}
        meter={meter}
        currentPrice={currentPrice}
        originalPrice={originalPrice}
        discountPercentage={discountPercentage}
        isBogo={isBogo}
        discountText={discountText}
        hasOffer={hasOffer}
      />

      {/* Similar Products */}
      <SimilarProducts
        similarProducts={similarProducts}
        isLoadingSimilarProducts={isLoadingSimilarProducts}
      />

      {/* BOGO Popup */}
      <BOGOPopup
        isOpen={showBOGOPopup}
        onClose={() => setShowBOGOPopup(false)}
        freeProducts={bogoFreeProducts}
        discountText={bogoDiscountText}
      />
    </div>
  );
};

export default ProductDetail;
