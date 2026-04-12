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
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.full_name AS user_name,
              COUNT(*) OVER() AS total_count
       FROM Reviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.product_id = :productId
       ORDER BY r.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { productId, offset, limit },
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
       WHERE product_id = :productId`,
      { productId },
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
      `SELECT product_id FROM Products WHERE product_id = :productId`,
      { productId }
    );
    if (!prodCheck.rows[0])
      return res.status(404).json({ success: false, message: 'Product not found' });

    // Check user has purchased this product (optional but good practice)
    // We allow review only if user has ordered this product
    const purchaseCheck = await connection.execute(
      `SELECT 1 FROM Order_Items oi
       JOIN Orders o ON oi.order_id = o.order_id
       WHERE o.user_id = :userId AND oi.product_id = :productId
         AND ROWNUM = 1`,
      { userId, productId }
    );
    if (!purchaseCheck.rows[0])
      return res.status(403).json({ success: false, message: 'You must purchase this product before reviewing' });

    const result = await connection.execute(
      `INSERT INTO Reviews (product_id, user_id, rating, comment)
       VALUES (:productId, :userId, :rating, :comment)
       RETURNING review_id INTO :reviewId`,
      {
        productId, userId,
        rating: parseInt(rating),
        comment: comment || null,
        reviewId: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted',
      data: { review_id: result.outBinds.reviewId[0], product_id: productId, rating, comment }
    });
  } catch (err) {
    if (err.errorNum === 1) // ORA-00001 unique constraint
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    next(err);
  } finally {
    if (connection) await connection.close();
  }
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
           comment = COALESCE(:comment, comment),
           updated_at = CURRENT_TIMESTAMP
       WHERE review_id = :reviewId AND user_id = :userId`,
      { rating: rating ? parseInt(rating) : null, comment: comment || null, reviewId, userId },
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
      `DELETE FROM Reviews WHERE review_id = :reviewId AND user_id = :userId`,
      { reviewId, userId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0)
      return res.status(404).json({ success: false, message: 'Review not found or not yours' });

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
  finally { if (connection) await connection.close(); }
};

module.exports = { getProductReviews, createReview, updateReview, deleteReview };