import axios, { isAxiosError } from "axios";
import { TREETRACKER_API, WALLET_API_KEY } from "../utils/config";

export async function getTransfers(token: string, limit: number = 5) {
  try {
    const response = await axios.get(
      `${TREETRACKER_API}/transfers?limit=${limit}&sort_by=created_at&order=desc`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "treetracker-api-key": WALLET_API_KEY,
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
