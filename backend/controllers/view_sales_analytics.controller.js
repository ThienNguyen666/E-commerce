// Dummy controller
const viewSalesAnalytics = (req, res, next) => {
      res.status(200).json({success: true, message: "View Sales Analytics"});
}

module.exports = { viewSalesAnalytics };