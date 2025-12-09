import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const accessToken = localStorage.getItem("accessToken");

  // Check both Redux state and localStorage token
  const isAuth = isAuthenticated || !!accessToken;

  return isAuth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
