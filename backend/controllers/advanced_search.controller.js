const db = require('../config/oracle');
const { buildSearchQuery } = require('../utils/queryBuilder');

const searchProducts = async (req, res, next) => {
      let connection;
      try {
            const { sql, binds } = buildSearchQuery(req.query);

            connection = await db.connectDB();
                  
            const result = await connection.execute(sql, binds, {
                  outFormat: db.oracledb.OUT_FORMAT_OBJECT
            });

            const products = result.rows;
            const totalRecords = products.length > 0 ? products[0].TOTAL_COUNT : 0;
            const totalStock = products.length > 0 ? products[0].TOTAL_STOCK : 0;             
            const totalStockValue = products.length > 0 ? products[0].TOTAL_STOCK_VALUE : 0;   

            res.status(200).json({
                  success: true,
                  data: products.map(p => {
                        const { TOTAL_COUNT, TOTAL_STOCK, TOTAL_STOCK_VALUE, ...rest } = p; 
                        return rest;
                  }),
                  pagination: {
                        total: totalRecords,
                        page: req.query.page,
                        limit: req.query.limit,
                        totalPages: Math.ceil(totalRecords / req.query.limit)
                  },
                  stats: { totalStock, totalStockValue } 
            });

            } catch (error) {
                  next(error); 
            } finally {
                  if (connection) {
                        try {
                              await connection.close();
                        } catch (err) {
                              console.error(err);
                        }
                  }
      }
};

module.exports = { searchProducts };