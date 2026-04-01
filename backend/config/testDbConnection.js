const { connectDB } = require("./oracle")
const { connectRedis } = require("./redis")

async function testDbConnection() {
      try {
            console.log("Testing connections...");

            await connectDB();
            console.log("OracleDB OK");

            await connectRedis();
            console.log("Redis OK");

            console.log("All connections successful");
            process.exit(0);

            } catch (error) {
            console.error("Connection failed:", error);
            process.exit(1);
      }      
}

testDbConnection();