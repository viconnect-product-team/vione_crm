// P0-A2 blocker: /m/checkin must not treat localStorage as canonical
// check-in state, and must call the server-authoritative server fns.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = readFileSync("src/routes/m.checkin.tsx", "utf8");

describe("P0-A2 · /m/checkin server-authority cutover", () => {
  it("does not import canonical check-in helpers from the mock module", () => {
    expect(SRC).not.toMatch(/from\s+["']@\/lib\/member-app-data["']/);
    expect(SRC).not.toMatch(/\bloadCheckins\b/);
    expect(SRC).not.toMatch(/\bsaveCheckins\b/);
    expect(SRC).not.toMatch(/\bpendingCheckins\b/);
  });

  it("does not read or write authoritative check-in state via localStorage", () => {
    // No direct localStorage.getItem/setItem calls at all in the route —
    // preference storage, if any, belongs in a dedicated hook.
    expect(SRC).not.toMatch(/localStorage\.(get|set|remove)Item/);
  });

  it("calls the server-authoritative check-in server functions", () => {
    expect(SRC).toMatch(/getMyCheckinState/);
    expect(SRC).toMatch(/checkInMyself/);
  });

  it("does not import the legacy offline sync helper", () => {
    expect(SRC).not.toMatch(/syncMemberCheckins/);
  });
});
