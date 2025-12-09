# Architecture Documentation

## API Integration Standards

### ✅ Standard Pattern (Use This)

All API calls should follow this pattern:

1. **Define endpoint** in `src/config/endpoints.js`
2. **Create service function** in `src/services/api/[feature].js`
3. **Use HTTP service** from `src/services/http.js`
4. **Call from component** using the service function

**Example:**
```javascript
// 1. Define endpoint (src/config/endpoints.js)
export const endpoints = {
  auth: {
    createAccount: '/create-new-account/',
  },
};

// 2. Create service (src/services/api/auth.js)
import { post } from "../http";
import { endpoints } from "../../config/endpoints";

export const createNewAccount = async (user_name, phone_number) => {
  const formData = new FormData();
  formData.append("user_name", user_name);
  formData.append("phone_number", phone_number);
  return await post(endpoints.auth.createAccount, formData, true);
};

// 3. Use in component
import { createNewAccount } from "../services/api/auth";

const handleSubmit = async () => {
  const response = await createNewAccount(username, phone);
};
```

### ❌ Anti-Patterns (Avoid These)

1. **Direct fetch calls in components:**
   ```javascript
   // ❌ DON'T DO THIS
   const response = await fetch('http://127.0.0.1:8050/api/create-new-account/');
   ```

2. **Hardcoded URLs:**
   ```javascript
   // ❌ DON'T DO THIS
   const API_BASE = "http://127.0.0.1:8050/api";
   ```

3. **Scattered endpoint definitions:**
   ```javascript
   // ❌ DON'T DO THIS
   const response = await post("/create-new-account/", data);
   // Define in endpoints.js instead
   ```

## External API Usage

### Current External APIs

Some components use external APIs (not your backend). These should be migrated when backend endpoints are available:

1. **ProductDetail.jsx** - Uses Netlify Functions API
   - Current: `https://yesbuyapi.netlify.app/.netlify/functions/trendings/${id}`
   - Should be migrated to: `endpoints.product.getProductById(id)`

2. **Trending.jsx** - Uses Netlify Functions API
   - Current: `https://yesbuyapi.netlify.app/.netlify/functions/trendings`
   - Should be migrated to: `endpoints.banner.getTrendingOffers` or new endpoint

**Migration Plan:**
- When backend endpoints are ready, create service functions in `src/services/api/product.js`
- Update components to use the new service functions
- Remove direct fetch calls

## Environment Configuration

### Development
```env
VITE_API_BASE_URL=http://127.0.0.1:8050/api
```

### Production
```env
VITE_API_BASE_URL=https://api.yesbuy.in/api
```

### Switching Environments

Simply update `.env` file and rebuild:
```bash
# Update .env
VITE_API_BASE_URL=https://api.yesbuy.in/api

# Rebuild
npm run build
```

## File Organization Rules

### Where to Put New Code

1. **New API Endpoint:**
   - Add to `src/config/endpoints.js`
   - Create/update service in `src/services/api/[feature].js`
   - Use in component

2. **New Component:**
   - Put in `src/components/` if reusable
   - Put in `src/Pages/` if it's a page/route

3. **New Utility Function:**
   - Put in `src/utils/[name].js`
   - Export and import where needed

4. **New Redux Slice:**
   - Create in `src/features/[feature]/[feature]Slice.js`
   - Register in `src/app/store.js`

## Best Practices

1. **Always use centralized HTTP service** - Never make direct fetch calls
2. **Define all endpoints in one place** - `src/config/endpoints.js`
3. **Use environment variables** - Never hardcode URLs
4. **Follow naming conventions** - camelCase for functions, PascalCase for components
5. **Document API functions** - Add JSDoc comments
6. **Handle errors gracefully** - HTTP service handles errors, but add try-catch in components
7. **Use TypeScript** (if migrating) - Better type safety

## Migration Checklist

When migrating from old code:

- [ ] Remove hardcoded API URLs
- [ ] Move endpoints to `src/config/endpoints.js`
- [ ] Create service functions in `src/services/api/`
- [ ] Replace direct fetch calls with service functions
- [ ] Update components to use new services
- [ ] Test all API calls
- [ ] Update documentation

