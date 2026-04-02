const validateSearchQuery = (req, res, next) => {
      const { minPrice, maxPrice, page, limit } = req.query;

      if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
            return res.status(400).json({ 
                  success: false, 
                  message: "minPrice cannot be greater than maxPrice" 
            });
      }

      // Pagination casting
      req.query.page = parseInt(page) || 1;
      req.query.limit = parseInt(limit) || 10;

      next();
};

module.exports = validateSearchQuery;