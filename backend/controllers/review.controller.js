const db = require('../config/oracle');

// GET /api/products/:id/reviews
const getProductReviews = async (req, res, next) => {
  let connection;
  try {
    const productId = parseInt(req.params.id);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection = await db.connectDB();

    const result = await connection.execute(
      `SELECT review_id, rating, comments , created_at, user_name, total_count
       FROM (
         SELECT r.review_id, r.rating, r.comments, r.created_at,
                u.full_name AS user_name,
                COUNT(*) OVER() AS total_count,
                ROW_NUMBER() OVER (ORDER BY r.created_at DESC) as rn
         FROM Reviews r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.product_id = :v1
       ) WHERE rn BETWEEN :v2 + 1 AND :v2 + :v3`,
      { v1: productId, v2: offset, v3: limit },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const statsRes = await connection.execute(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating,
              COUNT(*) AS total_reviews,
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
              SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
              SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
              SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
              SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
       FROM Reviews
       WHERE product_id = :v1`,
      { v1: productId },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const total = result.rows.length > 0 ? result.rows[0].TOTAL_COUNT : 0;
    res.status(200).json({
      success: true,
      data: result.rows.map(({ TOTAL_COUNT, ...r }) => r),
      stats: statsRes.rows[0],
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// POST /api/products/:id/reviews
const createReview = async (req, res, next) => {
  let connection;
  try {
    const userId    = req.user.id;
    const productId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    connection = await db.connectDB();

    // Check product exists
    const prodCheck = await connection.execute(
      `SELECT product_id FROM Products WHERE product_id = :v1`,
      { v1: productId }
    );
    if (!prodCheck.rows[0])
      return res.status(404).json({ success: false, message: 'Product not found' });

    // Check user has purchased this product (optional but good practice)
    // We allow review only if user has ordered this product
    const purchaseCheck = await connection.execute(
      `SELECT 1 FROM Order_Items oi
       JOIN Orders o ON oi.order_id = o.order_id
       WHERE o.user_id = :v1 AND oi.product_id = :v2
         AND ROWNUM = 1`,
      { v1: userId, v2: productId }
    );
    if (!purchaseCheck.rows[0])
      return res.status(403).json({ success: false, message: 'You must purchase this product before reviewing' });

    const result = await connection.execute(
      `INSERT INTO Reviews (product_id, user_id, rating, comments)
       VALUES (:v1, :v2, :rating, :cmt)`,
      {
        v1: productId, v2: userId,
        rating: { val: parseInt(rating), type: db.oracledb.NUMBER },
        cmt: { val: comment || null, type: db.oracledb.STRING }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted',
      data: { product_id: productId, rating, comment }
    });
  } catch (err) {
    if (err.errorNum === 1) // ORA-00001 unique constraint
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    next(err);
  } finally {
    if (connection) await connection.close();
  }
};

// GET /api/reviews/my
const getUserReviews = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection = await db.connectDB();

    const result = await connection.execute(
      `SELECT review_id, rating, comments , created_at, product_id, product_name, category_name, total_count
        FROM (
          SELECT 
                r.review_id, 
                r.rating, 
                r.comments, 
                r.created_at,
                p.product_id, 
                p.name AS product_name, 
                c.category_name,
                COUNT(*) OVER() AS total_count,
                ROW_NUMBER() OVER (ORDER BY r.created_at DESC) AS rn
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          JOIN Categories c ON p.category_id = c.category_id
          WHERE r.user_id = :v1
        ) 
        WHERE rn BETWEEN :v2 + 1 AND :v2 + :v3`,
      { v1: userId, v2: offset, v3: limit },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const total = result.rows.length > 0 ? result.rows[0].TOTAL_COUNT : 0;
    res.status(200).json({
      success: true,
      data: result.rows.map(({ TOTAL_COUNT, ...r }) => r),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// GET /api/reviews/to-review
const getProductsToReview = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection = await db.connectDB();

    const result = await connection.execute(
      `SELECT product_id, product_name, category_name, order_date
        FROM (
          SELECT DISTINCT 
                p.product_id, 
                p.name AS product_name, 
                c.category_name AS category_name, 
                o.created_at AS order_date,
                COUNT(*) OVER() AS total_count,
                ROW_NUMBER() OVER (ORDER BY o.created_at DESC) as rn
          FROM Order_Items oi
          JOIN Orders o ON oi.order_id = o.order_id
          JOIN Products p ON oi.product_id = p.product_id
          JOIN Categories c ON p.category_id = c.category_id
          WHERE o.user_id = :v1
            AND NOT EXISTS (
              SELECT 1 FROM Reviews r 
              WHERE r.product_id = p.product_id 
                AND r.user_id = :v1
            )
        ) 
        WHERE rn BETWEEN :v2 + 1 AND :v2 + :v3`,
      { v1: userId, v2: offset, v3: limit },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const total = result.rows.length > 0 ? result.rows[0].TOTAL_COUNT : 0;
    res.status(200).json({
      success: true,
      data: result.rows.map(({ TOTAL_COUNT, ...r }) => r),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// PUT /api/products/:productId/reviews/:reviewId
const updateReview = async (req, res, next) => {
  let connection;
  try {
    const userId   = req.user.id;
    const reviewId = parseInt(req.params.reviewId);
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5))
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    connection = await db.connectDB();
    const result = await connection.execute(
      `UPDATE Reviews
       SET rating = COALESCE(:rating, rating),
           comments = COALESCE(:cmt, comments),
           updated_at = CURRENT_TIMESTAMP
       WHERE review_id = :v1 AND user_id = :v2`,
      { 
        rating: rating ? { val: parseInt(rating), type: db.oracledb.NUMBER } : null, 
        cmt: { val: comment || null, type: db.oracledb.STRING }, 
        v1: reviewId, v2: userId 
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0)
      return res.status(404).json({ success: false, message: 'Review not found or not yours' });

    res.status(200).json({ success: true, message: 'Review updated' });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

// DELETE /api/products/:productId/reviews/:reviewId
const deleteReview = async (req, res, next) => {
  let connection;
  try {
    const userId   = req.user.id;
    const reviewId = parseInt(req.params.reviewId);

    connection = await db.connectDB();
    const result = await connection.execute(
      `DELETE FROM Reviews WHERE review_id = :v1 AND user_id = :v2`,
      { v1: reviewId, v2: userId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0)
      return res.status(404).json({ success: false, message: 'Review not found or not yours' });

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

module.exports = { getProductReviews, getUserReviews, getProductsToReview, createReview, updateReview, deleteReview };