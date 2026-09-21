// @vitest-environment jsdom
//
// BC-Mobile-6A — Calm suggestion surfaces (Home + Person Detail).
//
// Pins: ≤3 calm rows, deterministic template rendering, AI wording usage
// when present, dismiss flow (records + disappears), error ⇒ retry /
// quiet-fail isolation, loading/empty semantics, VI+EN, and axe-clean.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import type { RelationshipRecommendation } from "@/lib/business-connect/mobile/relationship-intelligence.types";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";

afterEach(cleanup);

vi.mock("@/hooks/use-viewer-user-id", () => ({ useViewerUserId: () => "viewer-1" }));

vi.mock("@/lib/business-connect/mobile/relationship-intelligence.sdk", () => ({
  RelationshipIntelSDK: {
    today: vi.fn(),
    person: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { RelationshipIntelSDK } from "@/lib/business-connect/mobile/relationship-intelligence.sdk";
import { RelationshipSuggestions } from "@/components/business-connect/mobile/RelationshipSuggestions";
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

beforeEach(() => {
  vi.clearAllMocks();
  sdk.today.mockResolvedValue({ recommendations: [] });
  sdk.person.mockResolvedValue({ recommendation: null });
  sdk.dismiss.mockResolvedValue({ ok: true });
});

/** Memory router (Link) + query client + lang provider. */
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
  const personRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network/$personId",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, personRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router as any} />);
}

describe("RelationshipSuggestions — Home", () => {
  it("renders up to 3 calm rows with name, suggestion and truth reason (VI)", async () => {
    sdk.today.mockResolvedValue({
      recommendations: [
        rec({ id: "r-1" }),
        rec({ id: "r-2", person: { ...rec().person, personId: "c:2", displayName: "Lan" } }),
        rec({ id: "r-3", person: { ...rec().person, personId: "g:3", displayName: "Huy" } }),
        rec({ id: "r-4", person: { ...rec().person, personId: "u:4", displayName: "Extra" } }),
      ],
    });
    const { container } = await renderWith(<RelationshipSuggestions />);
    await screen.findByText(/Gợi ý hôm nay/);
    expect(screen.queryByText("Extra")).toBeNull();
    // Deterministic template, not hallucinated prose; reason carries the day count.
    expect((await screen.findAllByText("Có thể đã đến lúc kết nối lại.")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/52 ngày/i).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("%");
    await expectNoAxeViolations(container);
  });

  it("uses AI wording when present, deterministic template otherwise", async () => {
    sdk.today.mockResolvedValue({
      recommendations: [
        rec({ aiSuggestion: "Nên ghé thăm lại mối quan hệ này.", wordingSource: "ai" }),
        rec({ id: "r-2", person: { ...rec().person, personId: "c:2", displayName: "Lan" } }),
      ],
    });
    await renderWith(<RelationshipSuggestions />);
    await screen.findByText("Nên ghé thăm lại mối quan hệ này.");
    // Second row falls back to the deterministic template.
    expect(screen.getAllByText("Có thể đã đến lúc kết nối lại.").length).toBe(1);
  });

  it("dismiss records the choice and the row disappears after refetch", async () => {
    sdk.today
      .mockResolvedValueOnce({ recommendations: [rec()] })
      .mockResolvedValue({ recommendations: [] });
    await renderWith(<RelationshipSuggestions />);
    fireEvent.click(await screen.findByRole("button", { name: "Ẩn gợi ý này" }));
    await waitFor(() => expect(sdk.dismiss).toHaveBeenCalledWith(PERSON_ID, "reconnect"));
    await waitFor(() => expect(screen.queryByText(/Gợi ý hôm nay/)).toBeNull());
  });

  it("error → section hides and offers Retry; sibling Home content unaffected", async () => {
    sdk.today.mockRejectedValue(new Error("down"));
    await renderWith(
      <div>
        <p>Nội dung hôm nay</p>
        <RelationshipSuggestions />
      </div>,
    );
    await screen.findByText("Nội dung hôm nay");
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    sdk.today.mockResolvedValue({ recommendations: [rec()] });
    fireEvent.click(retry);
    await screen.findByText(/Gợi ý hôm nay/);
  });

  it("loading → aria status; empty recommendations → section hidden", async () => {
    sdk.today.mockReturnValue(new Promise(() => {}));
    const loading = await renderWith(<RelationshipSuggestions />);
    await waitFor(() => expect(loading.container.querySelector('[role="status"]')).toBeTruthy());
    loading.unmount();

    sdk.today.mockResolvedValue({ recommendations: [] });
    const empty = await renderWith(<RelationshipSuggestions />);
    await waitFor(() => expect(sdk.today).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(empty.container.textContent ?? "").toBe(""));
  });

  it("renders in English with deterministic template", async () => {
    sdk.today.mockResolvedValue({ recommendations: [rec()] });
    await renderWith(<RelationshipSuggestions />, "en");
    await screen.findByText(/Today.s suggestions/);
    await screen.findByText("It may be time to reconnect.");
    expect(screen.getByText(/52 days ago/i)).toBeTruthy();
  });
});

describe("PersonSuggestion — Person Detail", () => {
  it("renders the suggestion + truth reason for this person only", async () => {
    sdk.person.mockResolvedValue({ recommendation: rec() });
    const { container } = await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    await screen.findByText("Có thể đã đến lúc kết nối lại.");
    expect(screen.getByText(/52 ngày/i)).toBeTruthy();
    expect(sdk.person).toHaveBeenCalledWith(PERSON_ID, expect.anything());
    await expectNoAxeViolations(container);
  });

  it("no recommendation → renders nothing (quiet)", async () => {
    const { container } = await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    await waitFor(() => expect(sdk.person).toHaveBeenCalled());
    await waitFor(() => expect(container.textContent ?? "").toBe(""));
  });

  it("error → calm retry; dismiss hides the section", async () => {
    sdk.person.mockRejectedValueOnce(new Error("down"));
    await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    sdk.person.mockResolvedValue({ recommendation: rec() });
    fireEvent.click(retry);
    fireEvent.click(await screen.findByRole("button", { name: "Ẩn gợi ý này" }));
    await waitFor(() => expect(sdk.dismiss).toHaveBeenCalledWith(PERSON_ID, "reconnect"));
  });

  it("no raw id / owner fields leak into the DOM", async () => {
    sdk.person.mockResolvedValue({ recommendation: rec() });
    const { container } = await renderWith(<PersonSuggestion personId={PERSON_ID} />);
    await screen.findByText("Có thể đã đến lúc kết nối lại.");
    expect(container.textContent).not.toContain(PERSON_ID);
    expect(container.textContent).not.toMatch(/owner|user_id/i);
  });
});
