import redisClient from "../config/redis.js";
import { Streams, Groups } from "./streamkeys.js";

const CONSUMER_NAME = "inventory-consumer-1";

async function ensureGroupExists() {
  try {
    await redisClient.xgroup(
      "CREATE",
      Streams.ORDERS,
      Groups.INVENTORY,
      "$",
      "MKSTREAM",
    );

    console.log(`Consumer group ${Groups.INVENTORY} created successfully.`);
  } catch (err: any) {
    if (err.message.includes("BUSYGROUP")) {
      console.log(`Consumer group ${Groups.INVENTORY} already exists.`);
    } else {
      throw err;
    }
  }
}

async function processPendingMessages() {
  const pending = (await redisClient.xreadgroup(
    "GROUP",
    Groups.INVENTORY,
    CONSUMER_NAME,
    "COUNT",
    "10",
    "STREAMS",
    Streams.ORDERS,
    "0",
  )) as Array<[string, Array<[string, string[]]>]> | null;

  if (pending && pending.length > 0) {
    const messages = pending[0]?.[1] as Array<[string, string[]]> | undefined;
    if(messages && messages.length > 0) {
        console.log(`Processing ${messages.length} pending messages...`);
        await handleMessages(messages);
    }
  }
}

async function handleMessages(messages: any[]) {
    for (const [id, fields] of messages) {
        const data: Record<string, string> = {};
        for(let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
        }

        console.log(`Processing message ID: ${id}, Data:`, data);
        console.log(`Items: ${data.item}, Quantity: ${data.quantity}`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // 10 second delay

        await redisClient.xack(Streams.ORDERS, Groups.INVENTORY, id);
        console.log(`Acknowledged message ID: ${id}`);
    }
}


async function startConsumer() {
    await ensureGroupExists();
    await processPendingMessages();

    console.log(`Consumer ${CONSUMER_NAME} is now listening for new messages...`);
    while(true) {
        const result = await redisClient.xreadgroup(
            "GROUP", Groups.INVENTORY,
            CONSUMER_NAME,
            "COUNT", "10",
            "BLOCK", "5000",
            "STREAMS", Streams.ORDERS,
            ">"
        );

        if(!result) continue;

        const messages = (result[0] as [string, Array<[string, string[]]>])[1];
        await handleMessages(messages);
    }
}

startConsumer().catch(console.error);