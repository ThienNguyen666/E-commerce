const db = require('../config/oracle');
const { client } = require('../config/redis');

const cartKey = (userId) => `cart:${userId}`;

// POST /api/orders  — place an order from current cart
const placeOrder = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    const { voucher_code } = req.body;

    // 1. Load cart from Redis
    const raw = await client.get(cartKey(userId));
    const cartItems = raw ? JSON.parse(raw) : [];
    if (cartItems.length === 0)
      return res.status(400).json({ success: false, message: 'Cart is empty' });

    connection = await db.connectDB();

    // 2. Lock & validate products (FOR UPDATE)
    const ids = cartItems.map(i => i.product_id);
    const placeholders = ids.map((_, idx) => `:id${idx}`).join(',');
    const binds = {};
    ids.forEach((id, idx) => { binds[`id${idx}`] = id; });

    const productRes = await connection.execute(
      `SELECT product_id, name, price, stock_quantity
       FROM Products
       WHERE product_id IN (${placeholders})
       FOR UPDATE`,
      binds,
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const productMap = {};
    productRes.rows.forEach(p => { productMap[p.PRODUCT_ID] = p; });

    // 3. Validate stock & compute subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const p = productMap[item.product_id];
      if (!p)
        throw Object.assign(new Error(`Product ${item.product_id} not found`), { statusCode: 404 });
      if (p.STOCK_QUANTITY < item.quantity)
        throw Object.assign(
          new Error(`"${p.NAME}" only has ${p.STOCK_QUANTITY} items left in stock`),
          { statusCode: 400 }
        );
      subtotal += p.PRICE * item.quantity;
    }

    // 4. Apply voucher (if provided) — uses subquery to check conditions
    let discountAmount = 0;
    let voucherId = null;

    if (voucher_code) {
      const voucherRes = await connection.execute(
        `SELECT v.voucher_id, v.discount_type, v.discount_value, v.min_order_value,
                v.max_uses, v.used_count, v.expires_at
         FROM Vouchers v
         WHERE v.code = :code
           AND v.is_active = 1
           AND (v.expires_at IS NULL OR v.expires_at > SYSTIMESTAMP)
           AND (v.max_uses IS NULL OR v.used_count < v.max_uses)
           AND v.min_order_value <= :subtotal
           AND NOT EXISTS (
                 SELECT 1 FROM Voucher_Usage vu
                 WHERE vu.voucher_id = v.voucher_id
                   AND vu.user_id = :userId
               )`,
        { code: voucher_code, subtotal, userId },
        { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
      );

      if (!voucherRes.rows[0])
        return res.status(400).json({ success: false, message: 'Voucher is invalid, expired, or not applicable' });

      const v = voucherRes.rows[0];
      voucherId = v.VOUCHER_ID;
      discountAmount = v.DISCOUNT_TYPE === 'percent'
        ? (subtotal * v.DISCOUNT_VALUE) / 100
        : Math.min(v.DISCOUNT_VALUE, subtotal);
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // 5. Create Order
    const orderRes = await connection.execute(
      `INSERT INTO Orders (user_id, total_amount, voucher_id, discount_amount)
       VALUES (:userId, :totalAmount, :voucherId, :discountAmount)
       RETURNING order_id INTO :orderId`,
      {
        userId,
        totalAmount,
        voucherId: voucherId || null,
        discountAmount,
        orderId: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
      }
    );
    const orderId = orderRes.outBinds.orderId[0];

    // 6. Insert Order Items + Decrement Stock (Inventory Tracking)
    for (const item of cartItems) {
      const p = productMap[item.product_id];

      await connection.execute(
        `INSERT INTO Order_Items (order_id, product_id, quantity, unit_price)
         VALUES (:orderId, :productId, :quantity, :unitPrice)`,
        { orderId, productId: item.product_id, quantity: item.quantity, unitPrice: p.PRICE }
      );

      // Automatically update inventory
      await connection.execute(
        `UPDATE Products
         SET stock_quantity = stock_quantity - :quantity,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = :productId`,
        { quantity: item.quantity, productId: item.product_id }
      );
    }

    // 7. Record voucher usage
    if (voucherId) {
      await connection.execute(
        `INSERT INTO Voucher_Usage (voucher_id, user_id, order_id)
         VALUES (:voucherId, :userId, :orderId)`,
        { voucherId, userId, orderId }
      );
      await connection.execute(
        `UPDATE Vouchers SET used_count = used_count + 1 WHERE voucher_id = :voucherId`,
        { voucherId }
      );
    }

    // 8. COMMIT transaction
    await connection.commit();

    // 9. Clear cart from Redis
    await client.del(cartKey(userId));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order_id: orderId,
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        items_count: cartItems.length
      }
    });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    next(err);
  } finally {
    if (connection) await connection.close();
  }
};

// GET /api/orders — list current user's orders
const getMyOrders = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await db.connectDB();

    const result = await connection.execute(
      `SELECT o.order_id, o.order_date, o.total_amount, o.discount_amount,
              v.code AS voucher_code,
              (SELECT COUNT(*) FROM Order_Items oi WHERE oi.order_id = o.order_id) AS items_count
       FROM Orders o
       LEFT JOIN Vouchers v ON o.voucher_id = v.voucher_id
       WHERE o.user_id = :userId
       ORDER BY o.order_date DESC`,
      { userId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// GET /api/orders/:id — get order detail
const getOrderById = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    connection = await db.connectDB();

    const orderRes = await connection.execute(
      `SELECT o.*, v.code AS voucher_code
       FROM Orders o
       LEFT JOIN Vouchers v ON o.voucher_id = v.voucher_id
       WHERE o.order_id = :orderId AND o.user_id = :userId`,
      { orderId, userId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (!orderRes.rows[0])
      return res.status(404).json({ success: false, message: 'Order not found' });

    const itemsRes = await connection.execute(
      `SELECT oi.item_id, oi.product_id, p.name, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS subtotal
       FROM Order_Items oi
       JOIN Products p ON oi.product_id = p.product_id
       WHERE oi.order_id = :orderId`,
      { orderId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    res.status(200).json({
      success: true,
      data: { ...orderRes.rows[0], items: itemsRes.rows }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

module.exports = { placeOrder, getMyOrders, getOrderById };