import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});

redisClient.on("connect", () => {
    console.log("Redis connected successfully");
});

redisClient.on("error", (error) => {
    console.error("Error connecting to Redis: ", error);
});


export default redisClient;