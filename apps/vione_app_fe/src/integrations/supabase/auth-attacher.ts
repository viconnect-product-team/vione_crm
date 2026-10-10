import { createMiddleware } from "@tanstack/react-start";

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("vibe_token") || localStorage.getItem("access_token")
        : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
