const db = require('../config/oracle');
const { client: redisClient } = require('../config/redis');

const viewSalesAnalytics = async (req, res, next) => {
      let connection;
      const { type } = req.query; // 'monthly' || 'category'
      const cacheKey = `analytics:${type}`;

      try {
            // 1. Test Redis Cache
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                  console.log("Serving from Redis Cache");
                  return res.status(200).json({ 
                        success: true, data: JSON.parse(cachedData), source: 'cache' 
                  });
            }

            connection = await db.connectDB();
            let sql = "";
            let binds = {};

            if (type === 'monthly') {
                  // Total revenue monthly in last 12 months
                  sql = `
                  SELECT TO_CHAR(order_date, 'YYYY-MM') AS period,
                        SUM(total_amount) AS total_revenue,
                        COUNT(order_id) AS total_orders,
                        ROUND(AVG(total_amount), 2) AS avg_order_value
                  FROM Orders
                  WHERE order_date >= ADD_MONTHS(SYSTIMESTAMP, -12)
                  GROUP BY TO_CHAR(order_date, 'YYYY-MM')
                  ORDER BY period DESC
                  `;
            } else if (type === 'category') {
                  // Total orders categorized by category_name
                  sql = `
                  SELECT c.category_name,
                        SUM(oi.quantity * oi.unit_price) AS total_revenue,
                        COUNT(DISTINCT oi.order_id) AS total_orders
                  FROM Categories c
                  JOIN Products p ON c.category_id = p.category_id
                  JOIN Order_Items oi ON p.product_id = oi.product_id
                  GROUP BY c.category_name
                  ORDER BY total_revenue DESC
                  `;
            } else {
                  return res.status(400).json({ 
                        success: false, message: "Invalid type. Use 'monthly' or 'category'" 
                  });
            }

            const result = await connection.execute(sql, binds, {
                  outFormat: db.oracledb.OUT_FORMAT_OBJECT
            });

            // 2. Save to Redis Cache (TTL: 1 hour - 3600s)
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(result.rows));

            res.status(200).json({
                  success: true,
                  data: result.rows,
                  source: 'database'
            });

      } catch (error) {
            next(error);
      } finally {
            if (connection) await connection.close();
      }
};

module.exports = { viewSalesAnalytics };