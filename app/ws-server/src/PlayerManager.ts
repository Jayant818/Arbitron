import { WebSocket } from "ws";
import { Player } from "./Player.js";
import { SubscriptionManager } from "./SubscriptionManager.js";

export class PlayerManager {
  // instance should be private, so that no one can change it
  private static instance: PlayerManager;
  public players: Map<String, Player> = new Map();
  private constructor() {}

  public static getInstance(): PlayerManager {
    if (!this.instance) {
      this.instance = new PlayerManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const newUser = new Player(id, ws);
    this.players.set(id, newUser);
    this.registerOnClose(ws, id);
  }

  private registerOnClose(ws: WebSocket, id: String) {
    ws.on("close", () => {
      this.players.delete(id);
      SubscriptionManager.getInstance().unSubscribe(id);
    });
  }

  public getPlayer(id: string) {
    return this.players.get(id);
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
