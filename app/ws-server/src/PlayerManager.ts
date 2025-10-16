import { WebSocket } from "ws";
import { Player } from "./Player.js";
import { SubscriptionManager } from "./SubscriptionManager.js";

export class PlayerManager {
  // instance should be private, so that no one can change it
  private static instance: PlayerManager;
  public players: Map<string, Player> = new Map();
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

  private registerOnClose(ws: WebSocket, id: string) {
    ws.on("close", () => {
      console.log(`Player ${id} disconnected.`);
      this.players.delete(id);
      
      // Unsubscribe from all price and contest subscriptions
      SubscriptionManager.getInstance().unsubscribeFromPrices(id);
      // The old contest subscription manager has a flaw, this is a quick fix for now
      // It should be refactored to be more robust
      // SubscriptionManager.getInstance().unSubscribe(id, contestIds);
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
