"use client";
import { useParams } from "next/navigation";
import React from "react";
import { useSolana } from "../solana-provider";
import { useRouter } from "next/router";
import ContestArenaPage from "./ContestArenaPage";

const ContestArenaWrapper = () => {
  const { isConnected, selectedAccount, rpc } = useSolana();
  const { id: contestId } = useParams();
  const router = useRouter();

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Wallet Not Connected
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to Join a contest
          </p>
        </div>
      </div>
    );
  }

  return <ContestArenaPage />;
};

export default ContestArenaWrapper;
