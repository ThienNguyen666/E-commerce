const bcrypt = require('bcrypt');
const db = require('../config/oracle');
const { generateToken } = require('../utils/auth.util');

const register = async (req, res, next) => {
      const { full_name, email, password } = req.body;
      let connection;

      try {
            connection = await db.connectDB();

            // 1. Check for duplicate email
            const checkUser = await connection.execute(
                  `SELECT user_id FROM Users WHERE email = :email`,
                  { email }
            );

            if (checkUser.rows.length > 0) {
                  return res.status(400).json({ 
                        success: false, 
                        message: 'Email aleady existed' 
                  });
            }

            // 2. Hash Password (Salt rounds = 10)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 3. Save to Oracle DB
            // Use returning to get ID without making another query
            const sql = `
                  INSERT INTO Users (full_name, email, hashed_password)
                  VALUES (:full_name, :email, :hashed_password)
                  RETURNING user_id INTO :id
            `;

            const result = await connection.execute(sql, {
                  full_name,
                  email,
                  hashed_password: hashedPassword,
                  id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
            }, { autoCommit: true });

            const userId = result.outBinds.id[0];

            // 4. Create JWT
            const token = generateToken({ id: userId });

            res.status(201).json({
                  success: true,
                  message: 'Registered successfully',
                  token,
                  user: { id: userId, full_name, email }
            });

      } catch (error) {
            next(error);
      } finally {
            if (connection) await connection.close();
      }
};

const login = async (req, res, next) => {
      const { email, password } = req.body;
      let connection;

      try {
            connection = await db.connectDB();

            // 1. Find user by email
            const result = await connection.execute(
                  `SELECT user_id, full_name, email, hashed_password FROM Users WHERE email = :email`,
                  { email },
                  { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
            );

            const user = result.rows[0];

            if (!user) {
                  return res.status(401).json({ 
                        success: false, 
                        message: 'Username or password is incorrect' 
                  });
            }

            // 2. Validate password
            const isMatch = await bcrypt.compare(password, user.HASHED_PASSWORD);

            if (!isMatch) {
                  return res.status(401).json({ 
                        success: false, 
                        message: 'Username or password is incorrect' 
                  });
            }

            // 3. Create JWT
            const token = generateToken({ id: user.USER_ID });

            res.status(200).json({
                  success: true,
                  token,
                  user: {
                  id: user.USER_ID,
                  full_name: user.FULL_NAME,
                  email: user.EMAIL
                  }
            });

      } catch (error) {
            next(error);
      } finally {
            if (connection) await connection.close();
      }
};

module.exports = {login,register}