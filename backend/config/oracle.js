require("dotenv").config();

const oracledb = require("oracledb");

const requestedPrivilege = (process.env.ORACLE_PRIVILEGE || "").toUpperCase();

const dbConfig = {
      user : process.env.ORACLE_USER,
      password : process.env.ORACLE_PASSWORD,
      connectString : `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
      poolMin : 2,
      poolMax : 10,
      poolIncrement : 1,
};

// Only use SYSDBA when explicitly requested in .env
if (requestedPrivilege === "SYSDBA") {
      dbConfig.privilege = oracledb.SYSDBA;
}

async function initPool() {
      try {
            await oracledb.createPool(dbConfig);
            console.log("Oracle Pool created");
      }catch(error){
            console.error("Error creating pool:", error);
            throw error;
      }
}

async function connectDB () {
      try{
            const connection = await oracledb.getConnection();

            // Allow connecting as one user while querying tables in another schema.
            if (process.env.ORACLE_SCHEMA) {
                  const schema = process.env.ORACLE_SCHEMA.toUpperCase();
                  if (!/^[A-Z][A-Z0-9_]*$/.test(schema)) {
                        throw new Error("Invalid ORACLE_SCHEMA format");
                  }
                  await connection.execute(
                        `ALTER SESSION SET CURRENT_SCHEMA = ${schema}`
                  );
            }

            console.log("OracleDB connected");
            return connection;
      }catch(error){
            console.error("OracleDB connection error:",error);
            throw error;
      }
}

async function closePool() {
      try {
            await oracledb.getPool().close(10);
            console.log("Pool closed");
      } catch (error) {
            console.error("Error closing pool:", error);
      }
}

module.exports = {
      initPool,
      connectDB,
      closePool,
      oracledb
};