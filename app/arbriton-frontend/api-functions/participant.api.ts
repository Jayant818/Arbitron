import { APIError } from "@/lib/errors";
import axios from "axios";

export interface ISelectedToken {
  mint: string;
  quantity: number;
  isPowerToken: boolean;
  entryPrice: number;
}

export const createParticipantForContest = async (
  contestId: string,
  userPublickey: string,
  tokens: ISelectedToken[]
) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/join-contest`,
      {
        contestId,
        userPublickey,
        tokens,
      }
    );
    return res.data.participant;
  } catch (error) {
    console.error("Error in create participant for contest:", error);
    throw new APIError("Failed to create participant for contest", 500, error);
  }
};

export const getParticipantsByContestId = async (contestId: string) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${contestId}/participents/all`
    );
    return res.data.participants;
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw new APIError("Failed to fetch participants", 500, error);
  }
};
