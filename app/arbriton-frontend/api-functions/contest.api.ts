import { APIError } from "@/lib/errors";
import axios from "axios";

export interface IContest {
  currentPlayers: number;
  decimals: number;
  duration: number;
  entryFee: number;
  host: string;
  id: string;
  maxPlayers: number;
  prizePoolAccount: string;
  status: number;
  title: string;
  scheduledStartTime: number; // When contest is scheduled to start (set at creation, from DB)
  startTime: number; // Actual start time in Unix timestamp (set by crank when contest starts on-chain)
}

export interface ICreateContest {
  id: string;
  name: string;
  host: string;
  entryFee: string; // BigInt to string for JSON
  maxParticipants: number;
  scheduledStartTime: Date; // When contest should start
  duration: number;
  decimals: number;
}

export const getAllContests = async () => {
  try {
    const contests = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/all`
    );
    return contests.data;
  } catch (error) {
    console.error("Error fetching contests:", error);
    throw new APIError("Failed to fetch contests", 500, error);
  }
};

export async function fetchContestDetailsById(id: string) {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${id}`
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching contest details:", error);
    throw error;
  }
}

export async function createNewContest(data: ICreateContest) {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/`,
      data
    );
    return res.data;
  } catch (error) {
    console.error("Error creating contest:", error);
    throw error;
  }
}

export const getAllParticipantsForContest = async (contestId: string) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${contestId}/participents/all`
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching participants:", error);
    throw new APIError("Failed to fetch participants", 500, error);
  }
};

export const updateContestStatus = async (
  contestId: string,
  status: string
) => {
  try {
    const res = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${contestId}/status`,
      { status }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error updating contest status:", error);
    throw new APIError("Failed to update contest status", 500, error);
  }
};
