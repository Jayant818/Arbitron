import { create } from "domain";
import { createClient } from "redis";

export class RedisManager {
  public static standardClient: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  private static async createClient() {
    const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
    const redisClient = createClient({ url: REDIS_URL });

    redisClient.on("error", (err) => console.log("Redis Client Error", err));

    await redisClient.connect();

    return redisClient;
  }

  public static async getStandardClient() {
    if (!this.standardClient) {
      this.standardClient = await this.createClient();
    }
    return this.standardClient;
  }

  public static async getSubscriberClient() {
    const subscriberClient = await this.createClient();
    return subscriberClient;
  }
}

export const redis = await RedisManager.getStandardClient();
export const publisher = redis;

export async function createSubscriber(
  channel: string,
  callback: (message: string) => void
) {
  const subscriber = await RedisManager.getSubscriberClient();
  await subscriber.subscribe(channel, callback);
  return subscriber;
}
