import { Navigate } from "react-router-dom";

// UI guard matrame. Asalaina protection backend lo (adminMiddleware) undi.
function AdminRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default AdminRoute;