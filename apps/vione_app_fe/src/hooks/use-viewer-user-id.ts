// BC-7.7 Turn C — Viewer user-id hook (client-side). Returns null while the
// session is being determined or when signed out. Uses AuthContext locally.

import { useAuth } from "@/context/AuthContext";

export function useViewerUserId(): string | null {
  try {
    const { user } = useAuth();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
