"use client";

import * as React from "react";
import { Typography, Box, Skeleton, Tooltip } from "@mui/material";
import { ActivityList } from "./ActivityList";

export type ActivityEntry = {
  title: string;
  amount?: number;
  status?: string;
};

export function RecentActivity({
  activityData,
  isLoading = false,
}: {
  activityData: ActivityEntry[];
  isLoading?: boolean;
}) {
  return (
    <Box sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6">Recent Activity</Typography>
        {/* No transactions-list page exists yet — keep the affordance but make it
            visibly disabled and non-clickable. */}
        <Tooltip title="Coming soon">
          <Typography
            variant="body2"
            color="text.disabled"
            aria-disabled="true"
            sx={{
              cursor: "not-allowed",
              pointerEvents: "none",
              opacity: 0.5,
              alignSelf: "center",
            }}
          >
            View all
          </Typography>
        </Tooltip>
      </Box>

      {isLoading ? (
        <Box sx={{ mt: 1 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ my: 0.5 }} />
          ))}
        </Box>
      ) : activityData.length === 0 ? (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No recent activity yet — your sent and received tokens will appear
            here.
          </Typography>
        </Box>
      ) : (
        <ActivityList activityData={activityData} />
      )}
    </Box>
  );
}
