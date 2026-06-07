import axios, { isAxiosError } from "axios";
import { TREETRACKER_API, WALLET_API_KEY } from "../utils/config";

export async function getToken(token: string, id: string) {
  try {
    const response = await axios.get(`${TREETRACKER_API}/tokens/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "treetracker-api-key": WALLET_API_KEY,
      },
    });

    return response.data; // the token object
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to get token";
      throw new Error(errorMessage);
    }
    throw error;
  }
}
