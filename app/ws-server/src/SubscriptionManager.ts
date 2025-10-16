import { createSubscriber } from "@arbitron/shared-redis";
import { PlayerManager } from "./PlayerManager.js";
import { PRICE_UPDATES } from "../../poller/src/index.js";

// Handles contest-specific events (e.g., contest started)
interface ContestSubscriptionPayload {
  type: "contest-started";
  // Add other contest-specific event types here
}

// Handles token price updates
interface PriceUpdatePayload {
  [mint: string]: {
    scaledPrice: string; // Price as a scaled integer string
    blockId: number;
  };
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;

  // Contest-specific subscriptions
  private contestSubscriptions: Map<string, string[]> = new Map(); // contestId -> playerId[]
  private reverseContestSubscriptions: Map<string, string> = new Map(); // playerId -> contestId
  private contestSubscriber: Awaited<ReturnType<typeof createSubscriber>> | null = null;

  // Price subscriptions
  private priceSubscriptions: Map<string, string[]> = new Map(); // mintAddress -> playerId[]
  private reversePriceSubscriptions: Map<string, string[]> = new Map(); // playerId -> mintAddress[]
  private priceSubscriber: Awaited<ReturnType<typeof createSubscriber>> | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  // --- Main Price Update Logic ---

  public async initPriceSubscriber() {
    if (this.priceSubscriber) return;
    console.log("Initializing Redis subscriber for price updates...");
    this.priceSubscriber = await createSubscriber();
    try {
      await this.priceSubscriber.SUBSCRIBE(
        PRICE_UPDATES,
        this.priceUpdateCallbackHandler.bind(this)
      );
      console.log(`Successfully subscribed to Redis channel: ${PRICE_UPDATES}`);
    } catch (err) {
      console.error("Failed to subscribe to Redis price updates:", err);
    }
  }

  private priceUpdateCallbackHandler(channel: string, message: string) {
    if (channel !== PRICE_UPDATES) {
      return;
    }

    const payload: PriceUpdatePayload = JSON.parse(message);

    // Iterate over each mint address in the update payload
    for (const mint in payload) {
      const subscribers = this.priceSubscriptions.get(mint);
      if (subscribers && subscribers.length > 0) {
        const priceData = payload[mint];
        const messageForFrontend = {
          type: "priceUpdate",
          payload: {
            mint: mint,
            price: priceData.scaledPrice,
          },
        };

        // Send update to all players subscribed to this mint
        subscribers.forEach((playerId) => {
          PlayerManager.getInstance().getPlayer(playerId)?.emit(messageForFrontend);
        });
      }
    }
  }

  public subscribeToPrices(playerId: string, mints: string[]) {
    mints.forEach((mint) => {
      const existingSubs = this.priceSubscriptions.get(mint) || [];
      if (!existingSubs.includes(playerId)) {
        this.priceSubscriptions.set(mint, [...existingSubs, playerId]);
      }
    });

    const existingReverseSubs = this.reversePriceSubscriptions.get(playerId) || [];
    const newMints = mints.filter(mint => !existingReverseSubs.includes(mint));
    this.reversePriceSubscriptions.set(playerId, [...existingReverseSubs, ...newMints]);
    console.log(`Player ${playerId} subscribed to prices for mints:`, mints);
  }

  public unsubscribeFromPrices(playerId: string) {
    const subscribedMints = this.reversePriceSubscriptions.get(playerId);
    if (subscribedMints) {
      subscribedMints.forEach((mint) => {
        const subs = this.priceSubscriptions.get(mint);
        if (subs) {
          const updatedSubs = subs.filter((id) => id !== playerId);
          if (updatedSubs.length > 0) {
            this.priceSubscriptions.set(mint, updatedSubs);
          } else {
            this.priceSubscriptions.delete(mint); // Clean up if no subscribers left
          }
        }
      });
      this.reversePriceSubscriptions.delete(playerId);
      console.log(`Player ${playerId} unsubscribed from all price updates.`);
    }
  }

  // --- Existing Contest Subscription Logic ---

  private contestCallbackHandler(message: string, channel: string) {
    const eventPayload: ContestSubscriptionPayload = JSON.parse(message);
    const contestId = channel.replace("contest-", "");

    const messageForFrontend = {
      type: eventPayload.type,
      payload: eventPayload,
    };

    this.contestSubscriptions.get(contestId)?.forEach((playerId) => {
      PlayerManager.getInstance().getPlayer(playerId)?.emit(messageForFrontend);
    });
  }

  public async subscribeToContest(playerId: string, contestId: string) {
    if (this.contestSubscriptions.get(contestId)?.includes(playerId)) {
      return;
    }

    this.contestSubscriptions.set(contestId, [
      ...(this.contestSubscriptions.get(contestId) || []),
      playerId,
    ]);

    this.reverseContestSubscriptions.set(playerId, contestId);

    if (this.contestSubscriptions.get(contestId)?.length === 1) {
        if (!this.contestSubscriber) {
            this.contestSubscriber = await createSubscriber();
        }
      this.contestSubscriber.SUBSCRIBE(
        `contest-${contestId}`,
        this.contestCallbackHandler.bind(this)
      );
      console.log("Subscribed to contest channel:", contestId);
    }
  }

  public async unsubscribeFromContest(playerId: string, contestId: string) {
    const subscription = this.contestSubscriptions.get(contestId);

    if (subscription) {
      this.contestSubscriptions.set(
        contestId,
        subscription.filter((sub) => sub !== playerId)
      );
      this.reverseContestSubscriptions.delete(playerId);
    }

    if (this.contestSubscriptions.get(contestId)?.length === 0) {
      if (this.contestSubscriber) {
        this.contestSubscriber.UNSUBSCRIBE(`contest-${contestId}`);
      }
    }
  }
}
