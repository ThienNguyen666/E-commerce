/**
 * Build search query using dynamic SQL and bind Variables to prevent SQL injection 
 */
const buildSearchQuery = (filters) => {
      const { name, minPrice, maxPrice, categoryId } = filters;
      const page = parseInt(filters.page, 10);
      const limit = parseInt(filters.limit, 10);

      const pageNumber = Number.isNaN(page) ? 1 : page;
      const limitNumber = Number.isNaN(limit) ? 10 : limit;
      const offset = (pageNumber - 1) * limitNumber;

      let sql = `
      SELECT p.product_id, p.name, p.price, p.stock_quantity, 
             c.category_name, p.category_id,
             COUNT(*) OVER() AS total_count,
             SUM(p.stock_quantity) OVER() AS total_stock,
             SUM(p.price * p.stock_quantity) OVER() AS total_stock_value
      FROM Products p
      JOIN Categories c ON p.category_id = c.category_id
      WHERE 1=1
      `;

      const binds = {};

      // Partial match: Case-insensitive
      if (name && name !== '') {
            sql += ` AND LOWER(p.name) LIKE :name`;
            binds.name = `%${name.toLowerCase()}%`;
      }

      const minPriceNumber = parseFloat(minPrice);
      if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(minPriceNumber)) {
            sql += ` AND p.price >= :minPrice`;
            binds.minPrice = minPriceNumber;
      }

      const maxPriceNumber = parseFloat(maxPrice);
      if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(maxPriceNumber)) {
            sql += ` AND p.price <= :maxPrice`;
            binds.maxPrice = maxPriceNumber;
      }

      if (categoryId !== undefined && categoryId !== '') {
            const categoryNumber = parseInt(categoryId, 10);
            if (!Number.isNaN(categoryNumber)) {
                  sql += ` AND p.category_id = :categoryId`;
                  binds.categoryId = categoryNumber;
            }
      }

      // Pagination
      sql += ` ORDER BY p.created_at DESC 
             OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

      binds.offset = offset;
      binds.limit = limitNumber;

      return { sql, binds };
};

module.exports = { buildSearchQuery };