"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import LoadingSpinner from "@/components/LoadingSpinner";
import { register } from "@/auth/keycloak";

// Registration is handled by Keycloak's hosted registration page. Redirect once
// (ref guard avoids a double redirect under React strict mode).
export default function SignUpPage() {
  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    register();
  }, []);

  return (
    <Box data-test="signup-redirect">
      <LoadingSpinner />
    </Box>
  );
}
