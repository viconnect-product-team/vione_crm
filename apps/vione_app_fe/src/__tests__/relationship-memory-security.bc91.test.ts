// BC-9.1 Turn A — Security & privacy proofs.
//
// These tests are the FROZEN structural gate for the Relationship Memory
// foundation. They verify (a) private meeting notes cannot enter the memory
// pipeline, (b) the excluded-domain list is enforced at runtime, (c) the
// client-safe barrel never leaks server-only modules, and (d) no code path
// in the domain touches the private-notes table.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS,
  RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES,
} from "@/lib/business-connect/relationship-memory";
import {
  assertSourceDomainEligible,
  assertSourceRefNotBlocked,
  isAllowedSourceDomain,
} from "@/lib/business-connect/relationship-memory/eligibility";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";
import * as barrel from "@/lib/business-connect/relationship-memory";

const DOMAIN_ROOT = resolve(__dirname, "../lib/business-connect/relationship-memory");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("BC-9.1 Turn A — private meeting notes are structurally excluded", () => {
  it("rejects the private-notes domain at runtime", () => {
    expect(() => assertSourceDomainEligible("private_meeting_notes")).toThrow(
      RelationshipMemoryError,
    );
    expect(isAllowedSourceDomain("private_meeting_notes")).toBe(false);
  });

  it("rejects every excluded source domain at runtime", () => {
    for (const d of RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS) {
      expect(() => assertSourceDomainEligible(d)).toThrow(RelationshipMemoryError);
    }
  });

  it("rejects a source_ref that points at business_meeting_private_notes", () => {
    expect(() => assertSourceRefNotBlocked("business_meeting_private_notes/abc-123")).toThrow(
      RelationshipMemoryError,
    );
  });

  it("no source file in the domain references business_meeting_private_notes", () => {
    for (const file of walk(DOMAIN_ROOT)) {
      if (file.endsWith("eligibility.ts")) continue;
      const body = readFileSync(file, "utf8");
      for (const blocked of RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES) {
        expect(body.includes(blocked)).toBe(false);
      }
    }
  });

  it("no source file mentions 'private_meeting_notes' as a functional domain", () => {
    for (const file of walk(DOMAIN_ROOT)) {
      if (file.endsWith("registry.ts") || file.endsWith("eligibility.ts")) continue;
      const body = readFileSync(file, "utf8");
      expect(body.includes("private_meeting_notes")).toBe(false);
    }
  });
});

describe("BC-9.1 Turn A — client-safe barrel does not leak server-only code", () => {
  it("barrel does not export a repository or server executor", () => {
    for (const key of Object.keys(barrel)) {
      expect(key.toLowerCase()).not.toContain("repository");
      expect(key.toLowerCase()).not.toContain("server");
    }
  });

  it("index.ts contains no .server import", () => {
    const body = readFileSync(join(DOMAIN_ROOT, "index.ts"), "utf8");
    expect(body).not.toMatch(/\.server(?:\.ts)?["']/);
    expect(body).not.toMatch(/repository\.server/);
  });
});

describe("BC-9.1 Turn A — allowlist is closed", () => {
  it("accepts every allowlisted safe domain", () => {
    // meeting_safe is allowlisted; private_meeting_notes is not.
    expect(() => assertSourceDomainEligible("meeting_safe")).not.toThrow();
    expect(() => assertSourceDomainEligible("meeting_outcome_safe")).not.toThrow();
  });

  it("rejects a made-up domain even if it is not in the excluded list", () => {
    expect(() => assertSourceDomainEligible("some_unknown_domain")).toThrow(
      RelationshipMemoryError,
    );
  });
});
