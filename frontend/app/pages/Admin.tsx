import React, { useEffect, useState } from "react";
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

export default function Admin() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", price: "", stock_quantity: "", category_id: "" });
  const [editForm, setEditForm] = useState({ name: "", price: "", stock_quantity: "", category_id: "" });

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
  }, [isAuthenticated, user?.is_admin]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, cRes] = await Promise.all([
        productAPI.getAll(1, 100),
        productAPI.getCategories(),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await productAPI.create({
        name: form.name,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        category_id: Number(form.category_id),
      });
      setForm({ name: "", price: "", stock_quantity: "", category_id: "" });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Create product failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productAPI.delete(id);
      if (editingId === id) setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.PRODUCT_ID);
    setEditForm({
      name: p.NAME,
      price: String(p.PRICE),
      stock_quantity: String(p.STOCK_QUANTITY),
      category_id: String(p.CATEGORY_ID),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", price: "", stock_quantity: "", category_id: "" });
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    setError("");
    try {
      await productAPI.update(id, {
        name: editForm.name,
        price: Number(editForm.price),
        stock_quantity: Number(editForm.stock_quantity),
        category_id: Number(editForm.category_id),
      });
      cancelEdit();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading admin...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/analytics" className="text-sm text-blue-600 hover:underline">
          View Analytics
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-bold text-lg mb-3">Create Product</h2>
        <form onSubmit={createProduct} className="grid md:grid-cols-5 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="border rounded px-3 py-2 text-sm"
            required
          />
          <input
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="Price"
            type="number"
            min="0"
            step="0.01"
            className="border rounded px-3 py-2 text-sm"
            required
          />
          <input
            value={form.stock_quantity}
            onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
            placeholder="Stock"
            type="number"
            min="0"
            className="border rounded px-3 py-2 text-sm"
            required
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className="border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.CATEGORY_ID} value={String(c.CATEGORY_ID)}>
                {c.CATEGORY_NAME}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-bold text-lg mb-3">Manage Products</h2>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.PRODUCT_ID} className="flex items-center justify-between gap-3 border rounded p-3">
              {editingId === p.PRODUCT_ID ? (
                <>
                  <div className="grid sm:grid-cols-4 gap-2 flex-1">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="border rounded px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                      className="border rounded px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={editForm.stock_quantity}
                      onChange={(e) => setEditForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                      className="border rounded px-2 py-1.5 text-sm"
                    />
                    <select
                      value={editForm.category_id}
                      onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="border rounded px-2 py-1.5 text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.CATEGORY_ID} value={String(c.CATEGORY_ID)}>
                          {c.CATEGORY_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(p.PRODUCT_ID)}
                      disabled={saving}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{p.NAME}</p>
                    <p className="text-xs text-gray-500">
                      {p.CATEGORY_NAME} | ${Number(p.PRICE).toFixed(2)} | Stock: {p.STOCK_QUANTITY}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(p.PRODUCT_ID)}
                      className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-gray-500">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
