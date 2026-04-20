import React, { useEffect, useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface RegisterForm {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState<RegisterForm>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(user?.is_admin ? "/admin" : "/products");
  }, [isAuthenticated, user?.is_admin, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { full_name, email, password, confirmPassword } = formData;

    if (!full_name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authAPI.register(full_name, email, password);
      login(res.token, res.user);
      navigate(res.user?.is_admin ? "/admin" : "/products");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 px-4 py-12 transition-colors duration-500">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
            Join <span className="text-blue-600 dark:text-blue-500">Us</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Create your account to start shopping.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded text-sm text-red-700 dark:text-red-400 font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label 
                htmlFor="full_name" 
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1"
              >
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="At least 8 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all border sm:text-sm font-medium"
                placeholder="Repeat password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-gray-200 dark:shadow-none mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                className="font-bold text-gray-900 dark:text-white hover:underline"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Legal Info */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium leading-relaxed">
          By creating an account, you agree to our <br/>
          <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}