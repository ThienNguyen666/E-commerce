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
  }, [productId, isAuthenticated, user]);

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
    setTimeout(() => err ? setToastErr("") : setToast(""), 3000);
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

  if (!product) return <div className="text-center py-16 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}
      {toastErr && <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow z-50">{toastErr}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Write a Review</h1>

        {/* Product Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-4xl">📦</div>
          <div>
            <h2 className="font-semibold text-lg">{product.NAME}</h2>
            <p className="text-sm text-gray-600">{product.CATEGORY_NAME}</p>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={submitReview}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{rating} star{rating !== 1 ? 's' : ''}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full border rounded-lg p-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/review")}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}