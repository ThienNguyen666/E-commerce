import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_admin);

  const handleLogout = () => { logout(); navigate("/login"); };
  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDark(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* Đã sửa đường dẫn ở dòng dưới đây */}
      <Link to={isAdmin ? "/admin" : "/"} className="text-xl font-bold tracking-wide">🛒 ShopApp</Link>
      
      <div className="flex items-center gap-4 text-sm">
        {!isAdmin && <Link to="/products" className="hover:underline">Products</Link>}
        {isAuthenticated && isAdmin && <Link to="/admin" className="hover:underline">Admin</Link>}
        {isAuthenticated && isAdmin && <Link to="/admin/analytics" className="hover:underline">Analytics</Link>}
        {isAuthenticated ? (
          <>
            {!isAdmin && (
              <Link to="/cart" className="relative hover:underline">
                🛒 Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {!isAdmin && <Link to="/vouchers" className="hover:underline">My Vouchers</Link>}
            {!isAdmin && <Link to="/orders" className="hover:underline">My Orders</Link>}
            {!isAdmin && <Link to="/review" className="hover:underline">My Reviews</Link>}
            <span className="text-blue-200">Hi, {user?.full_name?.split(" ")[0]}</span>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
              title="Toggle theme"
            >
              {dark ? "🌙" : "☀️"}
            </button>            
            <button onClick={handleLogout} className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-100">
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
              title="Toggle theme"
            >
              {dark ? "🌙" : "☀️"}
            </button>
            <Link to="/login"    className="hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-100">Register</Link>    
          </>
        )}
      </div>
    </nav>
  );
}