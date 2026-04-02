const express = require("express");
const server = express();
const { initPool } = require("./config/oracle");

const advancedSearchRoute = require("./routes/advanced_search.route");
const viewSalesAnalyticsRoute = require("./routes/view_sales_analytics.route");

const errorHandler = require("./middleware/error_handler.middleware");

server.use(express.json());

const port = process.env.PORT || 3000;

// Routes
server.use('/api/products', advancedSearchRoute);
server.use('/api/sales', viewSalesAnalyticsRoute);

// Global Error Handler
server.use(errorHandler);

async function startServer() {
      try{
            await initPool();
            server.listen(port, () => {
                  console.log(`Server running on port ${port}`);
            })
      }catch(error){
            console.error("Error starting server:", error);
      }
}

startServer();