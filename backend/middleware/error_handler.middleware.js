const errorHandler = (err, req, res, next) => {
      console.error('Error Stack:', err.stack);

      const statusCode = err.statusCode || 500;
      
      res.status(statusCode).json({
            success: false,

            message: err.message || 'Internal Server Error',

            // Only send error details in development environment
            error: process.env.NODE_ENV === 'development' ? err : {}
      });
};

module.exports = errorHandler;