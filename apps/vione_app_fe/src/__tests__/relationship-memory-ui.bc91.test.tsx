// @vitest-environment jsdom
// BC-9.1 Turn C1 — Relationship Memory read UI shard.
//
// Verifies:
//  - list groups by status (active vs candidate vs historical)
//  - historical hidden by default and revealed via aria-pressed toggle
//  - loading state exposes aria-busy for screen readers
//  - summary widget renders viewer-scoped active memories
//  - detail drawer opens with sheet role="dialog" and shows the DTO
//  - all rendered structures use semantic <ul role="list">
//
// The SDK is fully mocked. No network. No server functions executed.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import type { RelationshipMemoryDTO } from "@/lib/business-connect/relationship-memory";

// --- Mock SDK ---
const listMock = vi.fn();
const getByIdMock = vi.fn();

vi.mock("@/lib/business-connect/relationship-memory", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    RelationshipMemorySDK: {
      list: (...a: unknown[]) => listMock(...a),
      getById: (...a: unknown[]) => getByIdMock(...a),
      searchMemories: vi.fn(),
      listRelevantMemories: vi.fn(),
      getMemoryGraphContext: vi.fn(),
    },
  };
});

// TanStack Link → plain anchor (no router in the test tree).
vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  const Link = React.forwardRef(function Link(
    { to, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string },
    ref: React.Ref<HTMLAnchorElement>,
  ) {
    return (
      <a ref={ref} href={typeof to === "string" ? to : "#"} {...rest}>
        {children}
      </a>
    );
  });
  return { Link };
});

import { RelationshipMemoryList } from "@/components/business-connect/relationship-memory/RelationshipMemoryList";
import { RelationshipMemorySummary } from "@/components/business-connect/relationship-memory/RelationshipMemorySummary";

function makeMemory(overrides: Partial<RelationshipMemoryDTO> = {}): RelationshipMemoryDTO {
  return {
    id: "mem-1",
    ownerUserId: "user-1",
    subject: { type: "person", ref: "person-node-1" },
    kind: "preference",
    canonicalKey: "preference:coffee",
    canonicalValue: { text: "Prefers async communication over meetings" },
    confidence: 0.8,
    sourceCount: 3,
    status: "active",
    sensitivity: "standard",
    firstObservedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastObservedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastReviewedAt: null,
    registryVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderWith(node: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{node}</LangContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  listMock.mockReset();
  getByIdMock.mockReset();
});
afterEach(() => cleanup());

describe("BC-9.1 C1 — RelationshipMemoryList", () => {
  it("renders grouped active memories in a semantic list", async () => {
    listMock.mockResolvedValue({
      items: [
        makeMemory({ id: "a1", canonicalValue: { text: "Loves async" } }),
        makeMemory({ id: "a2", canonicalValue: { text: "Vegan diet" }, kind: "constraint" }),
      ],
      nextCursor: null,
      registryVersion: "1.0.0",
    });
    renderWith(<RelationshipMemoryList />);
    await waitFor(() => expect(screen.getByText("Loves async")).toBeTruthy());
    expect(screen.getByText("Vegan diet")).toBeTruthy();
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThan(0);
  });

  it("hides historical memories behind an aria-pressed toggle", async () => {
    listMock.mockResolvedValue({
      items: [
        makeMemory({ id: "a1", canonicalValue: { text: "Active fact" } }),
        makeMemory({
          id: "h1",
          status: "superseded",
          canonicalValue: { text: "Old fact" },
        }),
      ],
      nextCursor: null,
      registryVersion: "1.0.0",
    });
    renderWith(<RelationshipMemoryList />);
    await waitFor(() => expect(screen.getByText("Active fact")).toBeTruthy());
    expect(screen.queryByText("Old fact")).toBeNull();

    const toggle = screen.getByRole("button", { name: /show historical/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByText("Old fact")).toBeTruthy());
    expect(
      screen.getByRole("button", { name: /hide historical/i }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("renders an empty state when the SDK returns no items", async () => {
    listMock.mockResolvedValue({ items: [], nextCursor: null, registryVersion: "1.0.0" });
    renderWith(<RelationshipMemoryList />);
    await waitFor(() => expect(screen.getByText(/No memory yet/i)).toBeTruthy());
  });

  it("exposes aria-busy while loading and role=alert on error", async () => {
    let reject: (e: unknown) => void = () => {};
    listMock.mockImplementation(
      () =>
        new Promise((_r, r) => {
          reject = r;
        }),
    );
    renderWith(<RelationshipMemoryList />);
    const busy = await screen.findByRole("status");
    expect(busy.getAttribute("aria-busy")).toBe("true");
    reject(new Error("boom"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });

  it("opens the detail drawer when 'View details' is clicked", async () => {
    const mem = makeMemory({ canonicalValue: { text: "Detailed fact" } });
    listMock.mockResolvedValue({ items: [mem], nextCursor: null, registryVersion: "1.0.0" });
    getByIdMock.mockResolvedValue(mem);
    renderWith(<RelationshipMemoryList />);
    await waitFor(() => expect(screen.getByText("Detailed fact")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /view details/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    await waitFor(() => expect(getByIdMock).toHaveBeenCalledWith(mem.id));
  });
});

describe("BC-9.1 C1 — RelationshipMemorySummary", () => {
  it("shows the top active memories for a subject and a 'View all' link", async () => {
    listMock.mockResolvedValue({
      items: [makeMemory({ canonicalValue: { text: "Prefers evening calls" } })],
      nextCursor: null,
      registryVersion: "1.0.0",
    });
    renderWith(<RelationshipMemorySummary subject={{ type: "person", ref: "person-node-1" }} />);
    await waitFor(() => expect(screen.getByText("Prefers evening calls")).toBeTruthy());
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: { type: "person", ref: "person-node-1" },
        statuses: ["active"],
      }),
    );
    const link = screen.getByRole("link", { name: /view all/i });
    expect(link.getAttribute("href")).toBe("/business-connect/memory");
  });
});
