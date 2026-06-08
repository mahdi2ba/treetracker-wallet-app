import axios, { isAxiosError } from "axios";
import { TREETRACKER_WALLET_API } from "../utils/config";

export async function getToken(token: string, id: string) {
  try {
    const response = await axios.get(`${TREETRACKER_WALLET_API}/tokens/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
