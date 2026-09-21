import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unified client-side session status for auth-sensitive routes.
 *
 * - "checking": session not yet determined — hold render / show a loader so
 *   the page never flashes signed-out/empty content before the session is known.
 * - "authenticated": a valid session exists.
 * - "anonymous": no session.
 */
export type SessionStatus = "checking" | "authenticated" | "anonymous";

export function useSessionStatus(): SessionStatus {
  const [supabaseAuth, setSupabaseAuth] = useState<SessionStatus | null>(null);

  useEffect(() => {
    let active = true;
    if (typeof window !== "undefined" && supabase?.auth?.getUser) {
      supabase.auth.getUser().then(({ data }: any) => {
        if (!active) return;
        setSupabaseAuth(data?.user ? "authenticated" : "anonymous");
      }).catch(() => {
        if (active) setSupabaseAuth("anonymous");
      });
    }
    return () => {
      active = false;
    };
  }, []);

  try {
    const { status } = useAuth();
    if (status === "loading") return supabaseAuth ?? "checking";
    if (status === "in") return "authenticated";
    return "anonymous";
  } catch {
    return supabaseAuth ?? "checking";
  }
}


