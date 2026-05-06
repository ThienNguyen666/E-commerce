const db = require('../config/oracle');

// GET all products (paginated)
// GET all products (paginated)
const getAllProducts = async (req, res, next) => {
  let connection;
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT p.product_id, p.name, p.price, p.stock_quantity,
              p.category_id, c.category_name,
              COUNT(*) OVER() AS total_count,
              SUM(p.stock_quantity) OVER() AS total_stock,
              SUM(p.price * p.stock_quantity) OVER() AS total_stock_value
       FROM Products p
       JOIN Categories c ON p.category_id = c.category_id
       ORDER BY p.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const total = result.rows.length > 0 ? result.rows[0].TOTAL_COUNT : 0;
    const totalStock = result.rows.length > 0 ? result.rows[0].TOTAL_STOCK : 0;
    const totalStockValue = result.rows.length > 0 ? result.rows[0].TOTAL_STOCK_VALUE : 0;

    res.status(200).json({
      success: true,
      data: result.rows.map(({ TOTAL_COUNT, TOTAL_STOCK, TOTAL_STOCK_VALUE, ...rest }) => rest),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: { totalStock, totalStockValue }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// GET single product
const getProductById = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT p.product_id, p.name, p.price, p.stock_quantity,
              p.category_id, p.created_at, p.updated_at, c.category_name,
              ROUND(AVG(r.rating), 1) AS avg_rating,
              COUNT(r.review_id)      AS review_count
       FROM Products p
       JOIN Categories c ON p.category_id = c.category_id
       LEFT JOIN Reviews r ON p.product_id = r.product_id
       WHERE p.product_id = :id
       GROUP BY p.product_id, p.name, p.price, p.stock_quantity,
                p.category_id, p.created_at, p.updated_at, c.category_name`,
      { id: parseInt(id) },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows[0])
      return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// POST create product
const createProduct = async (req, res, next) => {
  let connection;
  try {
    const { name, price, stock_quantity, category_id } = req.body;
    if (!name || price === undefined || stock_quantity === undefined || !category_id)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    connection = await db.connectDB();
    const result = await connection.execute(
      `INSERT INTO Products (name, price, stock_quantity, category_id)
       VALUES (:name, :price, :stock_quantity, :category_id)
       RETURNING product_id INTO :id`,
      {
        name,
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity),
        category_id: parseInt(category_id),
        id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Product created',
      data: { product_id: result.outBinds.id[0], name, price, stock_quantity, category_id }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// PUT update product
const updateProduct = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, price, stock_quantity, category_id } = req.body;

    const fields = [];
    const binds  = { id: parseInt(id) };

    if (name            !== undefined) { fields.push('name = :name');                       binds.name = name; }
    if (price           !== undefined) { fields.push('price = :price');                     binds.price = parseFloat(price); }
    if (stock_quantity  !== undefined) { fields.push('stock_quantity = :stock_quantity');   binds.stock_quantity = parseInt(stock_quantity); }
    if (category_id     !== undefined) { fields.push('category_id = :category_id');         binds.category_id = parseInt(category_id); }

    if (fields.length === 0)
      return res.status(400).json({ success: false, message: 'No fields to update' });

    fields.push('updated_at = CURRENT_TIMESTAMP');

    connection = await db.connectDB();
    const result = await connection.execute(
      `UPDATE Products SET ${fields.join(', ')} WHERE product_id = :id`,
      binds,
      { autoCommit: true }
    );

    if (result.rowsAffected === 0)
      return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, message: 'Product updated' });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// DELETE product
const deleteProduct = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.connectDB();
    const result = await connection.execute(
      `DELETE FROM Products WHERE product_id = :id`,
      { id: parseInt(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0)
      return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    // ORA-02292: child record found (e.g., Order_Items references this product)
    if (err && err.errorNum === 2292) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this product because it already exists in order history'
      });
    }
    next(err);
  }
  finally { if (connection) await connection.close(); }
};

// GET all categories
const getCategories = async (req, res, next) => {
  let connection;
  try {
    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT category_id, category_name FROM Categories ORDER BY category_name`,
      {},
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories };