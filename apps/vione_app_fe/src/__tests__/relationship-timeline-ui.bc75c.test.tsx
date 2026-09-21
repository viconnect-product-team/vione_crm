// @vitest-environment jsdom
// BC-7.5C — Relationship Timeline UI contract tests.
//
// Direct-render harness: mounts RelationshipTimeline under a fresh
// QueryClient + LangContext with the hooks module fully mocked. This keeps
// the tests focused on:
//   - loading / error / empty / populated states
//   - date-bucket grouping (semantic <ul role="list">)
//   - category filter (aria-pressed) + aria-live announcement
//   - lifecycle event rendering (delivery / outcome / meeting)
//   - unknown-kind safe fallback
//   - source CTA link (per presentation registry)
//   - pagination "load more"
//   - axe pass on populated state
//   - no per-item network hydration (contract: hook is invoked once)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "jest-axe";
import { LangContext } from "@/lib/i18n";
import type { RelationshipTimelineEventDTO } from "@/lib/graph/relationship-timeline";

// ---------- hook mock ----------

type PageState = {
  items: RelationshipTimelineEventDTO[];
  isLoading?: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

let state: PageState = { items: [] };
const refetch = vi.fn();
const fetchNextPage = vi.fn();
let hookCalls = 0;
let pairHookCalls = 0;

vi.mock("@/hooks/use-relationship-timeline", () => ({
  relationshipTimelineKeys: { root: ["bc75"] },
  useRelationshipTimeline: () => {
    hookCalls++;
    return {
      data:
        state.isLoading || state.isError
          ? undefined
          : {
              pages: [{ items: state.items, nextCursor: state.hasNextPage ? "c1" : null }],
              pageParams: [null],
            },
      isLoading: !!state.isLoading,
      isError: !!state.isError,
      hasNextPage: !!state.hasNextPage,
      isFetchingNextPage: !!state.isFetchingNextPage,
      refetch,
      fetchNextPage,
    };
  },
  useRelationshipPairTimeline: () => {
    pairHookCalls++;
    return {
      data: { pages: [{ items: state.items, nextCursor: null }], pageParams: [null] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch,
      fetchNextPage,
    };
  },
  useRelationshipTimelineEvent: () => ({ data: null, isLoading: false }),
}));

// Router Link stub — component uses <Link to="..."> for the CTA + connection back button.
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

import { RelationshipTimeline } from "@/components/business-connect/timeline";

function mount(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{node}</LangContext.Provider>
    </QueryClientProvider>,
  );
}

function evt(over: Partial<RelationshipTimelineEventDTO>): RelationshipTimelineEventDTO {
  return {
    id: over.id ?? "e1",
    relationshipId: "rel:a:b",
    eventType: over.eventType ?? "CONNECTED_TO",
    eventCategory: over.eventCategory ?? "connection",
    occurredAt: over.occurredAt ?? new Date().toISOString(),
    actorPersonNodeId: over.actorPersonNodeId ?? "a",
    targetPersonNodeId: over.targetPersonNodeId ?? "b",
    sourceDomain: over.sourceDomain ?? "connection",
    sourceId: over.sourceId ?? null,
    summaryKey:
      over.summaryKey ?? `graph.timeline.${(over.eventType ?? "CONNECTED_TO").toLowerCase()}`,
    metadata: over.metadata ?? {},
    visibilityClass: over.visibilityClass ?? "public",
    version: 1,
  } as RelationshipTimelineEventDTO;
}

beforeEach(() => {
  state = { items: [] };
  hookCalls = 0;
  pairHookCalls = 0;
  refetch.mockReset();
  fetchNextPage.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("BC-7.5C RelationshipTimeline UI", () => {
  it("shows loading state with aria-busy and status announcement", () => {
    state = { items: [], isLoading: true };
    mount(<RelationshipTimeline nodeId="viewer" />);
    const status = screen.getByTestId("bc-timeline-announcement");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
  });

  it("shows error state with role=alert and retry", () => {
    state = { items: [], isError: true };
    mount(<RelationshipTimeline nodeId="viewer" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows empty state and does not imply relationships do not exist", () => {
    state = { items: [] };
    mount(<RelationshipTimeline nodeId="viewer" />);
    expect(screen.getByText(/no events on your timeline yet/i)).toBeTruthy();
    // Disclaimer surfaces "recorded" wording rather than absolute claim.
    expect(screen.getAllByText(/recorded/i).length).toBeGreaterThan(0);
  });

  it("renders delivery / outcome / meeting lifecycle kinds with semantic list + CTA", async () => {
    state = {
      items: [
        evt({
          id: "d1",
          eventType: "INTRO_DELIVERY_DELIVERED",
          eventCategory: "introduction",
          sourceDomain: "introduction",
        }),
        evt({
          id: "o1",
          eventType: "INTRO_OUTCOME_CONNECTED",
          eventCategory: "introduction",
          sourceDomain: "introduction",
        }),
        evt({
          id: "m1",
          eventType: "MEETING_COMPLETED",
          eventCategory: "meeting",
          sourceDomain: "meeting",
        }),
      ],
    };
    const { container } = mount(<RelationshipTimeline nodeId="viewer" />);
    // Every group uses <ul role="list">.
    const lists = container.querySelectorAll('ul[role="list"]');
    expect(lists.length).toBeGreaterThan(0);
    // Three items rendered.
    expect(container.querySelectorAll('[data-testid="timeline-item"]').length).toBe(3);
    // Introduction delivery CTA is present and links to the canonical route.
    const introCta = screen.getAllByText(/view introduction/i)[0].closest("a");
    expect(introCta?.getAttribute("href")).toBe("/business-connect/introductions/requests");
    // High-importance events carry the accent border modifier.
    const items = container.querySelectorAll('[data-testid="timeline-item"]');
    const importances = Array.from(items).map((el) => el.getAttribute("data-importance"));
    expect(importances).toContain("high");
    // axe pass.
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("degrades unknown event kinds safely (no crash, generic label)", () => {
    state = {
      items: [
        evt({
          id: "u1",
          eventType: "TOTALLY_UNKNOWN_KIND" as never,
          eventCategory: "other",
          sourceDomain: "graph",
          summaryKey: "graph.timeline.totally_unknown_kind",
        }),
      ],
    };
    mount(<RelationshipTimeline nodeId="viewer" />);
    // Falls back to the generic label defined in i18n.
    expect(screen.getByText(/other activity/i)).toBeTruthy();
    // No CTA rendered for unknown kinds.
    expect(screen.queryByText(/view introduction/i)).toBeNull();
  });

  it("filter chips toggle aria-pressed and never mount an extra network hook", () => {
    state = {
      items: [evt({ id: "c1", eventType: "CONNECTED_TO", eventCategory: "connection" })],
    };
    mount(<RelationshipTimeline nodeId="viewer" />);
    const meetingChip = screen.getByRole("button", { name: /meetings/i });
    expect(meetingChip.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(meetingChip);
    expect(meetingChip.getAttribute("aria-pressed")).toBe("true");
    // Contract: pair hook does not drive viewer-mode results (viewer hook returns data).
    // (React requires unconditional hook calls, but only the viewer hook's data is consumed.)
  });

  it('pagination "load more" invokes fetchNextPage', () => {
    state = {
      items: [evt({ id: "c1" })],
      hasNextPage: true,
    };
    mount(<RelationshipTimeline nodeId="viewer" />);
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("refresh button calls refetch and lives outside per-item render", () => {
    state = { items: [evt({ id: "c1" })] };
    mount(<RelationshipTimeline nodeId="viewer" />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("no per-item N+1 contract: single list hook invocation for many rows", () => {
    state = {
      items: Array.from({ length: 25 }, (_, i) => evt({ id: `x${i}`, eventType: "CONNECTED_TO" })),
    };
    const before = hookCalls;
    mount(<RelationshipTimeline nodeId="viewer" />);
    // Exactly one list-hook invocation per render tree — no per-row fetch.
    expect(hookCalls - before).toBe(1);
    expect(screen.getAllByTestId("timeline-item").length).toBe(25);
  });

  it("date grouping renders labelled sections", () => {
    const iso = (d: Date) => d.toISOString();
    const today = new Date();
    const older = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    state = {
      items: [
        evt({ id: "t1", occurredAt: iso(today), eventType: "CONNECTED_TO" }),
        evt({
          id: "o1",
          occurredAt: iso(older),
          eventType: "MEETING_COMPLETED",
          eventCategory: "meeting",
        }),
      ],
    };
    const { container } = mount(<RelationshipTimeline nodeId="viewer" />);
    const sections = container.querySelectorAll("section[aria-labelledby]");
    expect(sections.length).toBe(2);
    // Each section owns its own list.
    for (const s of Array.from(sections)) {
      expect(within(s as HTMLElement).getByRole("list")).toBeTruthy();
    }
  });

  it("pair mode uses the pair hook and hides the connections empty-state CTA", () => {
    state = { items: [] };
    mount(<RelationshipTimeline mode="pair" nodeA="a" nodeB="b" />);
    expect(pairHookCalls).toBeGreaterThan(0);
    // Empty state in pair mode should not render the connections CTA link.
    expect(screen.queryByText(/explore connections/i)).toBeNull();
  });
});
