/**
 * Build search query using dynamic SQL and bind Variables to prevent SQL injection 
 */
const buildSearchQuery = (filters) => {
      const { name, minPrice, maxPrice, categoryId, page = 1, limit = 10 } = filters;

      let sql = `
      SELECT p.product_id, p.name, p.price, p.stock_quantity, 
            c.category_name, p.category_id,
            COUNT(*) OVER() AS total_count
      FROM Products p
      JOIN Categories c ON p.category_id = c.category_id
      WHERE 1=1
      `;

      const binds = {};
      const offset = (page - 1) * limit;

      // Partial match: Case-insensitive
      if (name) {
            sql += ` AND LOWER(p.name) LIKE :name`;
            binds.name = `%${name.toLowerCase()}%`;
      }

      if (minPrice) {
            sql += ` AND p.price >= :minPrice`;
            binds.minPrice = parseFloat(minPrice);
      }

      if (maxPrice) {
            sql += ` AND p.price <= :maxPrice`;
            binds.maxPrice = parseFloat(maxPrice);
      }

      if (categoryId) {
            sql += ` AND p.category_id = :categoryId`;
            binds.categoryId = parseInt(categoryId);
      }

      // Pagination
      sql += ` ORDER BY p.created_at DESC 
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

      binds.offset = offset;
      binds.limit = parseInt(limit);

      return { sql, binds };
};

module.exports = { buildSearchQuery };