import { subRedis } from "../config/redis.js";
import { Channels } from "./publisher.js";


function handleUrlCreated(message: string) {
  const data = JSON.parse(message);
  console.log(`[Analytics Service] New URL created — setting up tracking`);
  console.log(`  → Short Code  : ${data.shortCode}`);
  console.log(`  → Original URL: ${data.originalUrl}`);
  console.log(`  → User ID     : ${data.userId}`);
}

function handleUrlClicked(message: string) {
  const data = JSON.parse(message);
  console.log(`[Analytics Service] URL clicked — recording click event`);
  console.log(`  → Short Code : ${data.shortCode}`);
  console.log(`  → IP         : ${data.ip}`);
  console.log(`  → User Agent : ${data.userAgent}`);
  console.log(`  → Timestamp  : ${new Date(data.timestamp).toISOString()}`);
}

function handleUrlLimitReached(message: string) {
  const data = JSON.parse(message);
  console.log(`[Notification Service] User hit URL limit — sending upgrade email`);
  console.log(`  → User ID      : ${data.userId}`);
  console.log(`  → Current Count: ${data.currentCount}`);
  console.log(`  → Limit        : ${data.limit}`);
}

export async function setupSubscribers() {
  await subRedis.subscribe(
    Channels.URL_CREATED,
    Channels.URL_CLICKED,
    Channels.URL_LIMIT_REACHED,
  );

  console.log(`[Subscriber] Subscribed to channels:`);
  console.log(`  → ${Channels.URL_CREATED}`);
  console.log(`  → ${Channels.URL_CLICKED}`);
  console.log(`  → ${Channels.URL_LIMIT_REACHED}`);

  subRedis.on("message", (channel, message) => {
    switch (channel) {
      case Channels.URL_CREATED:
        handleUrlCreated(message);
        break;

      case Channels.URL_CLICKED:
        handleUrlClicked(message);
        break;

      case Channels.URL_LIMIT_REACHED:
        handleUrlLimitReached(message);
        break;

      default:
        console.warn(`[Subscriber] Unknown channel: ${channel}`);
    }
  });
}