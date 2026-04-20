import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cartAPI, productAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

/* ================= TYPES ================= */
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

/* ================= HOOKS ================= */
function useDebounce(value: string, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ================= COMPONENT ================= */
export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const debouncedSearch = useDebounce(searchInput);
  const debouncedMinPrice = useDebounce(minPrice, 300);
  const debouncedMaxPrice = useDebounce(maxPrice, 300);

  /* ================= FETCH CATEGORIES ================= */
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await productAPI.getCategories();
      return res.data || [];
    },
  });

  /* ================= FETCH PRODUCTS (INFINITE) ================= */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["products", debouncedSearch, categoryId, debouncedMinPrice, debouncedMaxPrice],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { page: pageParam, limit: 24 };
      if (debouncedSearch.trim().length >= 2) params.name = debouncedSearch;
      if (categoryId) params.categoryId = categoryId;
      if (debouncedMinPrice) params.minPrice = parseFloat(debouncedMinPrice);
      if (debouncedMaxPrice) params.maxPrice = parseFloat(debouncedMaxPrice);

      const hasFilters = params.name || params.categoryId || params.minPrice || params.maxPrice;
      const res = hasFilters
        ? await productAPI.search(params)
        : await productAPI.getAll(pageParam, 24);

      return {
        data: res.data || [],
        nextPage: res.data?.length === 24 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const products = data?.pages.flatMap((p) => p.data) || [];

  /* ================= INFINITE SCROLL ================= */
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  /* ================= AUTH ================= */
  useEffect(() => {
    if (user?.is_admin) navigate("/admin");
  }, [user, navigate]);

  /* ================= ACTION ================= */
  const { refetchCart } = useCart();
  
  const addToCart = useCallback(async (id: number) => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    try {
      await cartAPI.add(id, 1);
      await refetchCart();
      toast.success("Added to cart ✓");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add to cart");
    }
  }, [isAuthenticated, navigate, refetchCart]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-100">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Products</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Discover amazing items for your collection</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex gap-2">
            {/* SEARCH INPUT */}
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="border px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all flex-1 min-w-[180px]"
            />

            {/* CATEGORY SELECT */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
            >
              <option value="">All Categories</option>
              {categories.map((c: Category) => (
                <option key={c.CATEGORY_ID} value={c.CATEGORY_ID}>{c.CATEGORY_NAME}</option>
              ))}
            </select>

            {/* MIN PRICE */}
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min $"
              className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full lg:w-24"
            />

            {/* MAX PRICE - ĐÃ THÊM LẠI Ở ĐÂY */}
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max $"
              className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full lg:w-24"
            />

            {/* RESET BUTTON */}
            <button
              onClick={() => {
                setSearchInput(""); 
                setCategoryId(""); 
                setMinPrice(""); 
                setMaxPrice("");
              }}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-4 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && <SkeletonGrid />}

        {/* ERROR STATE */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
            Error loading products. Please try again later.
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && products.length === 0 && (
          <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-5xl mb-4 block">🛒</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No products match your criteria.</p>
          </div>
        )}

        {/* PRODUCT GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.PRODUCT_ID} p={p} onAdd={addToCart} />
          ))}
        </div>

        {/* LOAD MORE TRIGGER */}
        <div ref={observerRef} className="h-20 mt-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
              <span>Loading more products...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= CHILD COMPONENTS ================= */

function ProductCard({ p, onAdd }: any) {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try { await onAdd(p.PRODUCT_ID); } 
    finally { setIsAdding(false); }
  };

  return (
    <div className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-300">
      <div className="h-48 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-4 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
        📦
      </div>

      <div className="space-y-1 mb-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400">
          {p.CATEGORY_NAME}
        </span>
        <h2 className="font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[48px] leading-tight text-lg">
          {p.NAME}
        </h2>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-2xl font-black text-gray-900 dark:text-white">
          ${Number(p.PRICE).toFixed(2)}
        </p>
      </div>

      <p className={`text-xs font-bold mb-5 flex items-center gap-1 ${
        p.STOCK_QUANTITY > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${p.STOCK_QUANTITY > 0 ? "bg-green-500" : "bg-red-500"}`}></span>
        {p.STOCK_QUANTITY > 0 ? `${p.STOCK_QUANTITY} in stock` : "Out of stock"}
      </p>

      <div className="mt-auto flex gap-2">
        <Link
          to={`/products/${p.PRODUCT_ID}`}
          className="flex-1 text-center rounded-lg py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Details
        </Link>

        <button
          onClick={handleAdd}
          disabled={!p.STOCK_QUANTITY || isAdding}
          className="flex-[1.5] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isAdding ? <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span> : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ================= SKELETON ================= */
function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-1/3" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-4 w-full" />
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}