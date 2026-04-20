import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

type OrderRow = {
  ORDER_ID: number;
  ORDER_DATE: string;
  TOTAL_AMOUNT: number;
  DISCOUNT_AMOUNT: number;
  VOUCHER_CODE: string | null;
  ITEMS_COUNT: number;
};

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.is_admin) {
      navigate("/admin");
      return;
    }

    orderAPI
      .getAll()
      .then((res: any) => setOrders(res.data || []))
      .catch((e: any) => setError(e.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.is_admin, navigate]); // Added navigate to dependency array for consistency

  if (loading) return <div className="text-center py-16 text-gray-500 dark:text-gray-400">Loading orders...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">My Orders</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded mb-4 border border-red-100 dark:border-red-800/50">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-10 text-center text-gray-500 dark:text-gray-400 border border-transparent dark:border-gray-700">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <button
              key={o.ORDER_ID}
              onClick={() => navigate(`/orders/${o.ORDER_ID}`)}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-none p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition border border-transparent dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Order #{o.ORDER_ID}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(o.ORDER_DATE).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{o.ITEMS_COUNT} items</p>
                  {o.VOUCHER_CODE && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-medium">
                      Voucher: {o.VOUCHER_CODE}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {o.DISCOUNT_AMOUNT > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Discount: -${Number(o.DISCOUNT_AMOUNT).toFixed(2)}
                    </p>
                  )}
                  <p className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                    ${Number(o.TOTAL_AMOUNT).toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}