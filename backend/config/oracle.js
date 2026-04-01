require("dotenv").config();

const oracledb = require("oracledb");

const dbConfig = {
      user : process.env.ORACLE_USER,
      password : process.env.ORACLE_PASSWORD,
      connectString : `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
};
async function connectDB () {
      try{
            const connection = await oracledb.getConnection(dbConfig);
            console.log("OracleDB connected");
            return connection;
      }catch(error){
            console.error("OracleDB connection error:",error);
            throw error;
      }
}

module.exports = {connectDB};