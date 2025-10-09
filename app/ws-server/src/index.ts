import WebSocket, { WebSocketServer } from "ws";
import { PlayerManager } from "./PlayerManager.js";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  PlayerManager.getInstance().addUser(ws);
});
