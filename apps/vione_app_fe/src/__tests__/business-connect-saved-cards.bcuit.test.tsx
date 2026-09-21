// @vitest-environment jsdom
// BC-UI-1T.1 shard — Saved Cards library + recordOpen semantics.
// Uses the lightweight renderSavedCardsLibrary harness (no route tree, no
// AppShell, no __root <html> shell) to keep each assertion under the default
// 5s timeout.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import { makeSaved, renderSavedCardsLibrary } from "./helpers/business-connect-test-harness";

let savedData: SavedCard[] = [];
const recordOpen = vi.fn(async (_id: string) => makeSaved({ id: "r" }));

vi.mock("@/lib/business-card/saved-card.sdk", () => ({
  SavedCardSDK: {
    search: vi.fn(async () => savedData.map((c: any) => ({ ...c }))),
    recordOpen: (id: string) => recordOpen(id),
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

describe("BC-UI-1T.1 saved cards library + recordOpen", () => {
  it("renders saved cards and does NOT call recordOpen on render", async () => {
    savedData = [
      makeSaved({ id: "s1", target: { displayName: "Bravo Person" } as SavedCard["target"] }),
    ];
    renderSavedCardsLibrary();
    await waitFor(() => expect(screen.getByText("Bravo Person")).toBeTruthy());
    expect(recordOpen).not.toHaveBeenCalled();
  });

  it("deliberate open calls recordOpen exactly once; re-render does not repeat it", async () => {
    savedData = [
      makeSaved({ id: "s1", target: { displayName: "Bravo Person" } as SavedCard["target"] }),
    ];
    renderSavedCardsLibrary();
    const openBtn = await waitFor(() => screen.getByText("Bravo Person"));
    fireEvent.click(openBtn);
    await waitFor(() => expect(recordOpen).toHaveBeenCalledTimes(1));
    expect(window.open).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(recordOpen).toHaveBeenCalledTimes(1);
  });

  it("recordOpen failure still opens the public card", async () => {
    savedData = [
      makeSaved({ id: "s1", target: { displayName: "Bravo Person" } as SavedCard["target"] }),
    ];
    recordOpen.mockRejectedValueOnce(new Error("net"));
    renderSavedCardsLibrary();
    const openBtn = await waitFor(() => screen.getByText("Bravo Person"));
    fireEvent.click(openBtn);
    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1));
  });
});
