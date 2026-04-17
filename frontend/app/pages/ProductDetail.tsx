// frontend/app/pages/ProductDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { productAPI, cartAPI, reviewAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [product,   setProduct]   = useState<any>(null);
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [qty,       setQty]       = useState(1);
  const [toast,     setToast]     = useState("");
  const [toastErr,  setToastErr]  = useState("");

  const productId = parseInt(id!);

  useEffect(() => {
    if (user?.is_admin) {
      navigate("/admin");
      return;
    }
    productAPI.getById(productId).then((r: any) => setProduct(r.data)).catch(() => navigate("/products"));
    loadReviews();
  }, [productId, user?.is_admin]);

  const loadReviews = async () => {
    try {
      const r = await reviewAPI.getAll(productId);
      setReviews(r.data || []);
      setStats(r.stats);
    } catch (e) {
  console.error("Load reviews error:", e);
}
  };

  const showToast = (msg: string, err = false) => {
    err ? setToastErr(msg) : setToast(msg);
    setTimeout(() => err ? setToastErr("") : setToast(""), 3000);
  };

  const addToCart = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await cartAPI.add(productId, qty);
      showToast("Added to cart!");
    } catch (e: any) { showToast(e.message, true); }
  };

  if (!product) return <div className="text-center py-16 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast    && <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}
      {toastErr && <div className="fixed top-4 right-4 bg-red-600   text-white px-4 py-2 rounded shadow z-50">{toastErr}</div>}

      {/* Product info */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-8 mb-8">
        <div className="bg-gray-100 rounded-lg flex items-center justify-center text-8xl w-full md:w-64 h-64 flex-shrink-0">📦</div>
        <div className="flex-1">
          <p className="text-sm text-blue-600 font-medium mb-1">{product.CATEGORY_NAME}</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.NAME}</h1>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-500">{"★".repeat(Math.round(product.AVG_RATING || 0))}{"☆".repeat(5 - Math.round(product.AVG_RATING || 0))}</span>
            <span className="text-sm text-gray-500">({product.REVIEW_COUNT} reviews)</span>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-4">${Number(product.PRICE).toFixed(2)}</p>
          <p className={`text-sm mb-4 ${product.STOCK_QUANTITY > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.STOCK_QUANTITY > 0 ? `${product.STOCK_QUANTITY} in stock` : "Out of stock"}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number" min={1} max={product.STOCK_QUANTITY} value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="border rounded w-16 px-2 py-1 text-center"
            />
            <button
              onClick={addToCart} disabled={product.STOCK_QUANTITY === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-40"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>

        {stats && stats.TOTAL_REVIEWS > 0 && (
          <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-700">{Number(stats.AVG_RATING || 0).toFixed(1)}</p>
              <p className="text-yellow-500 text-lg">{"★".repeat(Math.round(stats.AVG_RATING || 0))}</p>
              <p className="text-sm text-gray-500">{stats.TOTAL_REVIEWS} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(star => {
                const key = ["FIVE","FOUR","THREE","TWO","ONE"][5-star] + "_STAR";
                const count = stats[key] || 0;
                const pct = stats.TOTAL_REVIEWS ? (count / stats.TOTAL_REVIEWS) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-right">{star}</span>
                    <span className="text-yellow-400">★</span>
                    <div className="flex-1 bg-gray-200 rounded h-2">
                      <div className="bg-yellow-400 h-2 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <div key={r.REVIEW_ID} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{r.USER_NAME}</span>
                  <span className="text-yellow-400">{"★".repeat(r.RATING)}{"☆".repeat(5 - r.RATING)}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(r.CREATED_AT).toLocaleDateString()}
                  </span>
                </div>
                {r.COMMENTS && <p className="text-sm text-gray-700">{r.COMMENTS}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}