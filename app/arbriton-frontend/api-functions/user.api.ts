import { APIError } from "@/lib/errors";
import axios from "axios";


export const GetUser = async (walletAddress: string) => {
    try {
        const res = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/${walletAddress}`
        );
        return res.data;
    } catch (error) {
        console.error("Error in get user:", error);
        throw new APIError("Failed to get user", 500, error);
    }
};


export const UpdateUser = async (data: { walletAddress: string; username?: string; email?: string }) => {
    try {
        const res = await axios.put(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/${data.walletAddress}`,
            {
                username: data.username,
                email: data.email,
            }
        );
        return res.data;
    } catch (error) {
        console.error("Error in update user:", error);
        throw new APIError("Failed to update user", 500, error);
    }
};

export const findOrCreateUser = async (publicKey: string) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/find-or-create`,
      {
        publicKey,
      }
    );
    return res.data.user;
  } catch (error) {
    console.error("Error in find-or-create user:", error);
    throw new APIError("Failed to find or create user", 500, error);
  }
};

export const GetUserContestHistory = async (walletAddress: string) => {
    try {
        const res = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/${walletAddress}/contests`
        );
        return res.data;
    } catch (error) {
        console.error("Error in get user contest history:", error);
        throw new APIError("Failed to get user contest history", 500, error);
    }
};
