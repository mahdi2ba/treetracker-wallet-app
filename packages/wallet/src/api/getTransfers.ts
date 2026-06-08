import axios, { isAxiosError } from "axios";
import { TREETRACKER_WALLET_API } from "../utils/config";

export async function getTransfers(token: string, limit: number = 5) {
  try {
    const response = await axios.get(
      `${TREETRACKER_WALLET_API}/transfers?limit=${limit}&sort_by=created_at&order=desc`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data; // { transfers: [...], query, total }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to get transfers";
      throw new Error(errorMessage);
    }
    throw error;
  }
}
