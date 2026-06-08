"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/KeycloakProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

// Keycloak redirects here with ?code=...; the KeycloakProvider (root layout)
// processes the code during init. Once ready, route to the app.
export default function AuthCallbackPage() {
  const { ready, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(authenticated ? "/home" : "/login");
  }, [ready, authenticated, router]);

  return <LoadingSpinner />;
}
