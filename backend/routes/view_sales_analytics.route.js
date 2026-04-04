const express = require("express");
const router = express.Router();

const RateLimit = require("express-rate-limit");

const viewSalesAnalyticsController = require("../controllers/view_sales_analytics.controller");

const analyticsLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for analytics
});

router.get("/analytics", analyticsLimiter, viewSalesAnalyticsController.viewSalesAnalytics);

module.exports = router;
