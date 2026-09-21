// @vitest-environment jsdom
//
// BC-Mobile-6B — RelationshipActionSheet + Person Detail [Liên hệ] integration.
//
// Pins: sheet opens only for currently-authorized persons; unavailable
// actions omitted (never disabled); truthful tel:/mailto: handoffs; moment
// navigation; telemetry allowlist with NO contact PII; VI+EN; axe-clean
// light + dark.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import type { RelationshipRecommendation } from "@/lib/business-connect/mobile/relationship-intelligence.types";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";

afterEach(cleanup);

// vaul (drawer) references ResizeObserver; jsdom does not implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver ??= ResizeObserverStub;

vi.mock("@/hooks/use-viewer-user-id", () => ({ useViewerUserId: () => "viewer-1" }));

vi.mock("@/lib/business-connect/mobile/relationship-intelligence.sdk", () => ({
  RelationshipIntelSDK: {
    today: vi.fn(),
    person: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const personState: {
  current: { status: "ok"; person: BcMobilePersonDetail } | { status: "unavailable" };
} = {
  current: { status: "unavailable" },
};

vi.mock("@/hooks/use-business-connect-person", () => ({
  useBusinessConnectPerson: () => ({
    ...personState.current,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

import { RelationshipIntelSDK } from "@/lib/business-connect/mobile/relationship-intelligence.sdk";
import { PersonSuggestion } from "@/components/business-connect/mobile/PersonSuggestion";

const sdk = RelationshipIntelSDK as unknown as {
  today: ReturnType<typeof vi.fn>;
  person: ReturnType<typeof vi.fn>;
  dismiss: ReturnType<typeof vi.fn>;
};

const PERSON_ID = "u:123e4567-e89b-42d3-a456-426614174000";

function rec(overrides: Partial<RelationshipRecommendation> = {}): RelationshipRecommendation {
  return {
    id: "r-1",
    type: "reconnect",
    person: {
      personId: PERSON_ID,
      displayName: "Minh Tran",
      avatarUrl: null,
      headline: null,
      companyName: null,
      industryLabel: null,
      areaLabel: null,
    },
    reason: { kind: "last_interaction", days: 52, evidenceKind: "connected" },
    aiSuggestion: null,
    wordingSource: "deterministic",
    generatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

function personDto(
  contact: Partial<BcMobilePersonDetail["contact"] & object> = {},
): BcMobilePersonDetail {
  return {
    personId: PERSON_ID,
    kind: "connection",
    displayName: "Minh Tran",
    avatarUrl: null,
    headline: "CEO",
    companyName: "Acme",
    primaryCardSlug: null,
    relationship: { kind: "connected", connectedAt: null, requestedByViewer: null },
    contact: {
      phone: "+84 901 234 567",
      phoneHref: "tel:+84901234567",
      email: "minh@example.com",
      emailHref: "mailto:minh@example.com",
      websiteLabel: null,
      websiteHref: null,
      social: [],
      ...contact,
    },
  };
}

async function renderWith(ui: React.ReactNode, lang: "vi" | "en" = "vi") {
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
        <LangContext.Provider value={{ lang, setLang: () => {} }}>{ui}</LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const momentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/moment/$personId",
    component: () => <div data-testid="moment-target" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, momentRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const view = render(<RouterProvider router={router} />);
  return { router, container: view.container };
}

beforeEach(() => {
  vi.clearAllMocks();
  sdk.today.mockResolvedValue({ recommendations: [] });
  sdk.person.mockResolvedValue({ recommendation: null });
  sdk.dismiss.mockResolvedValue({ ok: true });
  personState.current = { status: "ok", person: personDto() };
});

describe("BC-Mobile-6B — Person Detail contact entry", () => {
  it("shows [Liên hệ] only when the person resolves through the current authorized DTO", async () => {
    sdk.person.mockResolvedValue({ recommendation: rec() });
    await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    expect(await screen.findByTestId("bc6b-contact")).toBeTruthy();

    cleanup();
    personState.current = { status: "unavailable" };
    sdk.person.mockResolvedValue({ recommendation: rec() });
    await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    await screen.findByText(/Có thể đã đến lúc kết nối lại/i);
    expect(screen.queryByTestId("bc6b-contact")).toBeNull();
  });

  it("opening the sheet shows available actions with truthful handoffs; telemetry carries no PII", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    sdk.person.mockResolvedValue({ recommendation: rec() });
    const { container } = await renderWith(<PersonSuggestion personId={PERSON_ID} />);

    fireEvent.click(await screen.findByTestId("bc6b-contact"));

    const call = await screen.findByTestId("bc6b-action-call");
    expect(call.getAttribute("href")).toBe("tel:+84901234567");
    expect(screen.getByTestId("bc6b-action-email").getAttribute("href")).toBe(
      "mailto:minh@example.com",
    );
    expect(screen.getByTestId("bc6b-action-save_meeting_moment")).toBeTruthy();

    expect(infoSpy).toHaveBeenCalledWith(
      "[BC-Mobile][6A]",
      "RELATIONSHIP_ACTION_SHEET_OPENED",
      expect.objectContaining({ surface: "person" }),
    );

    // No contact PII in any telemetry payload.
    for (const callArgs of infoSpy.mock.calls) {
      const serialized = JSON.stringify(callArgs);
      expect(serialized).not.toContain("901234567");
      expect(serialized).not.toContain("minh@example.com");
      expect(serialized).not.toContain("Minh Tran");
    }

    await expectNoAxeViolations(container);
    infoSpy.mockRestore();
  });

  it("person without contact channels → only the moment action is listed", async () => {
    personState.current = {
      status: "ok",
      person: personDto({
        phone: null,
        phoneHref: null,
        email: null,
        emailHref: null,
        websiteLabel: null,
        websiteHref: null,
        social: [],
      }),
    };
    sdk.person.mockResolvedValue({ recommendation: rec() });
    await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    fireEvent.click(await screen.findByTestId("bc6b-contact"));

    expect(screen.queryByTestId("bc6b-action-call")).toBeNull();
    expect(screen.queryByTestId("bc6b-action-email")).toBeNull();
    expect(await screen.findByTestId("bc6b-action-save_meeting_moment")).toBeTruthy();
  });

  it("moment action navigates to the canonical moment composer route", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    sdk.person.mockResolvedValue({ recommendation: rec() });
    const { router } = await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    fireEvent.click(await screen.findByTestId("bc6b-contact"));
    fireEvent.click(await screen.findByTestId("bc6b-action-save_meeting_moment"));

    await waitFor(() =>
      expect(decodeURIComponent(router.state.location.pathname)).toBe(
        `/connect-app/moment/${PERSON_ID}`,
      ),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[BC-Mobile][6A]",
      "RELATIONSHIP_MOMENT_FLOW_OPENED",
      expect.objectContaining({ surface: "person" }),
    );
    infoSpy.mockRestore();
  });

  it("call/email clicks emit handoff_opened (never 'completed') telemetry", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    sdk.person.mockResolvedValue({ recommendation: rec() });
    await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    fireEvent.click(await screen.findByTestId("bc6b-contact"));

    fireEvent.click(await screen.findByTestId("bc6b-action-call"));
    expect(infoSpy).toHaveBeenCalledWith(
      "[BC-Mobile][6A]",
      "RELATIONSHIP_CALL_OPENED",
      expect.objectContaining({ surface: "person" }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[BC-Mobile][6A]",
      "RELATIONSHIP_ACTION_SELECTED",
      expect.objectContaining({ action: "call", result: "handoff_opened" }),
    );
    const serialized = JSON.stringify(infoSpy.mock.calls);
    expect(serialized).not.toContain("completed");
    expect(serialized).not.toContain('"sent"');
    infoSpy.mockRestore();
  });

  it("renders EN copy and stays axe-clean in dark mode", async () => {
    sdk.person.mockResolvedValue({ recommendation: rec() });
    const { container } = await renderWith(<PersonSuggestion personId={PERSON_ID} />, "en");
    fireEvent.click(await screen.findByTestId("bc6b-contact"));

    expect(await screen.findByText("Contact Minh Tran")).toBeTruthy();
    expect(screen.getByText("Call")).toBeTruthy();
    expect(screen.getByText("Save meeting moment")).toBeTruthy();

    document.documentElement.classList.add("dark");
    await expectNoAxeViolations(container);
    document.documentElement.classList.remove("dark");
  });
});
