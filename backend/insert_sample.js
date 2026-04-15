const { initPool } = require('./config/oracle');

async function insertSampleOrder() {
  try {
    await initPool();
    const db = require('./config/oracle');
    let connection;
    try {
      connection = await db.connectDB();
      // Insert order for user 1001
      const orderResult = await connection.execute(
        `INSERT INTO Orders (user_id, total_amount) VALUES (1001, 100) RETURNING order_id INTO :id`,
        { id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT } },
        { autoCommit: true }
      );
      const orderId = orderResult.outBinds.id[0];
      console.log('Inserted order:', orderId);

      // Insert order item
      await connection.execute(
        `INSERT INTO Order_Items (order_id, product_id, quantity, unit_price) VALUES (:o, 1, 1, 50)`,
        { o: orderId },
        { autoCommit: true }
      );
      console.log('Inserted order item');
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) await connection.close();
    }
  } catch (err) {
    console.error('Init pool error:', err);
  }
}

insertSampleOrder();