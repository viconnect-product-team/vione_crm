// Guard rail for integration/e2e tests that write to Supabase.
//
// Ensures tests NEVER accidentally run against the production database.
// Every e2e/integration suite that mutates data must call
// `requireStagingSupabase()` in `beforeAll` — it hard-fails if the target URL
// is not an explicit staging project.
//
// A target is considered safe when either:
//   1. `SUPABASE_TEST_ENV` is set to "staging" or "local", OR
//   2. The Supabase URL host contains "staging" / "test" / "dev" / is 127.0.0.1
//
// The prod URL host (e.g. wutbrzvqyyegkthtzgcd.supabase.co) can be added to
// `PRODUCTION_HOST_DENYLIST` to reject it explicitly even if a caller tries
// to override the env.

const PRODUCTION_HOST_DENYLIST = new Set<string>([
  // Production Supabase project host. Never allowed for tests.
  "wutbrzvqyyegkthtzgcd.supabase.co",
]);

const STAGING_HOST_HINTS = ["staging", "test", "dev", "preview", "127.0.0.1", "localhost"];

export type StagingSupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export function resolveTestSupabaseEnv(): Partial<StagingSupabaseEnv> {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anonKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isStagingTarget(url: string): boolean {
  if (process.env.SUPABASE_TEST_ENV === "staging") return true;
  if (process.env.SUPABASE_TEST_ENV === "local") return true;
  let host: string;
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    return false;
  }
  if (PRODUCTION_HOST_DENYLIST.has(host)) return false;
  return STAGING_HOST_HINTS.some((hint) => host.includes(hint));
}

/**
 * Hard-fails the test suite when the Supabase target is not an explicit
 * staging/local project. Returns the fully-resolved env for convenience.
 */
export function requireStagingSupabase(): StagingSupabaseEnv {
  const env = resolveTestSupabaseEnv();
  const missing = (["url", "anonKey", "serviceRoleKey"] as const).filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `[test-env] Missing Supabase env vars: ${missing.join(", ")}. ` +
        "Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY for the staging project.",
    );
  }

  const url = env.url!;
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      throw new Error(`[test-env] Invalid SUPABASE_URL: ${url}`);
    }
  })();

  if (PRODUCTION_HOST_DENYLIST.has(host.toLowerCase())) {
    throw new Error(
      `[test-env] REFUSING to run integration tests against production host "${host}". ` +
        "Point SUPABASE_URL at the staging project.",
    );
  }

  if (!isStagingTarget(url)) {
    throw new Error(
      `[test-env] SUPABASE_URL host "${host}" does not look like a staging/test target. ` +
        'Set SUPABASE_TEST_ENV="staging" to explicitly opt in, or use a staging project URL.',
    );
  }

  return {
    url,
    anonKey: env.anonKey!,
    serviceRoleKey: env.serviceRoleKey!,
  };
}
