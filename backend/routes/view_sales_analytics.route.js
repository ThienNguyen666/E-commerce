const express = require("express");
const router = express.Router();

const viewSalesAnalyticsController = require("../controllers/view_sales_analytics.controller");

router.get("/analytics", viewSalesAnalyticsController.viewSalesAnalytics);

module.exports = router;
