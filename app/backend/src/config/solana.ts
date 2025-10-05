import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import "dotenv/config";

const RPC = process.env.RPC_URL;
const RPC_WEBSOCKET = process.env.RPC_WEBSOCKET_URL;

if (!RPC || !RPC_WEBSOCKET) {
  throw new Error(
    "RPC_URL and RPC_WEBSOCKET_URL must be defined in environment variables"
  );
}

const rpc = createSolanaRpc(RPC);
const rpcWebsocket = createSolanaRpcSubscriptions(RPC_WEBSOCKET);

export { rpc, rpcWebsocket };
