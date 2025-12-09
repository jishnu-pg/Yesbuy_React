import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // your image

const Loader = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const isAuthenticated = localStorage.getItem("auth") === "true";
      navigate(isAuthenticated ? "/home" : "/login");
    }, 2000); // ⏳ 2 seconds

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen  text-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <img
          src={logo}
          alt="YesBuy Logo"
          className="w-full h-32 mb-6 animate-spin-slow drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold tracking-wide">Welcome to YesBuy</h1>
        <p className="mt-2 text-sm text-white/80">Loading your experience...</p>
      </div>
    </div>
  );
};

export default Loader;
