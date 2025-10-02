"use client";
import { createSolanaRpc, createSolanaRpcSubscriptions, devnet, Rpc, RpcSubscriptions, SolanaRpcApiMainnet, SolanaRpcSubscriptionsApi } from "@solana/kit";
import { createContext } from "react";

export type RpcContext = {
    rpc: Rpc<SolanaRpcApiMainnet>,
    rpcSubscriptions:RpcSubscriptions<SolanaRpcSubscriptionsApi>
}

export const RpcContext = createContext<RpcContext>({
    rpc: createSolanaRpc(devnet('https://api.devnet.solana.com')),
    rpcSubscriptions: createSolanaRpcSubscriptions(devnet('wss://api.devnet.solana.com')),
})