import { APIError } from "@/lib/errors";
import axios from "axios";
import { ICreateContest } from "./contest.api";

export const createParticipantForContest = async (
  contestId: string,
  userPublickey: string,
  tokens: ICreateContest[]
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
