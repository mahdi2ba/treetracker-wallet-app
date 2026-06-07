"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Stack, Paper, Button, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useGetTokens } from "@treetracker/wallet";

function WalletDetails() {
  const params = useSearchParams();
  const router = useRouter();
  const name = params?.get("name") ?? "";

  const { tokens, isTokensLoading, error } = useGetTokens(name);

  return (
    <Box sx={{ p: 2 }} data-test="wallet-details-page">
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/wallet")}
        sx={{ color: "green" }}
        data-test="wallet-details-back"
      >
        Back
      </Button>

      {/* Basic wallet info */}
      <Typography variant="h6" fontWeight={600} data-test="wallet-details-name">
        {name}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        data-test="wallet-details-balance"
      >
        Token balance: {tokens.length}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" fontWeight={500}>
        Tokens in wallet
      </Typography>

      {isTokensLoading && <Typography variant="body2">Loading…</Typography>}
      {error && (
        <Typography variant="body2" color="error" data-test="token-list-error">
          {error}
        </Typography>
      )}

      <Stack spacing={0.5} sx={{ mt: 1 }} data-test="token-list">
        {tokens.map((t: { id: string }) => (
          <Paper
            key={t.id}
            sx={{
              p: 2,
              cursor: "pointer",
              "&:hover": { bgcolor: "grey.50" },
            }}
            data-test={`token-item-${t.id}`}
            onClick={() =>
              router.push(
                `/token/details?id=${t.id}&wallet=${encodeURIComponent(name)}`,
              )
            }
          >
            <Typography variant="body2">{t.id}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

export default function WalletDetailsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 2 }}>Loading…</Box>}>
      <WalletDetails />
    </Suspense>
  );
}
