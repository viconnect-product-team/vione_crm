// @vitest-environment jsdom
//
// BC-Mobile-5E — Public Card Connection Handshake panel.
//
// Contract coverage:
//  - Anonymous: ONE sign-in CTA whose continuation is the same internal
//    /c/<token> path (no external URL, no open redirect); NO state fetch.
//  - Authenticated states: none → Connect; outgoing_pending → Pending +
//    Withdraw; incoming_pending → Accept + Decline; connected → quiet status;
//    self / unavailable → nothing renders (neutral).
//  - Mutations delegate with the connection id from the state DTO; the
//    opaque token is the only handshake handle for send.
//  - axe: no violations in the actionable states.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";

afterEach(cleanup);

const TOKEN = "b".repeat(64);
const authState: { user: { id: string } | null } = { user: null };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: authState.user } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));

vi.mock("@/lib/business-connect/mobile/identity-connect.sdk", () => ({
  IdentityConnectSDK: {
    getState: vi.fn(),
    send: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
    withdraw: vi.fn(),
  },
}));

import { IdentityConnectSDK } from "@/lib/business-connect/mobile/identity-connect.sdk";
import { PublicCardConnectPanel } from "@/components/business-connect/mobile/me/PublicCardConnectPanel";

const sdk = IdentityConnectSDK as unknown as {
  getState: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  accept: ReturnType<typeof vi.fn>;
  decline: ReturnType<typeof vi.fn>;
  withdraw: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = null;
  sdk.getState.mockResolvedValue({ state: "none", connectionId: null });
  sdk.send.mockResolvedValue({ connectionId: "c-1", status: "pending", idempotent: false });
  sdk.accept.mockResolvedValue({ connectionId: "c-1", status: "accepted", idempotent: false });
  sdk.decline.mockResolvedValue({ connectionId: "c-1", status: "declined", idempotent: false });
  sdk.withdraw.mockResolvedValue({ connectionId: "c-1", status: "cancelled", idempotent: false });
});

/** Minimal memory router (Link needs router context) + query client + lang. */
async function renderPanel() {
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
          <PublicCardConnectPanel token={TOKEN} />
        </LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/auth",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, authRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router as any} />);
}

describe("PublicCardConnectPanel — anonymous", () => {
  it("renders ONLY the sign-in CTA with a safe same-origin continuation and never fetches state", async () => {
    const { container } = await renderPanel();
    const link = await screen.findByRole("link", { name: "Sign in to connect" });
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("/auth")).toBe(true);
    expect(href).not.toMatch(/https?:/);
    expect(decodeURIComponent(href)).toContain(`/c/${TOKEN}`);
    expect(sdk.getState).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });
});

describe("PublicCardConnectPanel — authenticated", () => {
  beforeEach(() => {
    authState.user = { id: "viewer-1" };
  });

  it("none → Connect sends the handshake via the opaque token", async () => {
    const { container } = await renderPanel();
    const button = await screen.findByRole("button", { name: "Send a connection request" });
    fireEvent.click(button);
    await waitFor(() => expect(sdk.send).toHaveBeenCalledWith(TOKEN, expect.any(String)));
    await expectNoAxeViolations(container);
  });

  it("outgoing_pending → truthful pending status + Withdraw uses the state connection id", async () => {
    sdk.getState.mockResolvedValue({ state: "outgoing_pending", connectionId: "c-7" });
    await renderPanel();
    await screen.findByText("Request pending");
    fireEvent.click(screen.getByRole("button", { name: "Withdraw request" }));
    await waitFor(() => expect(sdk.withdraw).toHaveBeenCalledWith("c-7", expect.any(String)));
  });

  it("incoming_pending → Accept / Decline use the state connection id", async () => {
    sdk.getState.mockResolvedValue({ state: "incoming_pending", connectionId: "c-8" });
    const { container } = await renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(sdk.accept).toHaveBeenCalledWith("c-8", expect.any(String)));
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(sdk.decline).toHaveBeenCalledWith("c-8", expect.any(String)));
    await expectNoAxeViolations(container);
  });

  it("connected → quiet status, no actions", async () => {
    sdk.getState.mockResolvedValue({ state: "connected", connectionId: null });
    await renderPanel();
    await screen.findByText("Connected");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("self and unavailable render NOTHING (neutral)", async () => {
    sdk.getState.mockResolvedValue({ state: "self", connectionId: null });
    const { container, unmount } = await renderPanel();
    await waitFor(() => expect(sdk.getState).toHaveBeenCalled());
    expect(container.querySelector("button, a")).toBeNull();
    unmount();

    sdk.getState.mockResolvedValue({ state: "unavailable", connectionId: null });
    const again = await renderPanel();
    await waitFor(() => expect(sdk.getState).toHaveBeenCalledTimes(2));
    expect(again.container.querySelector("button, a")).toBeNull();
  });
});
