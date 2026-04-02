const { initPool, connectDB, closePool } = require("./oracle");
const { connectRedis } = require("./redis");

async function testDbConnection() {
      let connection;

      try {
            console.log("Testing connections...");

            // 1. Init pool
            await initPool();
            console.log("Oracle Pool OK");

            // 2. Get connection from pool
            connection = await connectDB();

            // 3. Test simple query
            await connection.execute(`SELECT 1 FROM dual`);
            console.log("OracleDB query OK");

            // 4. Test Redis
            await connectRedis();
            console.log("Redis OK");

            console.log("All connections successful");
            process.exit(0);

      } catch (error) {
            console.error("Connection failed:", error);
            process.exit(1);

      } finally {
            if (connection) {
                  await connection.close();
            }

            await closePool();
      }   
}

testDbConnection();