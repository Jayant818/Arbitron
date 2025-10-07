import { createSubscriber } from "@arbitron/shared-redis";
import { PlayerManager } from "./PlayerManager.js";

export class SubscriptionManager {
  // Contest -> User[]
  public subscriptions: Map<String, String[]> = new Map();
  // user -> Contets
  public reverseSubscription: Map<String, String> = new Map();
  public static instance: SubscriptionManager;

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  private redisCallbackHandler(message: string, channel: string) {
    const parsedMessage = JSON.parse(message);
    this.subscriptions
      .get(channel)
      ?.forEach((s) =>
        PlayerManager.getInstance().getPlayer(s)?.emit(parsedMessage)
      );
  }

  public subscribe(playerId: string, contestId: string) {
    if (this.subscriptions.get(contestId)?.includes(playerId)) {
      return;
    }

    this.subscriptions.set(contestId, [
      ...(this.subscriptions.get(contestId) || []),
      playerId,
    ]);

    this.reverseSubscription.set(playerId, contestId);

    if (this.subscriptions.get(contestId)?.length === 1) {
      // subscribe
    }
  }

  public unSubscribe(playerId: string, contestId: string) {
    const subscription = this.subscriptions.get(contestId);

    if (subscription) {
      this.subscriptions.set(
        contestId,
        subscription.filter((sub) => sub !== playerId)
      );

      this.reverseSubscription.delete(playerId);
    }

    if (this.subscriptions.get(contestId)?.length == 0) {
      // unsubscribe
    }
  }

  public playerLeft(userId: string) {
    // we need to find our in which contest he/she is in?
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
