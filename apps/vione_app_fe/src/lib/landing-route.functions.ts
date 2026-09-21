// BC-Mobile — Post-login route resolver.
// Migrated from Supabase client to NestJS REST API.
// Resolves where a user should land after sign-in:
//   - Platform admins → "/" (admin dashboard)
//   - Association admins → "/" (admin dashboard)
//   - Plain members → "/m" (member PWA)

import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

/**
 * Resolve where a user should land after sign-in.
 * Identity is derived server-side from the JWT, never client input.
 */
export const getPostLoginRouteFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<"/" | "/m"> => {
    const t0 = Date.now();
    const { userId, token } = context as any;
    try {
      const result = await fetchNestApiFromServer<{ to: "/" | "/m" }>(
        "/connect-app/me/post-login-route",
        token,
      );
      const to = result?.to ?? "/m";
      console.info(
        "[post-login-route] decided",
        JSON.stringify({ userId, to, ms: Date.now() - t0 }),
      );
      return to;
    } catch (err) {
      console.warn(
        "[post-login-route] NestAPI failed — defaulting to /m",
        JSON.stringify({ userId, error: String(err), ms: Date.now() - t0 }),
      );
      return "/m";
    }
  });
