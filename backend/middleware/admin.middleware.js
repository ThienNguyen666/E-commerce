const db = require("../config/oracle");
const { isAdminEmail } = require("../utils/admin.util");

const adminMiddleware = async (req, res, next) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    connection = await db.connectDB();
    const result = await connection.execute(
      `SELECT email FROM Users WHERE user_id = :id`,
      { id: Number(userId) },
      { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
    );

    const email = result.rows?.[0]?.EMAIL;
    if (!isAdminEmail(email)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.admin = { email };
    next();
  } catch (error) {
    next(error);
  } finally {
    if (connection) await connection.close();
  }
};

module.exports = { adminMiddleware };
