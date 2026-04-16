// frontend/app/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { cartAPI } from "../services/api";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const isAdmin = Boolean(user?.is_admin);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      cartAPI.get().then((r: any) => setCartCount(r.data?.items?.length || 0)).catch(() => {});
    }
  }, [isAuthenticated, isAdmin]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">🛒 ShopApp</Link>
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
            <button onClick={handleLogout} className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-100">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    className="hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-100">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}