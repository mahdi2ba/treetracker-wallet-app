"use client";

import * as React from "react";
import TollOutlinedIcon from "@mui/icons-material/TollOutlined";
import { CustomBalanceCard } from "@/components/common/CustomBalanceCard";

export function TokenBalance({
  tokenCount,
  isLoading,
}: {
  tokenCount: number;
  isLoading?: boolean;
}) {
  return (
    <CustomBalanceCard
      icon={<TollOutlinedIcon sx={{ color: "green" }} />}
      label="Tokens"
      value={tokenCount}
      isLoading={isLoading}
    />
  );
}
