import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { cartAPI, productAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Product = {
  PRODUCT_ID: number;
  NAME: string;
  PRICE: number;
  STOCK_QUANTITY: number;
  CATEGORY_ID: number;
  CATEGORY_NAME: string;
};

type Category = {
  CATEGORY_ID: number;
  CATEGORY_NAME: string;
};

export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [toast, setToast] = useState("");

  const hasFilters = useMemo(() => Boolean(searchName.trim() || categoryId), [searchName, categoryId]);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      if (hasFilters) {
        const params: Record<string, string> = { page: "1", limit: "24" };
        if (searchName.trim()) params.name = searchName.trim();
        if (categoryId) params.categoryId = categoryId;
        const res = await productAPI.search(params);
        setProducts(res.data || []);
      } else {
        const res = await productAPI.getAll(1, 24);
        setProducts(res.data || []);
      }
    } catch (e: any) {
      setError(e.message || "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      navigate("/admin");
      return;
    }
    productAPI.getCategories().then((res: any) => setCategories(res.data || [])).catch(() => {});
  }, [user?.is_admin, navigate]);

  useEffect(() => {
    if (user?.is_admin) return;
    loadProducts();
  }, [hasFilters, user?.is_admin]);

  const addToCart = async (productId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await cartAPI.add(productId, 1);
      setToast("Added to cart");
      setTimeout(() => setToast(""), 2000);
    } catch (e: any) {
      setToast(e.message || "Failed to add to cart");
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-4 right-4 bg-blue-700 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">Browse and search available products</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name"
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.CATEGORY_ID} value={String(c.CATEGORY_ID)}>
                {c.CATEGORY_NAME}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchName("");
              setCategoryId("");
            }}
            className="bg-gray-100 text-gray-700 rounded px-3 py-2 text-sm hover:bg-gray-200"
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-gray-500">Loading products...</div>}
      {!loading && error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.PRODUCT_ID} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
              <div className="bg-gray-100 rounded-lg h-36 flex items-center justify-center text-5xl">📦</div>
              <div>
                <p className="text-xs text-blue-600 font-medium">{p.CATEGORY_NAME}</p>
                <h2 className="font-semibold text-gray-800 line-clamp-2 min-h-12">{p.NAME}</h2>
                <p className="text-blue-700 font-bold text-lg mt-1">${Number(p.PRICE).toFixed(2)}</p>
                <p className={`text-xs mt-1 ${p.STOCK_QUANTITY > 0 ? "text-green-600" : "text-red-500"}`}>
                  {p.STOCK_QUANTITY > 0 ? `${p.STOCK_QUANTITY} in stock` : "Out of stock"}
                </p>
              </div>

              <div className="mt-auto flex gap-2">
                <Link
                  to={`/products/${p.PRODUCT_ID}`}
                  className="flex-1 text-center border border-blue-600 text-blue-700 rounded py-1.5 text-sm hover:bg-blue-50"
                >
                  View
                </Link>
                <button
                  onClick={() => addToCart(p.PRODUCT_ID)}
                  disabled={p.STOCK_QUANTITY <= 0}
                  className="flex-1 bg-blue-600 text-white rounded py-1.5 text-sm hover:bg-blue-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-16 text-gray-500">No products found.</div>
      )}
    </div>
  );
}
