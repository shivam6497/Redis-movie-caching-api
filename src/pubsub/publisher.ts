import redisClient from "../config/redis.js";

export const Channels = {
    URL_CREATED: "url:created",
    URL_CLICKED: "url:clicked",
    URL_LIMIT_REACHED: "url:limit:reached",
} as const;

export async function publishUrlCreated(data: { 
    userId: string;
    shortCode: string;
    originalUrl: string;
}) {
    const message = JSON.stringify(data);
    await redisClient.publish(Channels.URL_CREATED, message);
    console.log(`Published message to channel ${Channels.URL_CREATED}: ${message}`);
}

export async function publishUrlClicked(data: {
    shortCode: string;
    ip: string;
    userAgent: string;
    timestamp: number;
}) {
    const message = JSON.stringify(data);
    await redisClient.publish(Channels.URL_CLICKED, message);
    console.log(`Published message to channel ${Channels.URL_CLICKED}: ${message}`);
}

export async function publishUrlLimitReached(data: {
    userId: string;
    currentCount: number;
    limit: number;
}) {
    const message = JSON.stringify(data);
    await redisClient.publish(Channels.URL_LIMIT_REACHED, message);
    console.log(`Published message to channel ${Channels.URL_LIMIT_REACHED}: ${message}`);
}