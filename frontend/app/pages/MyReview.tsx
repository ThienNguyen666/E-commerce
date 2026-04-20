import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { reviewAPI, productAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MyReview() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [toastErr, setToastErr] = useState("");

  const productId = parseInt(id!);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.is_admin) {
      navigate("/admin");
      return;
    }
    loadProduct();
  }, [productId, isAuthenticated, user, navigate]);

  const loadProduct = async () => {
    try {
      const res = await productAPI.getById(productId);
      setProduct(res.data);
    } catch (error) {
      navigate("/products");
    }
  };

  const showToast = (msg: string, err = false) => {
    err ? setToastErr(msg) : setToast(msg);
    setTimeout(() => (err ? setToastErr("") : setToast("")), 3000);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewAPI.create(productId, rating, comment);
      showToast("Review submitted successfully!");
      setTimeout(() => navigate("/review"), 1500);
    } catch (e: any) {
      showToast(e.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!product)
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400 min-h-screen bg-white dark:bg-gray-950">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Toasts */}
        {toast && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
            {toast}
          </div>
        )}
        {toastErr && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
            {toastErr}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Write a Review</h1>

          {/* Product Info Block */}
          <div className="flex items-center gap-5 mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="text-5xl bg-white dark:bg-gray-800 w-16 h-16 flex items-center justify-center rounded-lg shadow-sm">
              📦
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                {product.NAME}
              </h2>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {product.CATEGORY_NAME}
              </p>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={submitReview} className="space-y-8">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-all hover:scale-125 active:scale-90 ${
                      star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-700"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-2">
                {rating} star{rating !== 1 ? "s" : ""} -{" "}
                {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
              </p>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-gray-100 text-sm h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/review")}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}