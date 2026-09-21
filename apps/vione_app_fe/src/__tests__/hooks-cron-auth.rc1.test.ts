// BC-RC1 S2-01 — Internal hooks (outcome-consumer, timeline-projection) must
// authorize via dedicated cron secrets (notification-runtime convention):
// Bearer + timing-safe compare, fail-closed, anon keys never accepted,
// and authorization runs before any consumer logic.

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authorize as authorizeOutcome } from "@/routes/api/public/hooks/outcome-consumer";
import { authorize as authorizeTimeline } from "@/routes/api/public/hooks/timeline-projection";

const OUTCOME_SECRET = "rc1-outcome-secret-abc123-abc123-abc123";
const TIMELINE_SECRET = "rc1-timeline-secret-def456-def456-def456";
const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.public.anon.key";

function req(headers: Record<string, string>, url: string): Request {
  return new Request(url, { headers });
}

function sharedCases(
  label: string,
  envVar: "OUTCOME_CONSUMER_CRON_SECRET" | "TIMELINE_PROJECTION_CRON_SECRET",
  secret: string,
  authorize: (r: Request) => boolean,
  url: string,
) {
  describe(label, () => {
    const original = process.env[envVar];
    beforeEach(() => {
      process.env[envVar] = secret;
    });
    afterEach(() => {
      if (original === undefined) delete process.env[envVar];
      else process.env[envVar] = original;
    });

    it("denies missing authorization header", () => {
      expect(authorize(req({}, url))).toBe(false);
    });

    it("denies the anon key via apikey header, bearer, or x-api-key", () => {
      expect(authorize(req({ apikey: ANON_KEY }, url))).toBe(false);
      expect(authorize(req({ authorization: `Bearer ${ANON_KEY}` }, url))).toBe(false);
      expect(authorize(req({ "x-api-key": ANON_KEY }, url))).toBe(false);
    });

    it("denies a malformed bearer token", () => {
      expect(authorize(req({ authorization: "Basic dXNlcjpwYXNz" }, url))).toBe(false);
      expect(authorize(req({ authorization: "Bearer" }, url))).toBe(false);
      expect(authorize(req({ authorization: "Bearer   " }, url))).toBe(false);
    });

    it("denies an incorrect secret", () => {
      expect(authorize(req({ authorization: `Bearer ${secret}-wrong` }, url))).toBe(false);
    });

    it("accepts the correct secret via Bearer (case-insensitive scheme)", () => {
      expect(authorize(req({ authorization: `Bearer ${secret}` }, url))).toBe(true);
      expect(authorize(req({ authorization: `bearer ${secret}` }, url))).toBe(true);
    });

    it("fails closed when the env secret is unset", () => {
      delete process.env[envVar];
      expect(authorize(req({ authorization: `Bearer ${secret}` }, url))).toBe(false);
    });

    it("does not accept the OTHER hook's secret (per-hook isolation)", () => {
      const other = envVar === "OUTCOME_CONSUMER_CRON_SECRET" ? TIMELINE_SECRET : OUTCOME_SECRET;
      expect(authorize(req({ authorization: `Bearer ${other}` }, url))).toBe(false);
    });
  });
}

sharedCases(
  "outcome-consumer authorization",
  "OUTCOME_CONSUMER_CRON_SECRET",
  OUTCOME_SECRET,
  authorizeOutcome,
  "http://localhost/api/public/hooks/outcome-consumer",
);
sharedCases(
  "timeline-projection authorization",
  "TIMELINE_PROJECTION_CRON_SECRET",
  TIMELINE_SECRET,
  authorizeTimeline,
  "http://localhost/api/public/hooks/timeline-projection",
);

describe("authorization runs before any consumer logic (static order)", () => {
  for (const [file, marker] of [
    ["src/routes/api/public/hooks/outcome-consumer.ts", "runConsumer(batch)"],
    ["src/routes/api/public/hooks/timeline-projection.ts", "consumeBatch(batch)"],
  ] as const) {
    it(`${file}: authorize() precedes consumer execution`, () => {
      const src = readFileSync(file, "utf8");
      const postStart = src.indexOf("POST: async");
      const authIdx = src.indexOf("authorize(request)", postStart);
      const consumerIdx = src.indexOf(marker, postStart);
      expect(authIdx).toBeGreaterThan(-1);
      expect(consumerIdx).toBeGreaterThan(authIdx);
      // No anon-key acceptance remains anywhere in the file.
      expect(src).not.toMatch(/ANON_KEYS/);
    });
  }
});
