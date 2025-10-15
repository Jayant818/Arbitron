"use client";
import { useParams } from "next/navigation";
import React from "react";
import { useSolana } from "../solana-provider";
import { useRouter } from "next/router";
import ContestArenaPage from "./ContestArenaPage";

const ContestArenaWrapper = () => {
  const { isConnected, selectedAccount, rpc } = useSolana();
  const { id: contestId } = useParams();

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Wallet Not Connected
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view the contest arena
          </p>
        </div>
      </div>
    );
  }

  if (!contestId || typeof contestId !== 'string') {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Invalid Contest
          </h2>
          <p className="text-muted-foreground">
            Contest ID is missing or invalid
          </p>
        </div>
      </div>
    );
  }

  return <ContestArenaPage contestId={contestId} />;
};

export default ContestArenaWrapper;
