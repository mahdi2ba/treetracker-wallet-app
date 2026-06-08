"use client";

import { useEffect } from "react";
import { logout } from "@/auth/keycloak";
import LoadingSpinner from "@/components/LoadingSpinner";

// Logs out of Keycloak (clears the SSO session) and redirects to /login.
export default function LogoutPage() {
  useEffect(() => {
    // Clear the mirrored access token, then end the Keycloak session.
    try {
      sessionStorage.removeItem("token");
    } catch {
      /* ignore */
    }
    logout();
  }, []);

  return <LoadingSpinner />;
}
