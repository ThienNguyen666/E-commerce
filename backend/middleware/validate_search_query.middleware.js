const validateSearchQuery = (req, res, next) => {
      const { minPrice, maxPrice, page, limit, categoryId } = req.query;

      if (minPrice !== undefined && maxPrice !== undefined && minPrice !== '' && maxPrice !== '' && parseFloat(minPrice) > parseFloat(maxPrice)) {
            return res.status(400).json({ 
                  success: false, 
                  message: "minPrice cannot be greater than maxPrice" 
            });
      }

      // Pagination casting
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      req.query.page = Number.isNaN(pageNumber) ? 1 : pageNumber;
      req.query.limit = Number.isNaN(limitNumber) ? 10 : limitNumber;

      // CategoryId should be numeric when provided
      if (categoryId !== undefined && categoryId !== '') {
            const categoryNumber = parseInt(categoryId, 10);
            req.query.categoryId = Number.isNaN(categoryNumber) ? undefined : categoryNumber;
      }

      next();
};

module.exports = validateSearchQuery;