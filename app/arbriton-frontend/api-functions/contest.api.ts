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
  startTime: number;
}

export interface ICreateContest {
  id: string;
  name: string;
  host: string;
  entryFee: string; // BigInt to string for JSON
  maxParticipants: number;
  startTime: Date;
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
