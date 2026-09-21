// @vitest-environment jsdom
// BC-9.1 Turn C2 — Explorer / filters / search UI shard.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";

const searchMock = vi.fn();
const getByIdMock = vi.fn();
const graphMock = vi.fn();

vi.mock("@/lib/business-connect/relationship-memory", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    RelationshipMemorySDK: {
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      getById: (...a: unknown[]) => getByIdMock(...a),
      searchMemories: (...a: unknown[]) => searchMock(...a),
      listRelevantMemories: vi.fn(),
      getMemoryGraphContext: (...a: unknown[]) => graphMock(...a),
    },
  };
});

import {
  RelationshipMemoryExplorer,
  RelationshipMemoryFilters,
  RELATIONSHIP_MEMORY_DEFAULT_FILTERS,
  activeFilterCount,
  filterMinConfidence,
} from "@/components/business-connect/relationship-memory";

function withProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{ui}</LangContext.Provider>
    </QueryClientProvider>
  );
}

const RESULT = {
  memory: {
    id: "m1",
    subjectType: "person",
    subjectRef: "p1",
    memoryKind: "preference",
    canonicalText: "Prefers coffee over tea",
    confidence: 0.82,
    status: "active",
    sensitivity: "standard",
    lastObservedAt: new Date().toISOString(),
    sourceCount: 2,
  },
  relevanceScore: 0.9,
  relevanceBand: "high",
  matchedOn: ["semantic_match", "verified"],
  freshness: "fresh",
  evidenceSummary: "Mentioned in 2 meetings",
  graphContextSummary: null,
  citations: [
    {
      memoryRef: { id: "m1" },
      sourceDomain: "meeting_safe",
      sourceLabel: "s",
      occurredAt: null,
      freshnessBand: "fresh",
      confidence: 0.8,
      lifecycle: "active",
    },
  ],
  viewerPermissions: { canReview: true, canFeedback: true },
  conflictState: { hasConflict: false },
  historical: false,
};

beforeEach(() => {
  searchMock.mockReset();
  getByIdMock.mockReset();
  graphMock.mockReset();
});
afterEach(() => cleanup());

describe("filterMinConfidence", () => {
  it("maps bands to numeric thresholds", () => {
    expect(filterMinConfidence("any")).toBeUndefined();
    expect(filterMinConfidence("medium")).toBe(0.5);
    expect(filterMinConfidence("high")).toBe(0.75);
    expect(filterMinConfidence("verified")).toBe(0.9);
  });
});

describe("activeFilterCount", () => {
  it("counts each non-default filter facet once", () => {
    expect(activeFilterCount(RELATIONSHIP_MEMORY_DEFAULT_FILTERS)).toBe(0);
    expect(
      activeFilterCount({
        ...RELATIONSHIP_MEMORY_DEFAULT_FILTERS,
        kinds: ["goal"],
        confidence: "high",
        includeHistorical: true,
      }),
    ).toBe(3);
  });
});

describe("RelationshipMemoryFilters", () => {
  it("toggles kind chips via aria-pressed", () => {
    const onChange = vi.fn();
    render(
      withProviders(
        <RelationshipMemoryFilters
          value={RELATIONSHIP_MEMORY_DEFAULT_FILTERS}
          onChange={onChange}
        />,
      ),
    );
    const chip = screen.getByTestId("memory-filter-kind-goal");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ kinds: ["goal"] }));
  });

  it("uses role=group with an accessible name", () => {
    render(
      withProviders(
        <RelationshipMemoryFilters
          value={RELATIONSHIP_MEMORY_DEFAULT_FILTERS}
          onChange={vi.fn()}
        />,
      ),
    );
    expect(screen.getByRole("group", { name: /memory filters/i })).toBeTruthy();
  });
});

describe("RelationshipMemoryExplorer", () => {
  it("shows hint when no query or filter is active and does not call SDK", () => {
    render(withProviders(<RelationshipMemoryExplorer />));
    expect(screen.getByText(/start by typing a keyword/i)).toBeTruthy();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("performs search after debounce and renders results with role=list", async () => {
    searchMock.mockResolvedValue({
      items: [RESULT],
      totalConsidered: 1,
      registryVersion: "1.0.0",
      profileId: "p",
      truncated: false,
    });
    render(withProviders(<RelationshipMemoryExplorer />));
    const input = screen.getByTestId("memory-search-input");
    fireEvent.change(input, { target: { value: "coffee" } });
    await waitFor(() => expect(searchMock).toHaveBeenCalledTimes(1), {
      timeout: 1000,
    });
    const list = await screen.findByTestId("memory-search-results");
    expect(list.getAttribute("role")).toBe("list");
    expect(screen.getByText(/prefers coffee/i)).toBeTruthy();
  });

  it("flags too-long queries and skips search", async () => {
    render(withProviders(<RelationshipMemoryExplorer />));
    const input = screen.getByTestId("memory-search-input");
    fireEvent.change(input, { target: { value: "x".repeat(401) } });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(searchMock).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
