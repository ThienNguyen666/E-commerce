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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Vouchers</h1>
          <p className="text-sm text-gray-500">View all vouchers you can currently use.</p>
        </div>
        <Link to="/cart" className="text-sm text-blue-600 hover:underline">Back to Cart</Link>
      </div>

      {!isAuthenticated ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          Please log in to view vouchers.
          <Link to="/login" className="font-medium text-blue-700 hover:underline ml-1">Log in now</Link>
        </div>
      ) : loading ? (
        <div className="text-gray-500">Loading vouchers...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-6 text-gray-600">
          You currently have no usable vouchers.
        </div>
      ) : (
        <div className="grid gap-4">
          {vouchers.map((voucher) => (
            <div key={voucher.VOUCHER_ID} className="bg-white shadow-sm rounded-lg border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Voucher</p>
                  <h2 className="text-xl font-semibold text-gray-900">{voucher.CODE}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Discount {voucher.DISCOUNT_TYPE === "percent" ? `${voucher.DISCOUNT_VALUE}%` : `$${voucher.DISCOUNT_VALUE.toFixed(2)}`}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">
                  {voucher.MIN_ORDER_VALUE > 0 ? `Min order $${voucher.MIN_ORDER_VALUE}` : "No min order required"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-gray-600">
                <p>Used: {voucher.USED_COUNT}/{voucher.MAX_USES ?? "∞"}</p>
                <p>Expires: {voucher.EXPIRES_AT ? new Date(voucher.EXPIRES_AT).toLocaleDateString() : "No limit"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
