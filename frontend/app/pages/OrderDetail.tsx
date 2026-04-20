import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

type OrderItem = {
  ITEM_ID: number;
  PRODUCT_ID: number;
  NAME: string;
  QUANTITY: number;
  UNIT_PRICE: number;
  SUBTOTAL: number;
};

type OrderDetailData = {
  ORDER_ID: number;
  ORDER_DATE: string;
  TOTAL_AMOUNT: number;
  DISCOUNT_AMOUNT: number;
  VOUCHER_CODE: string | null;
  items: OrderItem[];
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
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

    const orderId = Number(id);
    if (!orderId) {
      navigate("/orders");
      return;
    }

    orderAPI
      .getById(orderId)
      .then((res: any) => setOrder(res.data))
      .catch((e: any) => setError(e.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, user?.is_admin, navigate]);

  if (loading) return (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400 min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="inline-block animate-pulse">Loading order...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* BACK BUTTON */}
        <div className="mb-6">
          <Link 
            to="/orders" 
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1"
          >
            ← Back to orders
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-800/50 mb-4">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* ORDER SUMMARY HEADER */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Order #{order.ORDER_ID}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    Placed on {new Date(order.ORDER_DATE).toLocaleString()}
                  </p>
                  {order.VOUCHER_CODE && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold mt-3 border border-green-100 dark:border-green-800/30">
                      <span>🎟️</span> Voucher: {order.VOUCHER_CODE}
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  {order.DISCOUNT_AMOUNT > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                      Discount: -${Number(order.DISCOUNT_AMOUNT).toFixed(2)}
                    </p>
                  )}
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                    ${Number(order.TOTAL_AMOUNT).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* ORDER ITEMS LIST */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="font-bold text-xl mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                Items List
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items.map((item) => (
                  <div key={item.ITEM_ID} className="flex items-center justify-between py-4 group">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.NAME}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        Quantity: <span className="text-gray-900 dark:text-gray-200">{item.QUANTITY}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        ${Number(item.UNIT_PRICE).toFixed(2)} / unit
                      </p>
                      <p className="font-black text-gray-900 dark:text-white text-lg">
                        ${Number(item.SUBTOTAL).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}