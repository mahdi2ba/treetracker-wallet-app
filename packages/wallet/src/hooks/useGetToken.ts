import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { tokenAtom } from "core";
import { getToken } from "../api/getToken";

// A token record as returned by the wallet-api GET /tokens/:id endpoint.
export type TokenDetails = {
  id: string;
  wallet_id?: string;
  capture_id?: string;
  claim?: boolean;
  created_at?: string;
  [key: string]: unknown;
};

export const useGetToken = (id: string) => {
  const authToken = useAtomValue(tokenAtom);
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!authToken || !id) {
        setIsTokenLoading(false);
        return;
      }
      setIsTokenLoading(true);
      setError(null);
      try {
        const result = await getToken(authToken, id);
        setToken(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setIsTokenLoading(false);
      }
    }
    load();
  }, [authToken, id]);

  return { token, isTokenLoading, error };
};
