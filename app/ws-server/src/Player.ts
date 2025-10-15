import WebSocket from "ws";
import { SubscriptionManager } from "./SubscriptionManager.js";

type IncomingMessage = {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  payload: {
    contestId: string;
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
      const parsedMessage: IncomingMessage = JSON.parse(message);
      if (parsedMessage.type === "SUBSCRIBE") {
        SubscriptionManager.getInstance().subscribe(
          this.id,
          parsedMessage.payload.contestId
        );
      } else if (parsedMessage.type === "UNSUBSCRIBE") {
        SubscriptionManager.getInstance().unSubscribe(
          this.id,
          parsedMessage.payload.contestId
        );
      }
    });
  }
}
