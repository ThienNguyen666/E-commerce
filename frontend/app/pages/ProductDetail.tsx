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
    productAPI.getById(productId)
      .then((r: any) => setProduct(r.data))
      .catch(() => navigate("/products"));
    loadReviews();
  }, [productId, user?.is_admin, navigate]);

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

  if (!product) return (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400 min-h-screen bg-white dark:bg-gray-950">
      Loading…
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Toast Notifications */}
        {toast && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-bounce">
            {toast}
          </div>
        )}
        {toastErr && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
            {toastErr}
          </div>
        )}

        {/* Product info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-8xl w-full md:w-64 h-64 flex-shrink-0 transition-transform hover:scale-105">
            📦
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">
              {product.CATEGORY_NAME}
            </p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
              {product.NAME}
            </h1>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500 dark:text-yellow-400 text-xl">
                {"★".repeat(Math.round(product.AVG_RATING || 0))}
                <span className="opacity-30">{"★".repeat(5 - Math.round(product.AVG_RATING || 0))}</span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                ({product.REVIEW_COUNT} reviews)
              </span>
            </div>

            <p className="text-4xl font-black text-blue-700 dark:text-blue-400 mb-6">
              ${Number(product.PRICE).toFixed(2)}
            </p>

            <p className={`text-sm font-bold mb-6 flex items-center gap-2 ${
              product.STOCK_QUANTITY > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
            }`}>
              <span className={`w-2 h-2 rounded-full ${product.STOCK_QUANTITY > 0 ? "bg-green-500" : "bg-red-500"}`}></span>
              {product.STOCK_QUANTITY > 0 ? `${product.STOCK_QUANTITY} in stock` : "Out of stock"}
            </p>

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 w-fit">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Quantity</span>
                <input
                  type="number" min={1} max={product.STOCK_QUANTITY} value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-transparent font-bold text-gray-900 dark:text-white w-12 outline-none text-lg"
                />
              </div>
              <button
                onClick={addToCart} disabled={product.STOCK_QUANTITY === 0}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Customer Reviews</h2>

          {stats && stats.TOTAL_REVIEWS > 0 && (
            <div className="flex flex-col md:flex-row gap-8 mb-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="text-center px-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-4 md:pb-0 md:pr-8">
                <p className="text-5xl font-black text-blue-700 dark:text-blue-400 mb-1">
                  {Number(stats.AVG_RATING || 0).toFixed(1)}
                </p>
                <p className="text-yellow-500 dark:text-yellow-400 text-xl mb-1">
                  {"★".repeat(Math.round(stats.AVG_RATING || 0))}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
                  {stats.TOTAL_REVIEWS} reviews
                </p>
              </div>
              
              <div className="flex-1 space-y-2">
                {[5,4,3,2,1].map(star => {
                  const key = ["FIVE","FOUR","THREE","TWO","ONE"][5-star] + "_STAR";
                  const count = stats[key] || 0;
                  const pct = stats.TOTAL_REVIEWS ? (count / stats.TOTAL_REVIEWS) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm group">
                      <span className="w-3 font-bold text-gray-600 dark:text-gray-400">{star}</span>
                      <span className="text-yellow-400">★</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-yellow-400 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 dark:text-gray-500 font-medium italic">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {reviews.map((r: any) => (
                  <div key={r.REVIEW_ID} className="py-6 group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                        {r.USER_NAME?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{r.USER_NAME}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">
                          {new Date(r.CREATED_AT).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="ml-auto text-yellow-500 dark:text-yellow-400 text-xs tracking-tighter">
                        {"★".repeat(r.RATING)}
                        <span className="opacity-20">{"★".repeat(5 - r.RATING)}</span>
                      </div>
                    </div>
                    {r.COMMENTS && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pl-11">
                        {r.COMMENTS}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}