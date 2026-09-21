// @vitest-environment jsdom
// BC-4.5 — Recommendation feed UI contract tests.
//
// Verifies: reasons render, filter narrows list, dismiss hides item, empty
// state renders, cursor error surfaces reset CTA. Uses a per-test mock of
// the RelationshipGraphSDK + PlatformIdentitySDK to keep the harness fast
// and deterministic (no route-tree warmup, no supabase, no network).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { axe } from "jest-axe";
import { LangContext } from "@/lib/i18n";
import { GraphError, type RecommendationPageDTO } from "@/lib/graph";

// ---- Mocks (hoisted) --------------------------------------------------------
const { registerNode, recommendConnections, getCurrentUser } = vi.hoisted(() => ({
  registerNode: vi.fn(),
  recommendConnections: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/graph", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    RelationshipGraphSDK: { registerNode, recommendConnections },
  };
});

vi.mock("@/lib/identity/platform-identity-sdk", () => ({
  PlatformIdentitySDK: { getCurrentUser },
}));

// ---- Imports after mocks ----------------------------------------------------
import { RecommendationFeed } from "@/components/business-connect/RecommendationFeed";

// ---- Builders ---------------------------------------------------------------
function makeNode(id: string, name: string, kind = "person") {
  return {
    id,
    kind,
    externalRef: { type: "user_profile", id },
    tenant: { type: "global" as const, id: null },
    visibility: "connected" as const,
    metadata: { displayName: name, headline: "Founder" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function makePage(overrides?: Partial<RecommendationPageDTO>): RecommendationPageDTO {
  return {
    items: [
      {
        candidateNode: makeNode("n-1", "Alice"),
        score: 0.9,
        rank: 1,
        reasons: [
          {
            code: "MUTUAL_CONNECTIONS",
            summaryKey: "graph.recommendation.reason.mutual_connections",
            count: 4,
            priority: 1,
          },
        ],
        recommendationVersion: "1.0.0",
        freshness: "fresh",
      },
      {
        candidateNode: makeNode("n-2", "Bob"),
        score: 0.8,
        rank: 2,
        reasons: [
          {
            code: "SHARED_COMPANY",
            summaryKey: "graph.recommendation.reason.shared_company",
            count: 1,
            priority: 2,
          },
        ],
        recommendationVersion: "1.0.0",
        freshness: "stale",
      },
    ],
    nextCursor: null,
    recommendationVersion: "1.0.0",
    registryVersion: 1,
    generatedAt: "2026-01-01T00:00:00Z",
    candidateCountEvaluated: 2,
    truncated: false,
    ...overrides,
  };
}

function renderFeed() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // BC-RC1 harness repair — RecommendationCard now links to the introductions
  // page via TanStack Router <Link>, so the feed must render inside a router.
  const rootRoute = createRootRoute({
    component: () => (
      <LangContext.Provider value={{ lang: "vi", setLang: () => {} }}>
        <QueryClientProvider client={qc}>
          <Outlet />
        </QueryClientProvider>
      </LangContext.Provider>
    ),
  });
  const feedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <RecommendationFeed />,
  });
  const introRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/business-connect/introductions/$targetPersonNodeId",
    component: () => <div>introduction</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([feedRoute, introRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

afterEach(() => cleanup());
beforeEach(() => {
  registerNode.mockReset();
  recommendConnections.mockReset();
  getCurrentUser.mockReset();
  getCurrentUser.mockResolvedValue({
    userId: "u-viewer",
    email: "v@example.com",
    profile: null,
    hasProfile: false,
  });
  registerNode.mockResolvedValue({
    id: "viewer-node",
    kind: "person",
    externalRef: { type: "user_profile", id: "u-viewer" },
    tenant: { type: "global", id: null },
    visibility: "connected",
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  });
});

describe("BC-4.5 RecommendationFeed", () => {
  it("renders candidate cards with reason chips", async () => {
    recommendConnections.mockResolvedValue(makePage());
    renderFeed();

    await waitFor(() => expect(screen.getAllByTestId("rec-card")).toHaveLength(2));
    expect(screen.queryByText("Alice")).not.toBeNull();
    expect(screen.queryByText(/4 người quen chung/)).not.toBeNull();
    expect(screen.queryByText(/Cùng công ty/)).not.toBeNull();
  });

  it("filter narrows list by reason category (client-side)", async () => {
    recommendConnections.mockResolvedValue(makePage());
    renderFeed();
    await waitFor(() => expect(screen.getAllByTestId("rec-card")).toHaveLength(2));

    fireEvent.click(screen.getByTestId("rec-filter-company"));
    await waitFor(() => {
      const cards = screen.getAllByTestId("rec-card");
      expect(cards).toHaveLength(1);
      expect(within(cards[0]).queryByText("Bob")).not.toBeNull();
    });
    expect(screen.getByTestId("rec-filter-company").getAttribute("aria-pressed")).toBe("true");
  });

  it("dismiss removes the item from the list", async () => {
    recommendConnections.mockResolvedValue(makePage());
    renderFeed();
    await waitFor(() => expect(screen.getAllByTestId("rec-card")).toHaveLength(2));

    const firstDismiss = within(screen.getAllByTestId("rec-card")[0]).getByTestId("rec-dismiss");
    fireEvent.click(firstDismiss);
    await waitFor(() => expect(screen.getAllByTestId("rec-card")).toHaveLength(1));
  });

  it("renders empty state when no items", async () => {
    recommendConnections.mockResolvedValue(makePage({ items: [] }));
    renderFeed();
    await waitFor(() => expect(screen.queryByTestId("rec-empty")).not.toBeNull());
  });

  it("surfaces reset CTA on cursor-version error", async () => {
    recommendConnections.mockRejectedValue(new GraphError("RECOMMENDATION_VERSION_UNSUPPORTED"));
    renderFeed();
    await waitFor(() => expect(screen.queryByTestId("rec-error")).not.toBeNull());
    expect(screen.queryByText(/Bộ gợi ý đã cập nhật/)).not.toBeNull();
  });

  it("has no axe violations in the loaded state", async () => {
    recommendConnections.mockResolvedValue(makePage());
    const { container } = renderFeed();
    await waitFor(() => expect(screen.getAllByTestId("rec-card")).toHaveLength(2));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
