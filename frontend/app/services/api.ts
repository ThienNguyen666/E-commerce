// frontend/app/services/api.ts

const BASE_URL = "http://localhost:3000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// Auth
export const authAPI = {
  login:    (email: string, password: string) =>
    request<any>("/auth/login",    { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (full_name: string, email: string, password: string) =>
    request<any>("/auth/register", { method: "POST", body: JSON.stringify({ full_name, email, password }) }),
};

// Products
export const productAPI = {
  getAll:      (page = 1, limit = 12) => request<any>(`/products?page=${page}&limit=${limit}`),
  getById:     (id: number)           => request<any>(`/products/${id}`),
  search:      (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/products/search?${qs}`);
  },
  getCategories: ()                   => request<any>("/products/categories"),
  create:      (body: any)            => request<any>("/products",    { method: "POST", body: JSON.stringify(body) }),
  update:      (id: number, body: any)=> request<any>(`/products/${id}`, { method: "PUT",  body: JSON.stringify(body) }),
  delete:      (id: number)           => request<any>(`/products/${id}`, { method: "DELETE" }),
};

// Cart
export const cartAPI = {
  get:         ()                              => request<any>("/cart"),
  add:         (product_id: number, quantity: number) =>
    request<any>("/cart", { method: "POST", body: JSON.stringify({ product_id, quantity }) }),
  remove:      (product_id: number)            => request<any>(`/cart/${product_id}`, { method: "DELETE" }),
  clear:       ()                              => request<any>("/cart/clear", { method: "DELETE" }),
};

// Orders
export const orderAPI = {
  place:       (voucher_code?: string) =>
    request<any>("/orders", { method: "POST", body: JSON.stringify({ voucher_code }) }),
  getAll:      ()                      => request<any>("/orders"),
  getById:     (id: number)            => request<any>(`/orders/${id}`),
};

// Vouchers
export const voucherAPI = {
  getAll:      () => request<any>("/vouchers"),
  validate:    (code: string, order_total: number) =>
    request<any>("/vouchers/validate", { method: "POST", body: JSON.stringify({ code, order_total }) }),
};

// Reviews
export const reviewAPI = {
  getAll:      (productId: number, page = 1) => request<any>(`/products/${productId}/reviews?page=${page}`),
  create:      (productId: number, rating: number, comment: string) =>
    request<any>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) }),
  update:      (productId: number, reviewId: number, body: any) =>
    request<any>(`/products/${productId}/reviews/${reviewId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete:      (productId: number, reviewId: number) =>
    request<any>(`/products/${productId}/reviews/${reviewId}`, { method: "DELETE" }),
};

// Analytics
export const analyticsAPI = {
  get: (type: "monthly" | "category") => request<any>(`/analytics?type=${type}`),
};