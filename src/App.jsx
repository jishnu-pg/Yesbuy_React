import Header from "./components/Header";
import CartToast from "./components/CartToast";
import ScrollToTop from "./components/ScrollToTop";
import { Outlet } from "react-router-dom";
import { createContext } from "react";
import Footer from "./components/Footer";
export const ToastContext = createContext();
import HeaderCategoryText from "./components/HeaderCategoryText";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderCategory from "./components/HeaderCategory";

const App = () => {
  const [showToast, setShowToast] = useState(false);

  const showCartToast = () => {
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
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
