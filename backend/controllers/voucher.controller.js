const db = require('../config/oracle');

// POST /api/vouchers/validate — check if a voucher is usable
const validateVoucher = async (req, res, next) => {
  let connection;
  try {
    const { code, order_total } = req.body;
    const userId = req.user.id;

    if (!code || order_total === undefined)
      return res.status(400).json({ success: false, message: 'code and order_total are required' });

    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT v.voucher_id, v.code, v.discount_type, v.discount_value, v.min_order_value
       FROM Vouchers v
       WHERE v.code = :code
         AND v.is_active = 1
         AND (v.expires_at IS NULL OR v.expires_at > SYSTIMESTAMP)
         AND (v.max_uses IS NULL OR v.used_count < v.max_uses)
         AND v.min_order_value <= :orderTotal
         AND NOT EXISTS (
               SELECT 1 FROM Voucher_Usage vu
               WHERE vu.voucher_id = v.voucher_id AND vu.user_id = :userId
             )`,
      { code, orderTotal: parseFloat(order_total), userId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows[0])
      return res.status(400).json({ success: false, message: 'Voucher invalid, expired, already used, or order total too low' });

    const v = result.rows[0];
    const discount = v.DISCOUNT_TYPE === 'percent'
      ? (parseFloat(order_total) * v.DISCOUNT_VALUE) / 100
      : Math.min(v.DISCOUNT_VALUE, parseFloat(order_total));

    res.status(200).json({
      success: true,
      data: {
        voucher_id:     v.VOUCHER_ID,
        code:           v.CODE,
        discount_type:  v.DISCOUNT_TYPE,
        discount_value: v.DISCOUNT_VALUE,
        discount_amount: parseFloat(discount.toFixed(2)),
        final_total:    parseFloat((parseFloat(order_total) - discount).toFixed(2))
      }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// GET /api/vouchers — list all active vouchers (admin)
const getAllVouchers = async (req, res, next) => {
  let connection;
  try {
    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT voucher_id, code, discount_type, discount_value,
              min_order_value, max_uses, used_count, expires_at, is_active
       FROM Vouchers
       ORDER BY created_at DESC`,
      {},
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

const getUserVouchers = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT v.voucher_id, v.code, v.discount_type, v.discount_value,
              v.min_order_value, v.max_uses, v.used_count, v.expires_at, v.is_active
       FROM Vouchers v
       WHERE v.is_active = 1
         AND (v.expires_at IS NULL OR v.expires_at > SYSTIMESTAMP)
         AND (v.max_uses IS NULL OR v.used_count < v.max_uses)
         AND NOT EXISTS (
               SELECT 1 FROM Voucher_Usage vu
               WHERE vu.voucher_id = v.voucher_id AND vu.user_id = :userId
             )
       ORDER BY v.created_at DESC`,
      { userId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

const getAllValidVouchers = async (req, res, next) => {
  let connection;
  try {
    const { order_total } = req.query;
    const userId = req.user.id;
    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT v.voucher_id, v.code, v.discount_type, v.discount_value, v.min_order_value
        FROM vouchers v
        WHERE v.is_active = 1
          AND (v.expires_at IS NULL OR v.expires_at > SYSTIMESTAMP)
          AND (v.max_uses IS NULL OR v.used_count < v.max_uses)
          AND v.min_order_value <= :orderTotal
          AND NOT EXISTS (
                SELECT 1 FROM Voucher_Usage vu
                WHERE vu.voucher_id = v.voucher_id AND vu.user_id = :userId
              )`,
      { orderTotal: parseFloat(order_total), userId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );
    if(!result.rows[0]){
      return res.status(400).json({ success: false, message: 'No valid vouchers available for this order total' });
    }
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

module.exports = { validateVoucher, getAllVouchers, getUserVouchers, getAllValidVouchers };