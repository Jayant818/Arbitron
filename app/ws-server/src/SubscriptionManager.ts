import { createSubscriber } from "@arbitron/shared-redis";
import { PlayerManager } from "./PlayerManager.js";

export class SubscriptionManager {
  // Contest -> User[]
  public subscriptions: Map<string, string[]> = new Map();
  // user -> Contets
  public reverseSubscription: Map<string, string> = new Map();
  public static instance: SubscriptionManager;
  public subscriber: Awaited<ReturnType<typeof createSubscriber>> | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  private redisCallbackHandler(message: string, channel: string) {
    const eventPayload = JSON.parse(message);
    console.log(
      "Received message from Redis:",
      eventPayload,
      "on channel:",
      channel
    );

    console.log("Received message", eventPayload, channel);


    const contestId = channel.replace("contest-", "");

    const messageForFrontend = {
      type: eventPayload.type, // e.g., "contest-started"
      payload: eventPayload, // The full data becomes the payload
    };

    // 3. Use the correct contestId to find subscribers and send the message.
    this.subscriptions.get(contestId)?.forEach((playerId) => {
      console.log(
        `Emitting '${messageForFrontend.type}' event to player ${playerId}`
      );
      PlayerManager.getInstance().getPlayer(playerId)?.emit(messageForFrontend);
    });
  }

  public async subscribe(playerId: string, contestId: string) {
    if (this.subscriptions.get(contestId)?.includes(playerId)) {
      return;
    }

    this.subscriptions.set(contestId, [
      ...(this.subscriptions.get(contestId) || []),
      playerId,
    ]);

    this.reverseSubscription.set(playerId, contestId);

    if (this.subscriptions.get(contestId)?.length === 1) {
      this.subscriber = await createSubscriber();
      this.subscriber.SUBSCRIBE(
        `contest-${contestId}`,
        this.redisCallbackHandler.bind(this)
      );

      console.log("Subscribed to contest:", contestId);
    }
  }

  public async unSubscribe(playerId: string, contestId: string) {
    const subscription = this.subscriptions.get(contestId);

    if (subscription) {
      this.subscriptions.set(
        contestId,
        subscription.filter((sub) => sub !== playerId)
      );

      this.reverseSubscription.delete(playerId);
    }

    if (this.subscriptions.get(contestId)?.length == 0) {
      if (this.subscriber) {
        this.subscriber?.UNSUBSCRIBE(`contest-${contestId}`);
      }
    }
  }

  public playerLeft(userId: string) {
    // we need to find our in which contest player is in?
    const contest = this.reverseSubscription.get(userId);
    if (contest) {
      const subscription = this.subscriptions.get(contest);
      if (subscription) {
        this.subscriptions.set(
          contest,
          subscription.filter((c) => c !== userId)
        );
      }
    }
  }
}
