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

type ProductsResponse = {
  data: Product[];
  nextPage?: number;
};

/* ================= HOOKS ================= */

// debounce hook
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
      const params: any = {
        page: pageParam,
        limit: 24,
      };

      if (debouncedSearch.trim().length >= 2) {
        params.name = debouncedSearch;
      }

      if (categoryId) {
        params.categoryId = categoryId;
      }

      if (debouncedMinPrice) {
        params.minPrice = parseFloat(debouncedMinPrice);
      }

      if (debouncedMaxPrice) {
        params.maxPrice = parseFloat(debouncedMaxPrice);
      }

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
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  /* ================= AUTH ================= */
  useEffect(() => {
    if (user?.is_admin) navigate("/admin");
  }, [user, navigate]);

  /* ================= ACTION ================= */
  const queryClient = useQueryClient();
  const { refetchCart } = useCart();
  
  const addToCart = useCallback(async (id: number) => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      // Call API first
      await cartAPI.add(id, 1);
      
      // Then refresh cart data from server  
      await refetchCart();
      
      // Show success message
      toast.success("Added to cart ✓");
    } catch (error: any) {
      console.error("Add to cart error:", error);
      const errorMsg = error?.message || "Failed to add to cart";
      toast.error(errorMsg);
    }
  }, [isAuthenticated, navigate, refetchCart]);

  /* ================= RENDER ================= */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 
text-gray-800 dark:text-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Discover amazing items</p>
        </div>

        {/* FILTER */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="border px-3 py-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
          >
            <option value="">All</option>
            {categories.map((c: Category) => (
              <option key={c.CATEGORY_ID} value={c.CATEGORY_ID}>
                {c.CATEGORY_NAME}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
            min="0"
            step="0.01"
            className="border px-3 py-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            min="0"
            step="0.01"
            className="border px-3 py-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <button
            onClick={() => {
              setSearchInput("");
              setCategoryId("");
              setMinPrice("");
              setMaxPrice("");
            }}
            className="bg-gray-400 dark:bg-gray-600 text-white rounded py-2 px-3 text-sm hover:bg-gray-500 dark:hover:bg-gray-700 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* LOADING */}
      {isLoading && <SkeletonGrid />}

      {/* ERROR */}
      {isError && <p className="text-red-500">Error loading</p>}

      {/* EMPTY */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No products found 🛒
        </div>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.PRODUCT_ID} p={p} onAdd={addToCart} />
        ))}
      </div>

      {/* LOAD MORE TRIGGER */}
      <div ref={observerRef} className="h-10 mt-10 flex justify-center">
        {isFetchingNextPage && <span>Loading more...</span>}
      </div>
    </div>
  );
}

/* ================= CHILD COMPONENTS ================= */

function ProductCard({ p, onAdd }: any) {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await onAdd(p.PRODUCT_ID);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="
      bg-white dark:bg-gray-800 
      border border-gray-100 dark:border-gray-700
      rounded-xl p-4 flex flex-col
      shadow-sm hover:shadow-xl 
      transition-all duration-300 hover:-translate-y-1
    ">
      <div className="h-36 bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center text-4xl">
        📦
      </div>

      <p className="text-xs text-blue-600 dark:text-blue-400">
        {p.CATEGORY_NAME}
      </p>

      <h2 className="font-semibold line-clamp-2 min-h-[40px]">
        {p.NAME}
      </h2>

      <p className="text-blue-600 dark:text-blue-400 font-bold mt-1 text-lg">
        ${Number(p.PRICE).toFixed(2)}
      </p>

      <p className={`text-xs mt-1 ${
        p.STOCK_QUANTITY > 0 
          ? "text-green-600 dark:text-green-400" 
          : "text-red-500"
      }`}>
        {p.STOCK_QUANTITY > 0 ? "In stock" : "Out of stock"}
      </p>

      <div className="mt-auto flex gap-2">
        <Link
          to={`/products/${p.PRODUCT_ID}`}
          className="
            flex-1 text-center rounded py-1.5 text-sm
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-50 dark:hover:bg-gray-700
          "
        >
          View
        </Link>

        <button
          onClick={handleAdd}
          disabled={!p.STOCK_QUANTITY || isAdding}
          className="
            flex-1 bg-blue-600 text-white rounded py-1.5 text-sm
            hover:bg-blue-700 
            active:scale-95 transition
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center gap-1
          "
        >
          {isAdding ? (
            <>
              <span className="inline-block animate-spin">⟳</span> Adding...
            </>
          ) : (
            "Add"
          )}
        </button>
      </div>
    </div>
  );
}

/* ================= SKELETON ================= */

function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white p-4 rounded shadow">
          <div className="h-36 bg-gray-200 rounded mb-3" />
          <div className="h-4 bg-gray-200 mb-2 w-2/3" />
          <div className="h-4 bg-gray-200 w-1/2" />
        </div>
      ))}
    </div>
  );
}