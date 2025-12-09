# YesBuy - E-commerce Platform

A modern React-based e-commerce platform built with Vite, Redux Toolkit, and Tailwind CSS.

## 📁 Project Structure

```
yesBuy-main/
├── public/                 # Static assets
├── src/
│   ├── app/               # Redux store configuration
│   │   └── store.js
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Banner.jsx
│   │   ├── ProfileEdit.jsx
│   │   └── ...
│   ├── config/            # Configuration files
│   │   ├── env.js        # Environment variables
│   │   └── endpoints.js  # API endpoints (centralized)
│   ├── features/         # Redux slices (feature-based)
│   │   ├── auth/
│   │   ├── cart/
│   │   └── wishlist/
│   ├── Pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   └── ...
│   ├── services/         # API services
│   │   ├── api/          # Feature-specific API calls
│   │   │   ├── auth.js
│   │   │   ├── category.js
│   │   │   ├── profile.js
│   │   │   └── banner.js
│   │   └── http.js       # Centralized HTTP client
│   └── utils/            # Utility functions
│       ├── auth.js
│       └── toast.js
├── .env.example          # Environment variables template
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (default: `http://127.0.0.1:8050/api`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yesBuy-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the values:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8050/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

All environment variables are configured in `.env` file. The application uses Vite's environment variable system (prefixed with `VITE_`).

**Key Variables:**
- `VITE_API_BASE_URL`: Base URL for your backend API
- `VITE_API_TIMEOUT`: Request timeout in milliseconds
- `VITE_APP_NAME`: Application name
- `VITE_NETLIFY_API_URL`: External API URL (if using)

**Environment-Specific Setup:**

1. **Development** (`.env.development`):
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8050/api
   ```

2. **Production** (`.env.production`):
   ```env
   VITE_API_BASE_URL=https://api.yesbuy.in/api
   ```

### API Configuration

#### Base URL Configuration

The API base URL is configured in `src/config/env.js` and can be changed via environment variables:

```javascript
// src/config/env.js
export const config = {
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'http://127.0.0.1:8050/api'),
  },
};
```

#### Centralized Endpoints

All API endpoints are defined in `src/config/endpoints.js`:

```javascript
// src/config/endpoints.js
export const endpoints = {
  auth: {
    createAccount: '/create-new-account/',
    verifyRegistrationOTP: (phoneNumber) => `/create-new-account/${phoneNumber}/`,
    // ...
  },
  // ...
};
```

**Usage:**
```javascript
import { endpoints } from '../config/endpoints';
import { post } from '../services/http';

const response = await post(endpoints.auth.createAccount, data);
```

## 📡 API Services

### HTTP Service

All API calls go through the centralized HTTP service (`src/services/http.js`):

- **Authentication**: Automatically includes JWT token from localStorage
- **Error Handling**: Centralized error handling with toast notifications
- **FormData Support**: Handles both JSON and FormData requests

**Methods:**
- `get(path, useBaseUrl = true)`
- `post(path, data, isFormData = false)`
- `put(path, data, isFormData = false)`
- `patch(path, data, isFormData = false)`
- `del(path)`

### API Service Files

API services are organized by feature in `src/services/api/`:

- `auth.js` - Authentication (login, registration, OTP)
- `category.js` - Category operations
- `profile.js` - User profile operations
- `banner.js` - Banner/trending offers

**Example:**
```javascript
// src/services/api/auth.js
import { post } from "../http";
import { endpoints } from "../../config/endpoints";

export const createNewAccount = async (user_name, phone_number) => {
  const formData = new FormData();
  formData.append("user_name", user_name);
  formData.append("phone_number", phone_number);
  return await post(endpoints.auth.createAccount, formData, true);
};
```

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Registration Flow:**
   - User enters username and phone number
   - OTP is sent to phone
   - User verifies OTP
   - Access and refresh tokens are stored

2. **Login Flow:**
   - User enters phone number
   - OTP is sent to phone
   - User verifies OTP
   - Access and refresh tokens are stored

3. **Token Management:**
   - Tokens are stored in `localStorage`
   - Automatically included in API requests via HTTP service
   - Protected routes check authentication status

## 🗂️ State Management

Redux Toolkit is used for state management:

- **Auth Slice** (`features/auth/authSlice.js`): User authentication state
- **Cart Slice** (`features/cart/cartSlice.js`): Shopping cart state
- **Wishlist Slice** (`features/wishlist/wishlistSlice.js`): Wishlist state

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Custom Colors**: Brand color `#ec1b45` (primary red)

## 📝 Code Standards

### File Naming
- Components: PascalCase (e.g., `Header.jsx`)
- Utilities: camelCase (e.g., `toast.js`)
- API Services: camelCase (e.g., `auth.js`)

### Import Order
1. React/External libraries
2. Internal components
3. Services/API
4. Utils
5. Styles

### API Calls
- **Always use** the HTTP service (`src/services/http.js`)
- **Never make direct** `fetch()` calls in components
- **Use centralized endpoints** from `src/config/endpoints.js`

## 🔄 Switching Environments

### Development to Production

1. **Update `.env` file:**
   ```env
   VITE_API_BASE_URL=https://api.yesbuy.in/api
   ```

2. **Rebuild the application:**
   ```bash
   npm run build
   ```

3. **The build will use the production API URL automatically**

### Alternative: Environment-Specific Files

Create separate files:
- `.env.development` - Development settings
- `.env.production` - Production settings

Vite will automatically use the correct file based on the build mode.

## 🐛 Troubleshooting

### API Connection Issues

1. **Check API Base URL:**
   - Verify `VITE_API_BASE_URL` in `.env`
   - Ensure backend is running
   - Check CORS settings on backend

2. **Check Network Tab:**
   - Open browser DevTools
   - Check Network tab for failed requests
   - Verify request headers include Authorization token

### Build Issues

1. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Follow the project structure
2. Use centralized endpoints and HTTP service
3. Add new API endpoints to `src/config/endpoints.js`
4. Create API service files in `src/services/api/`
5. Update this README when adding new features

## 📄 License

[Your License Here]
