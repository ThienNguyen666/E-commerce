require("dotenv").config();

const oracledb = require("oracledb");

const dbConfig = {
      user : process.env.ORACLE_USER,
      password : process.env.ORACLE_PASSWORD,
      connectString : `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
      privilege : oracledb.SYSDBA,
      poolMin : 2,
      poolMax : 10,
      poolIncrement : 1,
};

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