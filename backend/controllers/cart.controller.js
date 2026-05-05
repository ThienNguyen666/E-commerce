const { client } = require('../config/redis');
const db = require('../config/oracle');

const CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const cartKey = (userId) => `cart:${userId}`;

// GET cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const raw = await client.get(cartKey(userId));
    const items = raw ? JSON.parse(raw) : [];

    // Enrich with current prices from DB
    if (items.length > 0) {
      let connection;
      try {
        connection = await db.connectDB();
        const ids = items.map(i => i.product_id);
        const placeholders = ids.map((_, idx) => `:id${idx}`).join(',');
        const binds = {};
        ids.forEach((id, idx) => { binds[`id${idx}`] = id; });

        const result = await connection.execute(
          `SELECT product_id, name, price, stock_quantity FROM Products
           WHERE product_id IN (${placeholders})`,
          binds,
          { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        const productMap = {};
        result.rows.forEach(p => { productMap[p.PRODUCT_ID] = p; });

        const enriched = items.map(item => {
          const p = productMap[item.product_id];
          return p ? {
            ...item,
            name: p.NAME,
            price: p.PRICE,
            stock_quantity: p.STOCK_QUANTITY,
            subtotal: p.PRICE * item.quantity
          } : item;
        });

        const total = enriched.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        return res.status(200).json({ success: true, data: { items: enriched, total } });
      } finally {
        if (connection) await connection.close();
      }
    }

    res.status(200).json({ success: true, data: { items: [], total: 0 } });
  } catch (err) { next(err); }
};

// POST add/update item in cart (ĐÃ FIX LỖI NHẢY SỐ)
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, is_update = false } = req.body;

    if (!product_id || quantity < 1)
      return res.status(400).json({ success: false, message: 'Invalid product_id or quantity' });

    // Verify product exists and has stock
    let connection;
    let product;
    try {
      connection = await db.connectDB();
      const result = await connection.execute(
        `SELECT product_id, name, price, stock_quantity FROM Products WHERE product_id = :id`,
        { id: parseInt(product_id) },
        { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
      );

      if (!result.rows[0])
        return res.status(404).json({ success: false, message: 'Product not found' });

      product = result.rows[0];
    } finally {
      if (connection) await connection.close();
    }

    // Update Redis cart
    const raw = await client.get(cartKey(userId));
    const items = raw ? JSON.parse(raw) : [];
    const existingIdx = items.findIndex(i => i.product_id === parseInt(product_id));

    let newQuantity = quantity;
    if (existingIdx >= 0) {
      if (is_update) {
        newQuantity = quantity; // Cập nhật bằng số lượng gõ trực tiếp
      } else {
        newQuantity = items[existingIdx].quantity + quantity; // Nút Add to Cart thông thường
      }
    }

    // Check total quantity against stock
    if (product.STOCK_QUANTITY < newQuantity)
      return res.status(400).json({ success: false, message: `Chỉ còn ${product.STOCK_QUANTITY} sản phẩm trong kho` });

    if (existingIdx >= 0) {
      items[existingIdx].quantity = newQuantity;
    } else {
      items.push({ product_id: parseInt(product_id), quantity });
    }

    await client.setEx(cartKey(userId), CART_TTL, JSON.stringify(items));
    res.status(200).json({ success: true, message: 'Cart updated', data: { items } });
  } catch (err) { next(err); }
};

// DELETE remove item from cart
const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;

    const raw = await client.get(cartKey(userId));
    const items = raw ? JSON.parse(raw) : [];
    const newItems = items.filter(i => i.product_id !== parseInt(product_id));

    await client.setEx(cartKey(userId), CART_TTL, JSON.stringify(newItems));
    res.status(200).json({ success: true, message: 'Item removed', data: { items: newItems } });
  } catch (err) { next(err); }
};

// DELETE clear entire cart
const clearCart = async (req, res, next) => {
  try {
    await client.del(cartKey(req.user.id));
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

// POST merge redis -> oracle cart on login
const mergeCart = async (req, res) => {
    const userId = req.user.user_id;
    const { guestCart } = req.body; // Danh sách SP từ localStorage gửi lên
    const cartKey = `cart:${userId}`;

    try {
        // Lấy giỏ hàng hiện tại trong Redis (Lưu ý biến client có thể khác với redisClient tùy thuộc vào import của bạn)
        const existingCartData = await client.get(cartKey);
        let userCart = existingCartData ? JSON.parse(existingCartData) : [];

        // Nếu trùng ID thì tăng số lượng, nếu mới thì thêm vào
        guestCart.forEach(guestItem => {
            const existingItem = userCart.find(item => item.product_id === guestItem.product_id);
            if (existingItem) {
                existingItem.quantity += guestItem.quantity;
            } else {
                userCart.push(guestItem);
            }
        });

        // Lưu vào Redis
        await client.set(cartKey, JSON.stringify(userCart));
        res.status(200).json({ message: "Đồng bộ giỏ hàng thành công", cart: userCart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };