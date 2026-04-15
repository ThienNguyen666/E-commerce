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
  }, [isAuthenticated, user]);

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

  if (loading) return <div className="text-center py-16 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Reviews</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('reviewed')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'reviewed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Reviewed Products ({reviewedProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('to-review')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'to-review'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Products to Review ({toReviewProducts.length})
        </button>
      </div>

      {/* Reviewed Products */}
      {activeTab === 'reviewed' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Products I've Reviewed</h2>
          {reviewedProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You haven't reviewed any products yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewedProducts.map((review: any) => (
                <div key={review.REVIEW_ID} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{review.PRODUCT_NAME}</h3>
                      <p className="text-sm text-gray-600">{review.CATEGORY_NAME}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500 text-lg">
                        {"★".repeat(review.RATING)}{"☆".repeat(5 - review.RATING)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.CREATED_AT).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.COMMENT && (
                    <p className="text-gray-700 mb-4">{review.COMMENT}</p>
                  )}
                  <button
                    onClick={() => navigate(`/products/${review.PRODUCT_ID}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Product →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products to Review */}
      {activeTab === 'to-review' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Products to Review</h2>
          {toReviewProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No products to review. Start shopping!</p>
          ) : (
            <div className="space-y-4">
              {toReviewProducts.map((product: any) => (
                <div key={product.PRODUCT_ID} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{product.PRODUCT_NAME}</h3>
                      <p className="text-sm text-gray-600">{product.CATEGORY_NAME}</p>
                      <p className="text-xs text-gray-500">
                        Ordered on {new Date(product.ORDER_DATE).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/my-review/${product.PRODUCT_ID}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Write Review
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/products/${product.PRODUCT_ID}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Product →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

