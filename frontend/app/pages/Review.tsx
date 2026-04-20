import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { reviewAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Review() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [reviewedProducts, setReviewedProducts] = useState<any[]>([]);
  const [toReviewProducts, setToReviewProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviewed' | 'to-review'>('reviewed');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.is_admin) {
      navigate("/admin");
      return;
    }
    loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    try {
      const [reviewedRes, toReviewRes] = await Promise.all([
        reviewAPI.getUserReviews(),
        reviewAPI.getProductsToReview()
      ]);
      setReviewedProducts(reviewedRes.data || []);
      setToReviewProducts(toReviewRes.data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400 min-h-screen bg-white dark:bg-gray-950 transition-colors">
      Loading…
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">My Reviews</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reviewed'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Reviewed ({reviewedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('to-review')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'to-review'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            To Review ({toReviewProducts.length})
          </button>
        </div>

        {/* Reviewed Products Tab Content */}
        {activeTab === 'reviewed' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100 text-gray-800">Products I've Reviewed</h2>
            {reviewedProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">You haven't reviewed any products yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewedProducts.map((review: any) => (
                  <div key={review.REVIEW_ID} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 p-6 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{review.PRODUCT_NAME}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{review.CATEGORY_NAME}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-yellow-500 dark:text-yellow-400 text-lg drop-shadow-sm">
                          {"★".repeat(review.RATING)}{"☆".repeat(5 - review.RATING)}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {new Date(review.CREATED_AT).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {review.COMMENTS && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 border-l-4 border-blue-500/30">
                        <p className="text-gray-700 dark:text-gray-300 italic">"{review.COMMENTS}"</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/products/${review.PRODUCT_ID}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      View Product <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products to Review Tab Content */}
        {activeTab === 'to-review' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100 text-gray-800">Pending Reviews</h2>
            {toReviewProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No products to review. Start shopping!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {toReviewProducts.map((product: any) => (
                  <div key={product.PRODUCT_ID} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{product.PRODUCT_NAME}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.CATEGORY_NAME}</p>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded inline-block">
                          Ordered on {new Date(product.ORDER_DATE).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/my-review/${product.PRODUCT_ID}`)}
                        className="w-full sm:w-auto bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95"
                      >
                        Write Review
                      </button>
                    </div>
                    <button
                      onClick={() => navigate(`/products/${product.PRODUCT_ID}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      View Product <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}