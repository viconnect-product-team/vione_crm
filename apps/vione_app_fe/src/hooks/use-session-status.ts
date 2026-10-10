import { useAuth } from "@/context/AuthContext";

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
  try {
    const { status } = useAuth();
    if (status === "loading") return "checking";
    if (status === "in") return "authenticated";
    return "anonymous";
  } catch {
    return "anonymous";
  }
}
