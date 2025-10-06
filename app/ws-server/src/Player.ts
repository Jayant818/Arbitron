import WebSocket from "ws";
import { SubscriptionManager } from "./SubscriptionManager.js";

type IncomingMessage = {
  method: "SUBSCRIBE" | "UNSUBSCRIBE";
  contestId: string;
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
      if (parsedMessage.method === "SUBSCRIBE") {
        SubscriptionManager.getInstance().subscribe(
          this.id,
          parsedMessage.contestId
        );
      } else if (parsedMessage.method === "UNSUBSCRIBE") {
        SubscriptionManager.getInstance().unSubscribe(
          this.id,
          parsedMessage.contestId
        );
      }
    });
  }
}
