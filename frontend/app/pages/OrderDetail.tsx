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
  }, [id, isAuthenticated, user?.is_admin]);

  if (loading) return <div className="text-center py-16 text-gray-500">Loading order...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/orders" className="text-blue-600 hover:underline text-sm">
          Back to orders
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {order && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between gap-4 items-start">
              <div>
                <h1 className="text-2xl font-bold">Order #{order.ORDER_ID}</h1>
                <p className="text-sm text-gray-500">{new Date(order.ORDER_DATE).toLocaleString()}</p>
                {order.VOUCHER_CODE && (
                  <p className="text-sm text-green-700 mt-1">Voucher: {order.VOUCHER_CODE}</p>
                )}
              </div>
              <div className="text-right">
                {order.DISCOUNT_AMOUNT > 0 && (
                  <p className="text-sm text-green-600">Discount: -${Number(order.DISCOUNT_AMOUNT).toFixed(2)}</p>
                )}
                <p className="text-2xl font-bold text-blue-700">${Number(order.TOTAL_AMOUNT).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="font-bold text-lg mb-3">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.ITEM_ID} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{item.NAME}</p>
                    <p className="text-sm text-gray-500">Qty: {item.QUANTITY}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>${Number(item.UNIT_PRICE).toFixed(2)} each</p>
                    <p className="font-semibold">${Number(item.SUBTOTAL).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
