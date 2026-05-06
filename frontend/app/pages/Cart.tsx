// frontend/app/pages/Cart.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { cartAPI, orderAPI, voucherAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { isAuthenticated, user, isInitializing } = useAuth();
  const navigate = useNavigate();

  const [cart,         setCart]         = useState<any>({ items: [], total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [voucherCode,  setVoucherCode]  = useState("");
  const [voucherInfo,  setVoucherInfo]  = useState<any>(null);
  const [voucherError, setVoucherError] = useState("");
  const [placing,      setPlacing]      = useState(false);
  const [toast,        setToast]        = useState("");
  const [vouchers,     setVouchers]     = useState<any[]>([]);

  // Thêm useRef để quản lý các timer debounce theo từng product_id
  const debounceTimers = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    if (user?.is_admin) { navigate("/admin"); return; }
    loadCart();
  }, [isAuthenticated, user, isInitializing, navigate]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const cartRes = await cartAPI.get();
      setCart(cartRes.data || { items: [], total: 0 });
      loadVouchers(cartRes.data?.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  const loadVouchers = async (total: number) => {
    try {
      const voucherRes = await voucherAPI.getValid(total);
      setVouchers(voucherRes.data || []);
    } catch {}
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Hàm updateQty mới sử dụng Optimistic Update và Debounce
  const updateQty = (productId: number, newQty: number, stock: number) => {
    if (newQty > stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }

    // 1. Cập nhật UI ngay lập tức (Optimistic Update)
    setCart((prevCart: any) => {
      const newItems = prevCart.items.map((item: any) => {
        if (item.product_id === productId) {
          return {
            ...item,
            quantity: Math.max(0, newQty),
            subtotal: item.price * Math.max(0, newQty)
          };
        }
        return item;
      });
      const newTotal = newItems.reduce((sum: number, i: any) => sum + i.subtotal, 0);
      return { ...prevCart, items: newItems, total: newTotal };
    });
    setVoucherInfo(null); // Hủy voucher vì tổng tiền đã thay đổi

    // 2. Clear timer cũ nếu user tiếp tục bấm liên tục
    if (debounceTimers.current[productId]) {
      clearTimeout(debounceTimers.current[productId]);
    }

    // 3. Set timer mới, chỉ gọi API khi user đã ngừng bấm 500ms
    debounceTimers.current[productId] = setTimeout(async () => {
      try {
        if (newQty <= 0) { 
          await cartAPI.remove(productId); 
        } else { 
          // Gọi hàm update đã cấu hình ở api.ts (có is_update: true)
          await cartAPI.update(productId, newQty); 
        }
        // Gọi lại loadCart để đồng bộ hoàn toàn dữ liệu với server
        const cartRes = await cartAPI.get();
        setCart(cartRes.data || { items: [], total: 0 });
        loadVouchers(cartRes.data?.total || 0);
      } catch (e: any) { 
        showToast(e.message); 
        loadCart(); // Rollback UI nếu gọi API thất bại
      }
    }, 500);
  };

  const selectVoucher = async (code: string) => {
    setVoucherCode(code);
    setVoucherError("");
    try {
      const r = await voucherAPI.validate(code, cart.total);
      setVoucherInfo(r.data);
    } catch (e: any) {
      setVoucherError(e.message);
      setVoucherInfo(null);
    }
  };

  const applyVoucher = async () => {
    setVoucherError("");
    try {
      const r = await voucherAPI.validate(voucherCode, cart.total);
      setVoucherInfo(r.data);
    } catch (e: any) { setVoucherError(e.message); setVoucherInfo(null); }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const r = await orderAPI.place(voucherInfo ? voucherCode : undefined);
      showToast("Order placed! 🎉");
      setTimeout(() => navigate(`/orders/${r.data.order_id}`), 1500);
    } catch (e: any) { showToast(e.message); }
    finally { setPlacing(false); }
  };

  const finalTotal = voucherInfo ? voucherInfo.final_total : cart.total;

  if (loading) return <div className="text-center py-16 text-gray-700 dark:text-gray-300">Loading cart…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 dark:bg-gray-900 dark:text-gray-100">
      {toast && <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50 dark:bg-green-500">{toast}</div>}

      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <button onClick={() => navigate("/products")} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Items */}
          <div className="md:col-span-2 space-y-3">
            {cart.items.map((item: any) => (
              <div key={item.product_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded flex items-center justify-center text-3xl flex-shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{item.name}</p>
                  <p className="text-blue-700 dark:text-blue-400 text-sm font-bold">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product_id, item.quantity - 1, item.stock_quantity)}
                    className="w-7 h-7 border border-gray-300 dark:border-gray-600 rounded text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">−</button>
                  <input 
                    type="text" 
                    value={item.quantity}
                    onChange={(e) => {
                      // Chỉ cho phép nhập số
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val === '') return; // Tạm bỏ qua nếu user xóa trắng để gõ số mới
                      
                      let num = parseInt(val, 10);
                      if (num < 1) num = 1;
                      if (num > item.stock_quantity) num = item.stock_quantity;
                      
                      // Gọi hàm updateQty có sẵn, debounce sẽ tự động gom các lần gõ phím lại
                      updateQty(item.product_id, num, item.stock_quantity);
                    }}
                    className="w-12 h-7 text-center font-medium border border-gray-300 dark:border-gray-600 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={() => updateQty(item.product_id, item.quantity + 1, item.stock_quantity)}
                    disabled={item.quantity >= item.stock_quantity}
                    className="w-7 h-7 border rounded text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">+</button>
                </div>
                <p className="w-20 text-right font-semibold">${Number(item.subtotal).toFixed(2)}</p>
                <button onClick={() => updateQty(item.product_id, 0, item.stock_quantity)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-500 text-lg">✕</button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-fit space-y-4 dark:border-gray-700">
            <h2 className="font-bold text-lg border-b pb-2 border-gray-200 dark:border-gray-600">Order Summary</h2>

            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300"><span>Subtotal</span><span>${Number(cart.total).toFixed(2)}</span></div>

            {/* Voucher */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Available Vouchers</label>
              {vouchers.length > 0 ? (
                <div className="space-y-1 mb-3">
                  {vouchers.map((v: any) => (
                    <button
                      key={v.VOUCHER_ID}
                      onClick={() => selectVoucher(v.CODE)}
                      className="w-full text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded p-2 text-sm transition-colors"
                    >
                      <div className="font-medium text-blue-600">{v.CODE}</div>
                      <div className="text-gray-600 dark:text-gray-300 text-xs">
                        {v.DISCOUNT_TYPE === 'percent'
                          ? `${v.DISCOUNT_VALUE}% off (min $${v.MIN_ORDER_VALUE})`
                          : `$${v.DISCOUNT_VALUE} off (min $${v.MIN_ORDER_VALUE})`
                        }
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-xs mb-3">No vouchers available for current order total.</p>
              )}

              <div className="flex gap-2">
                <input
                  value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Or enter code manually"
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"                />
                <button onClick={applyVoucher} className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Apply</button>
              </div>
              {voucherError && <p className="text-red-500 text-xs mt-1">{voucherError}</p>}
              {voucherInfo  && (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2 text-sm">
                  <p className="text-green-700 dark:text-green-300 font-medium">✓ {voucherInfo.code} applied!</p>
                  <p className="text-green-600 dark:text-green-400">Discount: −${Number(voucherInfo.discount_amount).toFixed(2)}</p>
                </div>
              )}
            </div>

            {voucherInfo && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>−${Number(voucherInfo.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t pt-3 border-gray-200 dark:border-gray-700">
              <span>Total</span><span className="text-blue-700">${Number(finalTotal).toFixed(2)}</span>
            </div>

            <button
              onClick={placeOrder} disabled={placing}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {placing ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}