// @vitest-environment jsdom
//
// BC-Mobile-5E — Network incoming-requests surface.
//
// Contract coverage:
//  - Rows render privacy-safe counterpart identity only; accept/decline
//    delegate to the frozen SDK verbs with the connection id.
//  - Empty / error(+retry) states are truthful; the badge label is exact
//    below the page bound and "N+" at it.
//  - axe: the populated list has no violations.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";
import { requestCountLabel } from "@/hooks/use-network-requests";
import type { GlobalConnectionDTO } from "@/lib/global-network/types";

vi.mock("@/hooks/use-viewer-user-id", () => ({
  useViewerUserId: () => "viewer-1",
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: "viewer-1" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));

vi.mock("@/lib/global-network/network.sdk", () => ({
  GlobalNetworkSDK: {
    connections: { listIncoming: vi.fn() },
    counterparts: { resolvePublic: vi.fn() },
    mutations: { accept: vi.fn(), decline: vi.fn() },
  },
}));

import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import { NetworkRequestsView } from "@/components/business-connect/mobile/NetworkRequestsView";

const sdk = GlobalNetworkSDK as unknown as {
  connections: { listIncoming: ReturnType<typeof vi.fn> };
  counterparts: { resolvePublic: ReturnType<typeof vi.fn> };
  mutations: { accept: ReturnType<typeof vi.fn>; decline: ReturnType<typeof vi.fn> };
};

function makeConnection(id: string, counterpartUserId: string): GlobalConnectionDTO {
  return {
    id,
    counterpartUserId,
    status: "pending",
    direction: "incoming",
    requestedByCurrentUser: false,
    source: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    respondedAt: null,
  } as unknown as GlobalConnectionDTO;
}

beforeEach(() => {
  vi.clearAllMocks();
  sdk.connections.listIncoming.mockResolvedValue([
    makeConnection("c-1", "u-1"),
    makeConnection("c-2", "u-2"),
  ]);
  sdk.counterparts.resolvePublic.mockResolvedValue([
    {
      userId: "u-1",
      displayName: "Trần Minh Anh",
      avatarUrl: null,
      headline: "Director",
      companyName: "Acme",
      primaryCardSlug: "anh",
    },
    {
      userId: "u-2",
      displayName: "Lê Quốc Bảo",
      avatarUrl: null,
      headline: null,
      companyName: null,
      primaryCardSlug: null,
    },
  ]);
  sdk.mutations.accept.mockResolvedValue({ connectionId: "c-1", status: "accepted" });
  sdk.mutations.decline.mockResolvedValue({ connectionId: "c-2", status: "declined" });
});

async function renderView() {
  const {
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
    createMemoryHistory,
    Outlet,
  } = await import("@tanstack/react-router");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: Outlet });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <QueryClientProvider client={queryClient}>
        <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
          <NetworkRequestsView />
        </LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const networkRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, networkRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router as any} />);
}

describe("requestCountLabel", () => {
  it("is exact below the page bound and N+ at it", () => {
    expect(requestCountLabel(0, 25)).toBe("0");
    expect(requestCountLabel(7, 25)).toBe("7");
    expect(requestCountLabel(25, 25)).toBe("25+");
  });
});

describe("NetworkRequestsView", () => {
  it("renders each request with public identity only and wires accept/decline", async () => {
    const { container } = await renderView();
    await screen.findByText("Trần Minh Anh");
    screen.getByText("Lê Quốc Bảo");
    screen.getByText(/Director · Acme/);
    expect(screen.getAllByText(/wants to connect with you/)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Accept request from Trần Minh Anh" }));
    await waitFor(() =>
      expect(sdk.mutations.accept).toHaveBeenCalledWith("c-1", expect.any(String)),
    );

    fireEvent.click(screen.getByRole("button", { name: "Decline request from Lê Quốc Bảo" }));
    await waitFor(() =>
      expect(sdk.mutations.decline).toHaveBeenCalledWith("c-2", {
        mutationKey: expect.any(String),
      }),
    );

    await expectNoAxeViolations(container);
  });

  it("shows the calm empty state when no requests are pending", async () => {
    sdk.connections.listIncoming.mockResolvedValue([]);
    sdk.counterparts.resolvePublic.mockResolvedValue([]);
    await renderView();
    await screen.findByText("No requests yet.");
  });

  it("shows the error state with a working retry", async () => {
    sdk.connections.listIncoming.mockRejectedValueOnce(new Error("boom"));
    await renderView();
    await screen.findByRole("alert");
    sdk.connections.listIncoming.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(sdk.connections.listIncoming).toHaveBeenCalledTimes(2));
  });

  it("a counterpart with no public card falls back to the private-member label", async () => {
    sdk.counterparts.resolvePublic.mockResolvedValue([]);
    await renderView();
    expect((await screen.findAllByText("Private member")).length).toBeGreaterThan(0);
  });
});
