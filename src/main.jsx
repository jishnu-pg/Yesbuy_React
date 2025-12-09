import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { store } from "./app/store";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import HomeContent from './Pages/HomeContent'
import Loader from "./Pages/Loader";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import OtpVerify from "./Pages/Otpverify";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetail from "./Pages/ProductDetail";
import CartPage from "./Pages/CartPage";
import CategoryPage from './Pages/CategoryPage'
import SubcategoryPage from './Pages/SubcategoryPage'
import ProductListWithFilters from "./Pages/ProductListWithFilters";
import WishlistPage from "./Pages/WishlistPage";
import Profile from "./Pages/Profile";
import MyProfile from "./Pages/MyProfile";
import OrdersPage from "./Pages/OrdersPage";
import OrderDetailPage from "./Pages/OrderDetailPage";
import AddressesPage from "./Pages/AddressesPage";
import FAQsPage from "./Pages/FAQsPage";
import TermsAndConditionsPage from "./Pages/TermsAndConditionsPage";
import PrivacyPolicyPage from "./Pages/PrivacyPolicyPage";
import CouponPage from "./Pages/CouponPage";
import DiscountProductsPage from "./Pages/DiscountProductsPage";
import ReturnOrderPage from "./Pages/ReturnOrderPage";
import ReturnRefundPage from "./Pages/ReturnRefundPage";
import AddBankAccountPage from "./Pages/AddBankAccountPage";
import ExchangeOrderPage from "./Pages/ExchangeOrderPage";
import ExchangeOrderDetailsPage from "./Pages/ExchangeOrderDetailsPage";

const router = createBrowserRouter([
  { path: "/", element: <Loader /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/otp", element: <OtpVerify /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/home",
        element: <HomeContent />,
      },
      // Add the product detail route
      {
        path: "/product/:id",
        element: <ProductDetail />,
      },
      {
        path: "/cartpage",
        element: <CartPage />,
      },
      {
        path: "/coupons",
        element: <CouponPage />,
      },
      {
        path: "/discount/:discountId",
        element: <DiscountProductsPage />,
      },
      {
        path: "/category/:categoryId",
        element: <SubcategoryPage />,
      },
      {
        path: "/category/:categoryId/products",
        element: <ProductListWithFilters />,
      },
      {
        path: "/favorite",
        element: <WishlistPage />,
      },
      {
        path: "/profile",
        element: <MyProfile />,
      },
      {
        path: "/orders",
        element: <OrdersPage />,
      },
      {
        path: "/order/:orderId",
        element: <OrderDetailPage />,
      },
      {
        path: "/order/:orderId/return",
        element: <ReturnOrderPage />,
      },
      {
        path: "/order/:orderId/return/refund",
        element: <ReturnRefundPage />,
      },
      {
        path: "/order/:orderId/return/add-account",
        element: <AddBankAccountPage />,
      },
      {
        path: "/order/:orderId/exchange",
        element: <ExchangeOrderPage />,
      },
      {
        path: "/order/:orderId/exchange/details",
        element: <ExchangeOrderDetailsPage />,
      },
      {
        path: "/addresses",
        element: <AddressesPage />,
      },
      {
        path: "/faqs",
        element: <FAQsPage />,
      },
      {
        path: "/terms-and-conditions",
        element: <TermsAndConditionsPage />,
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicyPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
