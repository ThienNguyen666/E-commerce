const express = require("express");
const server = express();
const { initPool } = require("./config/oracle");
const { connectRedis } = require("./config/redis");

// Routes
const authRoute            = require("./routes/auth.route");
const productRoute         = require("./routes/product.route");
const advancedSearchRoute  = require("./routes/advanced_search.route");
const cartRoute            = require("./routes/cart.route");
const orderRoute           = require("./routes/order.route");
const voucherRoute         = require("./routes/voucher.route");
const reviewRoute          = require("./routes/review.route");
const viewSalesAnalyticsRoute = require("./routes/view_sales_analytics.route");

const errorHandler = require("./middleware/error_handler.middleware");

server.use(express.json());

// Trust proxy for rate limiting behind reverse proxy
server.set('trust proxy', 1);

// CORS for frontend (dev)
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3002");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const port = process.env.PORT || 3000;

// Mount routes
server.use("/api/auth",                  authRoute);
server.use("/api/products",              advancedSearchRoute);          // GET /api/products/search
server.use("/api/products",              productRoute);
server.use("/api/products/:id/reviews",  reviewRoute);
server.use("/api/cart",                  cartRoute);
server.use("/api/orders",                orderRoute);
server.use("/api/vouchers",              voucherRoute);
server.use("/api",                       viewSalesAnalyticsRoute);       // GET /api/analytics

// Global Error Handler
server.use(errorHandler);

async function startServer() {
  try {
    await initPool();
    await connectRedis();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();