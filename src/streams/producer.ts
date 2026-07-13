import redisClient from "../config/redis.js";
import { Streams } from "./streamkeys.js";

export async function publishOrder(order: {
    orderId: string;
    userId: string;
    item: string;
    quantity: number;
}) {
    const id = await redisClient.xadd(
        Streams.ORDERS,
        "*",
        "orderId", order.orderId,
        "userId", order.userId,
        "item", order.item,
        "quantity", String(order.quantity)
    );

    console.log(`Order publish to streams with ID: ${id}`);
    return id;
}