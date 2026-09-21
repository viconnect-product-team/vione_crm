// @vitest-environment jsdom
// BC-UI-1T.1 shard — Accessibility on Saved Cards library using the
// lightweight direct-render harness. Covers empty and populated states,
// axe-clean surfaces, and the search-input labelling contract.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, cleanup } from "@testing-library/react";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import {
  makeSaved,
  renderSavedCardsLibrary,
  expectNoAxeViolations,
} from "./helpers/business-connect-test-harness";

let savedData: SavedCard[] = [];

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: {
    search: vi.fn(async () => savedData.map((c: any) => ({ ...c }))),
    recordOpen: vi.fn(async () => makeSaved({ id: "r" })),
    collections: { list: vi.fn(async () => []) },
    tags: { list: vi.fn(async () => []) },
    setFavorite: vi.fn(async () => makeSaved({ id: "x" })),
    setArchived: vi.fn(async () => makeSaved({ id: "x" })),
    move: vi.fn(async () => makeSaved({ id: "x" })),
    setNote: vi.fn(async () => makeSaved({ id: "x" })),
    remove: vi.fn(async () => ({ ok: true })),
  },
}));

beforeEach(() => {
  savedData = [];
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BC-UI-1T.1 saved cards accessibility", () => {
  it("empty library has no axe violations and exposes a labelled search input", async () => {
    const { container } = renderSavedCardsLibrary();
    // Search input has an accessible name (visible label or aria-label).
    await waitFor(() => expect(container.querySelector("input")).toBeTruthy());
    await expectNoAxeViolations(container);
  });

  it("populated library has no axe violations and item actions are keyboard-reachable", async () => {
    savedData = [
      makeSaved({ id: "s1", target: { displayName: "Alpha Person" } as SavedCard["target"] }),
      makeSaved({ id: "s2", target: { displayName: "Bravo Person" } as SavedCard["target"] }),
    ];
    const { container } = renderSavedCardsLibrary();
    await waitFor(() => expect(screen.getByText("Alpha Person")).toBeTruthy());
    // Every rendered <button> must have an accessible name (text or aria-label).
    for (const btn of Array.from(container.querySelectorAll("button"))) {
      const name = btn.getAttribute("aria-label") ?? btn.textContent ?? "";
      expect(name.trim().length).toBeGreaterThan(0);
    }
    await expectNoAxeViolations(container);
  });
});
