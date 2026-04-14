import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { productAPI } from "../services/api";
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

type ProductForm = {
  name: string;
  price: string;
  stock_quantity: string;
  category_id: string;
};

const PAGE_SIZE = 12;

const formatMoney = (value: number) => value.toFixed(2);

const isValidNumber = (value: string) => {
  const parsed = Number(value);
  return value.trim() !== "" && !Number.isNaN(parsed) && parsed >= 0;
};

const ProductRow = React.memo(function ProductRow({
  product,
  onEdit,
  onDelete,
  isEven,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isEven: boolean;
}) {
  return (
    <tr
      className={`${isEven ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900"} border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
    >
      <td className="px-4 py-4 text-sm text-left text-slate-900 dark:text-slate-100">{product.NAME}</td>
      <td className="px-4 py-4 text-sm text-left text-slate-500 dark:text-slate-400">{product.CATEGORY_NAME}</td>
      <td className="px-4 py-4 text-sm text-right text-slate-900 dark:text-slate-100">${formatMoney(product.PRICE)}</td>
      <td className="px-4 py-4 text-sm text-right text-slate-900 dark:text-slate-100">{product.STOCK_QUANTITY}</td>
      <td className="px-4 py-4 text-right flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => onEdit(product)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-sm hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(product)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900 transition"
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

export default function Admin() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ProductForm>({ name: "", price: "", stock_quantity: "", category_id: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>({ name: "", price: "", stock_quantity: "", category_id: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const hasFilters = useMemo(() => Boolean(searchQuery.trim() || categoryFilter), [searchQuery, categoryFilter]);

  const totalProducts = useMemo(() => products.length, [products]);
  const totalStock = useMemo(() => products.reduce((sum, item) => sum + item.STOCK_QUANTITY, 0), [products]);
  const totalStockValue = useMemo(
    () => products.reduce((sum, item) => sum + item.PRICE * item.STOCK_QUANTITY, 0),
    [products]
  );

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToastType(type);
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const validateForm = useCallback((values: ProductForm) => {
    const errors: Record<string, string> = {};
    if (!values.name.trim()) errors.name = "Product name is required.";
    if (!isValidNumber(values.price)) errors.price = "Price must be a valid non-negative number.";
    if (!isValidNumber(values.stock_quantity)) errors.stock_quantity = "Stock must be a valid non-negative number.";
    if (!values.category_id) errors.category_id = "Please select a category.";
    return errors;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const categoryResponse = await productAPI.getCategories();
      setCategories(categoryResponse.data || []);

      if (hasFilters) {
        const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
        if (searchQuery.trim().length > 0) params.name = searchQuery.trim();
        if (categoryFilter) params.categoryId = categoryFilter;
        const response = await productAPI.search(params);
        setProducts(response.data || []);
      } else {
        const response = await productAPI.getAll(page, PAGE_SIZE);
        setProducts(response.data || []);
      }
    } catch (e: any) {
      setError(e.message || "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, categoryFilter, hasFilters]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!user?.is_admin) {
      navigate("/");
      return;
    }

    loadData();
  }, [isAuthenticated, user?.is_admin, navigate, loadData]);

  const handleSearchSubmit = useCallback(() => {
    if (searchInput.trim() !== "" && searchInput.trim().length < 2) {
      setError("Search term must be at least 2 characters.");
      return;
    }
    setError("");
    setSearchQuery(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCategoryFilter("");
    setPage(1);
    setError("");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");

    try {
      await productAPI.create({
        name: form.name.trim(),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        category_id: Number(form.category_id),
      });
      setForm({ name: "", price: "", stock_quantity: "", category_id: "" });
      showToast("Product created successfully!", "success");
      setPage(1);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Create product failed.");
      showToast(err.message || "Create product failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.NAME,
      price: String(product.PRICE),
      stock_quantity: String(product.STOCK_QUANTITY),
      category_id: String(product.CATEGORY_ID),
    });
    setEditErrors({});
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingProduct(null);
    setEditForm({ name: "", price: "", stock_quantity: "", category_id: "" });
    setEditErrors({});
  }, []);

  const handleEditSave = async () => {
    if (!editingProduct) return;
    const errors = validateForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");

    try {
      await productAPI.update(editingProduct.PRODUCT_ID, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        stock_quantity: Number(editForm.stock_quantity),
        category_id: Number(editForm.category_id),
      });
      showToast("Product updated successfully!", "success");
      closeEditModal();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Update failed.");
      showToast(err.message || "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = useCallback((product: Product) => {
    setDeleteProductId(product.PRODUCT_ID);
  }, []);

  const handleDelete = async () => {
    if (!deleteProductId) return;
    setSaving(true);
    setError("");

    try {
      await productAPI.delete(deleteProductId);
      showToast("Product deleted successfully.", "success");
      setDeleteProductId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Delete failed.");
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const canSubmitCreate = useMemo(() => {
    const errors = validateForm(form);
    return Object.keys(errors).length === 0;
  }, [form, validateForm]);

  const canSubmitEdit = useMemo(() => {
    const errors = validateForm(editForm);
    return Object.keys(errors).length === 0;
  }, [editForm, validateForm]);

  const paginationLabel = `Page ${page}`;
  const isLastPage = products.length < PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin panel</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Products dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Manage catalog items, update inventory, and keep product information synced across the store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total products</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{totalProducts}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Available stock units</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{totalStock}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Estimated stock value</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">${formatMoney(totalStockValue)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr] items-start">
        <section className="flex min-h-[620px] flex-col space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Catalog</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search, filter, and edit your product catalog.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products"
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
              />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.CATEGORY_ID} value={String(category.CATEGORY_ID)}>
                    {category.CATEGORY_NAME}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="max-h-[56vh] overflow-y-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold">Product</th>
                  <th className="px-4 py-4 text-left font-semibold">Category</th>
                  <th className="px-4 py-4 text-right font-semibold">Price</th>
                  <th className="px-4 py-4 text-right font-semibold">Stock</th>
                  <th className="px-4 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900"}>
                        <td className="px-4 py-4">
                          <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="mx-auto h-4 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="mx-auto h-4 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="mx-auto h-8 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                      </tr>
                    ))
                  : products.length > 0
                  ? products.map((product, index) => (
                      <ProductRow
                        key={product.PRODUCT_ID}
                        product={product}
                        onEdit={openEditModal}
                        onDelete={confirmDeleteProduct}
                        isEven={index % 2 === 0}
                      />
                    ))
                  : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No products match your current filters.
                      </td>
                    </tr>
                  )}
              </tbody>
                </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing {products.length} of {totalProducts} products on {paginationLabel}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={isLastPage || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </section>
        <aside className="xl:sticky xl:top-24 xl:self-start max-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add new product</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a new product quickly with validation and category assignment.
              </p>
            </div>
            <div className="rounded-2xl bg-blue-500 p-3 text-white shadow-lg">
              <span className="text-sm font-semibold">Quick add</span>
            </div>
          </div>

          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Product name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                placeholder="e.g. Wireless mouse"
              />
              {formErrors.name && <p className="text-xs text-red-600">{formErrors.name}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  placeholder="0.00"
                />
                {formErrors.price && <p className="text-xs text-red-600">{formErrors.price}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="stock" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Stock quantity
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((current) => ({ ...current, stock_quantity: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  placeholder="0"
                />
                {formErrors.stock_quantity && <p className="text-xs text-red-600">{formErrors.stock_quantity}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Category
              </label>
              <select
                id="category"
                value={form.category_id}
                onChange={(e) => setForm((current) => ({ ...current, category_id: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.CATEGORY_ID} value={String(category.CATEGORY_ID)}>
                    {category.CATEGORY_NAME}
                  </option>
                ))}
              </select>
              {formErrors.category_id && <p className="text-xs text-red-600">{formErrors.category_id}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !canSubmitCreate}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving product..." : "Add product"}
              </button>
              <button
                type="button"
                onClick={() => setForm({ name: "", price: "", stock_quantity: "", category_id: "" })}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Edit product</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update the product details and inventory without leaving the dashboard.
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close edit modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Product name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                  {editErrors.name && <p className="text-xs text-red-600">{editErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm((current) => ({ ...current, price: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                  {editErrors.price && <p className="text-xs text-red-600">{editErrors.price}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Stock quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm((current) => ({ ...current, stock_quantity: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                  {editErrors.stock_quantity && <p className="text-xs text-red-600">{editErrors.stock_quantity}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm((current) => ({ ...current, category_id: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.CATEGORY_ID} value={String(category.CATEGORY_ID)}>
                        {category.CATEGORY_NAME}
                      </option>
                    ))}
                  </select>
                  {editErrors.category_id && <p className="text-xs text-red-600">{editErrors.category_id}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !canSubmitEdit}
                  onClick={handleEditSave}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteProductId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-950">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Confirm delete</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              This action cannot be undone. Are you sure you want to remove this product from the catalog?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteProductId(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl transition ${
            toastType === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
