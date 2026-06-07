import axios, { isAxiosError } from "axios";
import { TREETRACKER_WALLET_API } from "../utils/config";

export async function getTokens(
  token: string,
  walletName: string,
  limit: number = 100,
) {
  try {
    const response = await axios.get(
      `${TREETRACKER_WALLET_API}/tokens?wallet=${encodeURIComponent(
        walletName,
      )}&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data; // { tokens: [...] }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to get tokens";
      throw new Error(errorMessage);
    }
    throw error;
  }
}
