import { WebSocketServer } from "ws";
import { PlayerManager } from "./PlayerManager.js";
import { SubscriptionManager } from "./SubscriptionManager.js";

const wss = new WebSocketServer({ port: 8080 });

// Initialize the Redis subscriber for price updates
SubscriptionManager.getInstance().initPriceSubscriber();
SubscriptionManager.getInstance().initAggregateSubscriber();

wss.on("connection", (ws) => {
  console.log("New client connected");
  PlayerManager.getInstance().addUser(ws);
});

console.log("WebSocket server started on port 8080");
