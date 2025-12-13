import Header from "./components/Header";
import CartToast from "./components/CartToast";
import ScrollToTop from "./components/ScrollToTop";
import { Outlet, useNavigate } from "react-router-dom";
import { createContext } from "react";
import Footer from "./components/Footer";
export const ToastContext = createContext();
import HeaderCategoryText from "./components/HeaderCategoryText";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderCategory from "./components/HeaderCategory";
import { useSelector } from "react-redux";

const App = () => {
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const accessToken = localStorage.getItem("accessToken");

  const showCartToast = () => {
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isHome = location.pathname === "/" || location.pathname === "/home";

  useEffect(() => {
    // Function to check if screen is below 'sm' breakpoint (e.g., 640px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Prevent back navigation to auth pages after successful authentication
  // This listener persists throughout the session and handles multiple back clicks
  useEffect(() => {
    // Only add listener if user is authenticated
    if (!isAuthenticated && !accessToken) return;

    const preventBackToAuth = () => {
      const currentPath = window.location.pathname;
      // If user navigates back to auth pages, immediately redirect to home
      if (currentPath === '/otp' || currentPath === '/login' || currentPath === '/register') {
        // Replace current entry with home
        window.history.replaceState(null, '', '/home');
        navigate("/home", { replace: true });
      }
    };

    // Add popstate listener to catch back button clicks
    window.addEventListener('popstate', preventBackToAuth);
    
    // Also check on location change (in case of direct navigation)
    preventBackToAuth();

    return () => {
      window.removeEventListener('popstate', preventBackToAuth);
    };
  }, [isAuthenticated, accessToken, navigate, location]);

  return (
    <ToastContext.Provider value={{ showCartToast }}>
      <div>
        <ScrollToTop />
        <Header />
        {/* Sticky text-only bar with transition, only on home page and when scrolled */}
        {isHome ? (
          showStickyBar && <HeaderCategoryText />
        ) : (
          <HeaderCategoryText />
        )}
        {/* HeaderCategory - sticky on mobile, visible on all pages if mobile, otherwise only on home */}
        {(isHome || isMobile) ? <HeaderCategory /> : null}
        <CartToast show={showToast} onClose={handleToastClose} />
        <Outlet />
        <Footer />
      </div>
    </ToastContext.Provider>
  );
};

export default App;
