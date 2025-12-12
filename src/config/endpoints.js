// src/config/endpoints.js
// Centralized API endpoints configuration
// All API endpoints should be defined here for easy maintenance and updates

/**
 * API Endpoints
 * 
 * This file contains all API endpoint paths.
 * Base URL is configured in src/config/env.js
 * 
 * Usage:
 * import { endpoints } from '../config/endpoints';
 * const response = await get(endpoints.auth.login);
 */

export const endpoints = {
  // Authentication Endpoints
  auth: {
    // Registration
    createAccount: '/create-new-account/',
    verifyRegistrationOTP: (phoneNumber) => `/create-new-account/${phoneNumber}/`,

    // Login
    requestLoginOTP: (phoneNumber) => `/resend-otp/${phoneNumber}/`,
    verifyLoginOTP: '/otp-login/',

    // Logout (if implemented in future)
    logout: '/logout/',

    // Token Refresh (if implemented in future)
    refreshToken: '/token/refresh/',
  },

  // User Profile Endpoints
  profile: {
    getUserProfile: '/user-profile/',
    updateUserProfile: '/user-profile/',
  },

  // User Address Endpoints
  address: {
    listAddresses: '/user-address/',
    getAddressById: (addressId) => `/user-address/${addressId}/`,
    addAddress: '/user-address/',
    updateAddress: (addressId) => `/user-address/${addressId}/`,
    deleteAddress: (addressId) => `/user-address/${addressId}/`,
    setDefaultAddress: (addressId) => `/user-address/${addressId}/`,
  },

  // FAQ Endpoints
  faq: {
    getFAQs: '/faqs/',
  },

  // Terms & Conditions Endpoints
  terms: {
    getTermsAndConditions: '/terms-and-conditions/',
  },

  // Privacy Policy Endpoints
  privacy: {
    getPrivacyPolicy: '/privacy-policy/',
  },

  // Category Endpoints
  category: {
    getAllCategories: '/list-all-categories',
    getSubcategories: (categoryId) => {
      return categoryId
        ? `/list-all-categories?category_id=${categoryId}`
        : '/list-all-categories';
    },
    getCategoryById: (id) => `/categories/${id}/`,
    getCategoryProducts: (id) => `/categories/${id}/products/`,
  },

  // Banner/Trending Offers Endpoints
  banner: {
    getTrendingOffers: '/trending-offer-list',
  },

  // Discounted Products Endpoints
  discount: {
    getAllDiscounts: '/get-all-discounts',
    getDiscountedProductsList: (discountId = null) => {
      return discountId
        ? `/discounted-products-list?discount_id=${discountId}`
        : '/discounted-products-list';
    },
    getDiscountedProductsLimitedList: '/discounted-products-limited-list/',
  },

  // Search Endpoints
  search: {
    searchSubcategories: (query) => `/search-subcategories?q=${encodeURIComponent(query)}`,
    searchProducts: (query) => `/search-products?q=${encodeURIComponent(query)}`,
  },

  // Product Endpoints
  product: {
    getProductById: (id) => `/products/${id}/`,
    getProductList: '/products/',
    getProductByCategory: (categoryId) => `/products/?category=${categoryId}`,
    getProductsByCategoryId: (categoryId) => `/get-products-by-cat-id?cat_id=${categoryId}`,
    getProductsBySubcategoryId: (subcategoryId) => `/get-products-by-sub-cat-id?sub_cat_id=${subcategoryId}`,
    getProductVariantsById: (productId, variantId = null, size = null) => {
      let url = `/get-product-variants-by-id?product_id=${productId}`;
      if (variantId) url += `&variant_id=${variantId}`;
      if (size) url += `&size=${size}`;
      return url;
    },
    getFilters: '/get-filters/',
    getSortOptions: '/get-sort-options/',
    sortFilterProductsList: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.sub_category_id) params.append('sub_category_id', filters.sub_category_id);
      if (filters.category_id) params.append('category_id', filters.category_id);
      // Handle multiple filter values - send as comma-separated (backend uses NumberInFilter with lookup_expr='in')
      if (filters.brand) {
        if (Array.isArray(filters.brand)) {
          params.append('brand', filters.brand.join(','));
        } else {
          params.append('brand', filters.brand);
        }
      }
      if (filters.size) {
        if (Array.isArray(filters.size)) {
          params.append('size', filters.size.join(','));
        } else {
          params.append('size', filters.size);
        }
      }
      if (filters.category) {
        if (Array.isArray(filters.category)) {
          params.append('category', filters.category.join(','));
        } else {
          params.append('category', filters.category);
        }
      }
      if (filters.color) {
        if (Array.isArray(filters.color)) {
          params.append('color', filters.color.join(','));
        } else {
          params.append('color', filters.color);
        }
      }
      if (filters.fit) {
        if (Array.isArray(filters.fit)) {
          params.append('fit', filters.fit.join(','));
        } else {
          params.append('fit', filters.fit);
        }
      }
      if (filters.material) {
        if (Array.isArray(filters.material)) {
          params.append('material', filters.material.join(','));
        } else {
          params.append('material', filters.material);
        }
      }
      if (filters.sort) params.append('sort', filters.sort);
      const queryString = params.toString();
      return `/sort-filter-products-list${queryString ? `?${queryString}` : ''}`;
    },
    getAllProducts: (page = 1) => `/list-all-products?page=${page}`,
  },

  // Cart Endpoints
  cart: {
    getCart: '/get-cart',
    addToCart: (uuid) => `/cart/${uuid}/`,
    deleteCartItem: (itemId) => `/delete-cart-item-by-id/${itemId}/`,
  },

  // Coupon Endpoints
  coupon: {
    getCouponList: '/coupon-list/',
    applyCoupon: '/apply-coupon/',
    removeCoupon: '/remove-coupon/',
  },

  // Wishlist/Favorite Endpoints
  wishlist: {
    getWishlist: '/wishlist/',
    addToWishlist: '/wishlist/add/',
    removeFromWishlist: (itemId) => `/wishlist/items/${itemId}/`,
    clearWishlist: '/wishlist/clear/',
    createToggleFavorite: '/create-favorite',
  },

  // Order Endpoints
  order: {
    createOrder: '/orders/',
    getOrders: '/orders/',
    getOrderById: (id) => `/orders/${id}/`,
    cancelOrder: (lastOrderId) => `/manage-user-order/${lastOrderId}/`,
    listUserOrders: '/list-user-orders/',
    getOrderDetails: (orderId) => `/manage-user-order/${orderId}/`,
    getUserOrderDetails: (lastOrderId) => `/user-order-details/${lastOrderId}/`,
    returnOrder: '/return-order/',
    exchangeOrder: '/exchange-order/',
    getReasons: '/reasons-with-subreasons/',
    pickupFromStore: '/pickup-from-store/',
    completePayment: '/complete-payment/',
    updateTransactionStatus: '/update-transaction-status/',
  },

  // Bank Account Endpoints
  bankAccount: {
    listBankAccounts: '/bank-accounts/',
    addBankAccount: '/bank-accounts/',
    getBankAccountById: (id) => `/bank-accounts/${id}/`,
    updateBankAccount: (id) => `/bank-accounts/${id}/`,
    deleteBankAccount: (id) => `/bank-accounts/${id}/`,
  },

  // Notification Endpoints
  notification: {
    getUserNotifications: '/user-notifications/',
  },

  // ShipRocket Tracking Endpoints
  shiprocket: {
    trackOrder: (orderId) => `/shiprocket/track_order/${orderId}/`,
  },
};

export default endpoints;

