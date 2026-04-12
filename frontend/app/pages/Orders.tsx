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
  }, [isAuthenticated, user?.is_admin]);

  if (loading) return <div className="text-center py-16 text-gray-500">Loading orders...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <button
              key={o.ORDER_ID}
              onClick={() => navigate(`/orders/${o.ORDER_ID}`)}
              className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">Order #{o.ORDER_ID}</p>
                  <p className="text-sm text-gray-500">{new Date(o.ORDER_DATE).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">{o.ITEMS_COUNT} items</p>
                  {o.VOUCHER_CODE && <p className="text-xs text-green-700 mt-1">Voucher: {o.VOUCHER_CODE}</p>}
                </div>
                <div className="text-right">
                  {o.DISCOUNT_AMOUNT > 0 && (
                    <p className="text-xs text-green-600">Discount: -${Number(o.DISCOUNT_AMOUNT).toFixed(2)}</p>
                  )}
                  <p className="text-blue-700 font-bold text-lg">${Number(o.TOTAL_AMOUNT).toFixed(2)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
