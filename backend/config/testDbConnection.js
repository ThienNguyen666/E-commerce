const { initPool, connectDB, closePool } = require("./oracle");
const { client,connectRedis } = require("./redis");

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

      } catch (error) {
            console.error("Connection failed:", error);
      } finally {
            if (connection) {
                  await connection.close();
            }

            if(client.isOpen){
                  client.destroy();
                  console.log("Redis destroyed");
            }
            await closePool();
      }   
}

testDbConnection();