import React, { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { authAPI, cartAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(user?.is_admin ? "/admin" : "/products");
  }, [isAuthenticated, user?.is_admin, navigate]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authAPI.login(email, password);
      login(res.token, res.user);
      await handleLoginSuccess(res.user);
      navigate(res.user?.is_admin ? "/admin" : "/products");

    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (userData: any) => {
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    
    if (guestCart.length > 0) {
        await cartAPI.merge(guestCart);
        localStorage.removeItem('guest_cart');
    }
  };



  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 px-4 py-12 transition-colors duration-500">
      <div className="max-w-md w-full">
        {/* Brand / Logo placeholder */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
            E-commerce <span className="text-blue-600 dark:text-blue-500">ID</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Sign in to continue to your account.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded text-sm text-red-700 dark:text-red-400 font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 ml-1">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
                >
                  Password
                </label>
                <button type="button" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-gray-200 dark:shadow-none mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{" "}
              <button
                type="button"
                className="font-bold text-gray-900 dark:text-white hover:underline"
                onClick={() => navigate("/register")}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
          &copy; 2026 E-commerce Inc. All rights reserved. <br/>
          Secure Encrypted Connection.
        </p>
      </div>
    </div>
  );
}