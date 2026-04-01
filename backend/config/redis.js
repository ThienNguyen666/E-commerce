require("dotenv").config();

const  { createClient } = require("redis");;

const client = createClient({
      socket : {
            host : process.env.REDIS_HOST,
            port : process.env.REDIS_PORT,
      },
      password : process.env.REDIS_PASSWORD || undefined
})

client.on("error",err => {
      console.log("Redis error : ",err);
})

async function connectRedis() {
      try{
            const connection = await client.connect();
            console.log("Redis connected");
            return connection;
      }catch(error){
            console.error("Error when connecting to Redis: ",error);
      }
}

module.exports = {client, connectRedis};