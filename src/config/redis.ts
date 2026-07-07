import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis(process.env.REDIS_HOST as string, {
    lazyConnect: true,
    retryStrategy(times) {
        if(times > 3) {
            console.log("Redis failed to connect after 3 attempts. Exiting...");
            return null;
        }
        const delay = Math.min(times * 200, 1000);
        return delay;
    },
});

redisClient.on("connect", () => {
    console.log("Redis connected successfully");
});

redisClient.on("error", (error) => {
    console.error("Error connecting to Redis: ", error);
});


export default redisClient;