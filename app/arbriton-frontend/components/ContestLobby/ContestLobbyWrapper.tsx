"use client";
import { useParams, useRouter } from "next/navigation";
import { useSolana } from "../solana-provider";
import { useEffect } from "react";
import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import {
  ARBITRON_PROGRAM_ADDRESS,
  fetchMaybeContest,
  fetchMaybeParticipent,
} from "../../../../dist/js-client";
import ContestLobbyPage from "./ContestLobbyPage";
import { SignalingManager } from "@/lib/SinglingManager";

export const ContestLobbyWrapper = () => {
  const { isConnected, selectedAccount, rpc } = useSolana();
  const { id: contestId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!selectedAccount || !selectedAccount.address || !contestId) return;

    checkAuthorizationAndStatus();

    async function checkAuthorizationAndStatus() {
      try {
        // 1. Check if user has participant account for this contest
        const participantAccountSeeds = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(address(contestId as string)),
          getAddressEncoder().encode(address(selectedAccount!.address)),
        ];

        const [participantPda] = await getProgramDerivedAddress({
          seeds: participantAccountSeeds,
          programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
        });

        const participantInfo = await fetchMaybeParticipent(
          // @ts-ignore
          rpc,
          participantPda
        );

        if (!participantInfo.exists) {
          // User hasn't joined this contest - redirect to home
          console.log("❌ Unauthorized: User hasn't joined this contest");
          router.push("/");
          return;
        }


        // 2. Check contest status
        const contestInfo = await fetchMaybeContest(
          // @ts-ignore
          rpc,
          address(contestId as string)
        );

        if (contestInfo.exists) {
          const status = contestInfo.data.status;
          console.log("📊 Contest status:", status);

          // ContestState enum: 0 = Upcoming, 1 = Ongoing, 2 = Completed
          if (status >0) {
            // Ongoing
            // Contest is active - redirect to arena
            console.log("🎮 Contest is ongoing - redirecting to arena");
            router.push(`/contest/${contestId}`);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        // On error, redirect to home for safety
        router.push("/");
      }
    }
  }, [rpc, contestId, router, selectedAccount]);

  useEffect(() => {
    if (!contestId) {
      return;
    }

    const instance = SignalingManager.getInstance();

    instance.registerCallback(
      "contest-started",
      (data: any) => {
        if (data.contestId !== contestId) return;
        router.push(`/contest/${contestId}`);
      },
      `contest-lobby-${contestId}`
    );
    instance.sendMessage({
      type: "SUBSCRIBE",
      payload: { contestId },
    });

    console.log("Subscribed to contest-started events for contest:", contestId);

    return () => {
      instance.sendMessage({
        type: "UNSUBSCRIBE",
        payload: { contestId },
      });

      instance.unregisterCallback(
        "contest-started",
        `contest-lobby-${contestId}`
      );
    };
  }, [contestId]);

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-background">
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

  return <ContestLobbyPage accountAddress={selectedAccount} />;
};
