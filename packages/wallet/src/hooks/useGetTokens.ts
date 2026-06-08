import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { tokenAtom } from "core";
import { getTokens } from "../api/getTokens";

export const useGetTokens = (walletName: string) => {
  const token = useAtomValue(tokenAtom);
  const [tokens, setTokens] = useState<any[]>([]);
  const [isTokensLoading, setIsTokensLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token || !walletName) {
        setIsTokensLoading(false);
        return;
      }
      setIsTokensLoading(true);
      setError(null);
      try {
        const result = await getTokens(token, walletName);
        setTokens(result.tokens || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setIsTokensLoading(false);
      }
    }
    load();
  }, [token, walletName]);

  return { tokens, isTokensLoading, error };
};
