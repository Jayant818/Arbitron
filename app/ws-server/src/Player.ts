import WebSocket from "ws";
import { SubscriptionManager } from "./SubscriptionManager.js";

// Redefine the message structure for clarity and extensibility
type IncomingMessage = {
  type: "SUBSCRIBE_CONTEST" | "UNSUBSCRIBE_CONTEST" | "SUBSCRIBE_PRICES";
  payload: {
    contestId?: string;
    mints?: string[];
  };
};

export class Player {
  public id: string;
  public ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListener();
  }

  emit(msg: any) {
    this.ws.send(JSON.stringify(msg));
  }

  private addListener() {
    this.ws.on("message", (message: string) => {
      try {
        const parsedMessage: IncomingMessage = JSON.parse(message);

        switch (parsedMessage.type) {
          case "SUBSCRIBE_PRICES":
            if (parsedMessage.payload?.mints) {
              SubscriptionManager.getInstance().subscribeToPrices(
                this.id,
                parsedMessage.payload.mints
              );
            }
            break;

          case "SUBSCRIBE_CONTEST":
            if (parsedMessage.payload?.contestId) {
              SubscriptionManager.getInstance().subscribeToContest(
                this.id,
                parsedMessage.payload.contestId
              );
            }
            break;

          case "UNSUBSCRIBE_CONTEST":
            if (parsedMessage.payload?.contestId) {
              SubscriptionManager.getInstance().unsubscribeFromContest(
                this.id,
                parsedMessage.payload.contestId
              );
            }
            break;
        }
      } catch (error) {
        console.error("Failed to parse incoming message or subscribe:", error);
      }
    });
  }
}
