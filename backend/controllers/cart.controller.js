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

// POST add/update item in cart
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1)
      return res.status(400).json({ success: false, message: 'Invalid product_id or quantity' });

    // Verify product exists and has stock
    let connection;
    try {
      connection = await db.connectDB();
      const result = await connection.execute(
        `SELECT product_id, name, price, stock_quantity FROM Products WHERE product_id = :id`,
        { id: parseInt(product_id) },
        { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
      );

      if (!result.rows[0])
        return res.status(404).json({ success: false, message: 'Product not found' });

      const product = result.rows[0];
      if (product.STOCK_QUANTITY < quantity)
        return res.status(400).json({ success: false, message: `Only ${product.STOCK_QUANTITY} items in stock` });
    } finally {
      if (connection) await connection.close();
    }

    // Update Redis cart
    const raw = await client.get(cartKey(userId));
    const items = raw ? JSON.parse(raw) : [];
    const existingIdx = items.findIndex(i => i.product_id === parseInt(product_id));

    if (existingIdx >= 0) {
      items[existingIdx].quantity = quantity;
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

module.exports = { getCart, addToCart, removeFromCart, clearCart };