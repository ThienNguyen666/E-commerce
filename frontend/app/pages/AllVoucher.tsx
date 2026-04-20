import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { voucherAPI } from "../services/api";

type Voucher = {
  VOUCHER_ID: number;
  CODE: string;
  DISCOUNT_TYPE: "percent" | "fixed";
  DISCOUNT_VALUE: number;
  MIN_ORDER_VALUE: number;
  MAX_USES: number | null;
  USED_COUNT: number;
  EXPIRES_AT: string | null;
  IS_ACTIVE: number;
};

export default function AllVoucher() {
  const { isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadVouchers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await voucherAPI.getMine();
        setVouchers(res.data || []);
      } catch (e: any) {
        setError(e.message || "Unable to load vouchers");
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, [isAuthenticated]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Vouchers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View all vouchers you can currently use.</p>
        </div>
        <Link 
          to="/cart" 
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Cart
        </Link>
      </div>

      <hr className="mb-8 border-gray-200 dark:border-gray-800" />

      {/* Logic States */}
      {!isAuthenticated ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
          Please log in to view vouchers.
          <Link to="/login" className="font-bold text-blue-700 dark:text-blue-400 hover:underline ml-2">Log in now</Link>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          Loading vouchers...
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg font-medium">
          {error}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center text-gray-600 dark:text-gray-400 shadow-sm">
          <p className="text-lg">You currently have no usable vouchers.</p>
        </div>
      ) : (
        /* Voucher Grid */
        <div className="grid gap-6">
          {vouchers.map((voucher) => (
            <div 
              key={voucher.VOUCHER_ID} 
              className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold mb-1">
                    Voucher
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                    {voucher.CODE}
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    Discount {voucher.DISCOUNT_TYPE === "percent" ? `${voucher.DISCOUNT_VALUE}%` : `$${voucher.DISCOUNT_VALUE.toFixed(2)}`}
                  </p>
                </div>
                
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-1 text-xs font-bold ring-1 ring-inset ring-green-600/20">
                    {voucher.MIN_ORDER_VALUE > 0 ? `Min order $${voucher.MIN_ORDER_VALUE}` : "No min order required"}
                  </span>
                </div>
              </div>

              {/* Footer details of the voucher */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 grid gap-4 sm:grid-cols-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Used:</span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {voucher.USED_COUNT} / {voucher.MAX_USES ?? "∞"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 sm:justify-end">
                  <span className="font-semibold">Expires:</span>
                  <span className={`${voucher.EXPIRES_AT ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {voucher.EXPIRES_AT ? new Date(voucher.EXPIRES_AT).toLocaleDateString() : "No limit"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}