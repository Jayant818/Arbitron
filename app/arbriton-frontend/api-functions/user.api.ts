import { APIError } from "@/lib/errors";
import axios from "axios";

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
