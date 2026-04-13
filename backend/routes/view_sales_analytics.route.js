const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/auth.middleware");
const { adminMiddleware } = require("../middleware/admin.middleware");
const { viewSalesAnalytics } = require("../controllers/view_sales_analytics.controller");
const { flexibleLimiter } = require("../middleware/rate_limiters.middleware");

router.get("/analytics", flexibleLimiter, authMiddleware, adminMiddleware, viewSalesAnalytics);

module.exports = router;
