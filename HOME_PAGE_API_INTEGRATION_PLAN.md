# Home Page API Integration Plan

## Current Implementation Status

### ✅ Already Implemented APIs

1. **`trending-offer-list`** 
   - **Component:** `Banner.jsx`
   - **Service:** `getTrendingOffers()` in `src/services/api/banner.js`
   - **Endpoint:** `/trending-offer-list`
   - **Usage:** Displays banner carousel with trending offer images

2. **`discounted-products-list`**
   - **Component:** `Trending.jsx`
   - **Service:** `getDiscountedProductsList()` in `src/services/api/product.js`
   - **Endpoint:** `/discounted-products-list`
   - **Usage:** Displays discounted/trending products in a carousel

3. **`list-all-categories`**
   - **Component:** `CategoryShopping.jsx`
   - **Service:** `getAllCategories()` in `src/services/api/category.js`
   - **Endpoint:** `/list-all-categories`
   - **Usage:** Displays category grid for shopping

### ❌ Missing APIs (Need Implementation)

1. **`get-all-discounts`**
   - **Endpoint:** `/get-all-discounts`
   - **Status:** Not implemented
   - **Purpose:** Get all available discount offers/campaigns

2. **`discounted-products-limited-list`**
   - **Endpoint:** `/discounted-products-limited-list/`
   - **Status:** Not implemented
   - **Purpose:** Get limited number of discounted products (likely for featured section)

---

## Proposed Home Page Structure

```
HomeContent.jsx
├── Banner (✅ trending-offer-list)
├── Discount Categories Section (🆕 get-all-discounts)
│   └── Shows different discount campaigns/offers
├── Trending Products (✅ discounted-products-list)
├── Limited Discount Products (🆕 discounted-products-limited-list)
│   └── Featured/Flash sale section
├── Top Brands (⚠️ Currently hardcoded - could add API later)
└── Category Shopping (✅ list-all-categories)
```

---

## Implementation Plan

### Step 1: Add Missing Endpoints to `endpoints.js`

```javascript
// Add to discount section
discount: {
  getAllDiscounts: '/get-all-discounts',
  getDiscountedProductsList: (discountId = null) => {
    return discountId 
      ? `/discounted-products-list?discount_id=${discountId}`
      : '/discounted-products-list';
  },
  getDiscountedProductsLimitedList: '/discounted-products-limited-list/',
},
```

### Step 2: Create API Service Functions

**File:** `src/services/api/discount.js` (new file)

```javascript
import { get } from "../http";
import { endpoints } from "../../config/endpoints";

/**
 * Get all discount offers/campaigns
 * @returns {Promise<{results: Array<{id: number, name: string, ...}>}>}
 */
export const getAllDiscounts = async () => {
  const response = await get(endpoints.discount.getAllDiscounts);
  return response;
};

/**
 * Get limited discounted products (for featured section)
 * @returns {Promise<{results: Array}>}
 */
export const getDiscountedProductsLimitedList = async () => {
  const response = await get(endpoints.discount.getDiscountedProductsLimitedList);
  return response;
};
```

### Step 3: Create New Components

#### Component 1: `DiscountCategories.jsx`
- **Purpose:** Display all discount campaigns/offers
- **API:** `get-all-discounts`
- **UI:** Grid or carousel of discount cards
- **Features:**
  - Click on discount → Filter products by that discount
  - Show discount name, image, description
  - Link to filtered product list

#### Component 2: `LimitedDiscountProducts.jsx` (or rename `Trending.jsx` logic)
- **Purpose:** Display limited/featured discounted products
- **API:** `discounted-products-limited-list`
- **UI:** Similar to Trending but with different heading
- **Features:**
  - Show limited products (e.g., 4-6 items)
  - "Flash Sale" or "Featured Deals" section
  - Carousel or grid layout

### Step 4: Update HomeContent.jsx

```javascript
import Banner from "../components/Banner";
import Trending from "../components/Trending";
import DiscountCategories from "../components/DiscountCategories"; // NEW
import LimitedDiscountProducts from "../components/LimitedDiscountProducts"; // NEW
import CategoryShopping from "../components/CategoryShopping";
import TopBrands from "../components/TopBrands";

const HomeContent = () => {
  return (
    <div className="px-4 space-y-8">
      <Banner />
      <DiscountCategories /> {/* NEW */}
      <Trending />
      <LimitedDiscountProducts /> {/* NEW */}
      <TopBrands />
      <CategoryShopping />
    </div>
  );
};
```

---

## Component Details

### 1. DiscountCategories Component

**File:** `src/components/DiscountCategories.jsx`

**Features:**
- Fetch all discounts using `getAllDiscounts()`
- Display as cards or carousel
- Each card shows:
  - Discount name
  - Discount image/banner
  - Discount description/percentage
  - Click → Navigate to filtered product list with `discount_id`

**API Response Expected:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Summer Sale",
      "discount_percent": 50,
      "image": "...",
      "description": "...",
      "start_date": "...",
      "end_date": "..."
    }
  ]
}
```

### 2. LimitedDiscountProducts Component

**File:** `src/components/LimitedDiscountProducts.jsx`

**Features:**
- Fetch limited discounted products using `getDiscountedProductsLimitedList()`
- Display in carousel (similar to Trending)
- Show heading like "Flash Sale" or "Featured Deals"
- Reuse ProductCard component

**API Response Expected:**
```json
{
  "results": [
    {
      "product_id": 1,
      "name": "...",
      "price": 1000,
      "discount_price": {...},
      ...
    }
  ]
}
```

---

## Alternative Approach (Simpler)

If you want to keep it simple, you could:

1. **Option A:** Use `discounted-products-limited-list` to replace or supplement `Trending.jsx`
   - Keep Trending for general discounts
   - Add LimitedDiscountProducts for featured/flash sales

2. **Option B:** Use `get-all-discounts` to create discount filter buttons
   - Show discount categories as filter chips
   - Clicking filters the Trending section by discount_id

3. **Option C:** Create a unified "Offers" section
   - Single component that shows:
     - Discount categories (from `get-all-discounts`)
     - Featured products (from `discounted-products-limited-list`)
     - All discounted products (from `discounted-products-list`)

---

## Recommended Implementation Order

1. ✅ Add endpoints to `endpoints.js`
2. ✅ Create `discount.js` API service file
3. ✅ Create `LimitedDiscountProducts.jsx` component (simpler, similar to Trending)
4. ✅ Add to HomeContent.jsx
5. ⏳ Create `DiscountCategories.jsx` component (more complex)
6. ⏳ Add discount filtering functionality

---

## Questions to Clarify

1. What does `get-all-discounts` return? (structure needed for UI design)
2. What's the difference between `discounted-products-list` and `discounted-products-limited-list`?
   - Limited count?
   - Different sorting?
   - Featured only?
3. Should discount categories be clickable filters or just display?
4. Do we need to show discount expiry dates/timers?

---

## Next Steps

1. Test the APIs to understand response structure
2. Implement endpoints and services
3. Create LimitedDiscountProducts component first (easier)
4. Then create DiscountCategories component
5. Update HomeContent layout

