// @vitest-environment jsdom
// BC-Mobile — Recognition session expiry: notify + recapture, edits preserved.
//
// Contract under test:
// - A review session lives for CARD_SCAN_REVIEW_SESSION_TTL_MS after the OCR
//   candidate arrives. While live, human edits are NEVER wiped — returning to
//   a backgrounded tab keeps every keystroke.
// - When the session lapses: the human is notified (sonner toast + inline
//   role="alert" panel + polite live region), the review locks (no save path
//   remains — form removed AND late-save guards refuse), telemetry reports a
//   privacy-safe metric, and the only way forward is explicit recapture.
// - Expiry fires exactly once; a lapsed session closes the duplicate sheet.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import { axe } from "jest-axe";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { toast } from "sonner";
import {
  CARD_SCAN_REVIEW_SESSION_TTL_MS,
  cardScanSessionRemainingMs,
  isCardScanSessionValid,
} from "@/lib/business-connect/mobile/card-scan.session";
import { buildCandidateFromModel } from "@/lib/business-connect/mobile/card-scan.extract";
import type {
  BusinessCardCandidate,
  OcrModelOutput,
} from "@/lib/business-connect/mobile/card-scan.types";

// ── Module-boundary mocks (same pattern as the 4B suite) ────────────────────

const scanFnMock = vi.fn();
vi.mock("@/lib/business-connect/mobile/card-scan.functions", () => ({
  bcMobileCardScanFn: (...a: unknown[]) => scanFnMock(...a),
}));
const resolveFnMock = vi.fn(
  async (..._a: unknown[]): Promise<unknown> => ({ state: "none", candidates: [] }),
);
const saveFnMock = vi.fn((..._a: unknown[]): Promise<unknown> => Promise.resolve(null));
vi.mock("@/lib/business-connect/mobile/card-scan-save.functions", async (importOriginal) => {
  const orig =
    await importOriginal<typeof import("@/lib/business-connect/mobile/card-scan-save.functions")>();
  return {
    ...orig,
    bcMobileCardScanResolveFn: (...a: unknown[]) => resolveFnMock(...a),
    bcMobileCardScanSaveFn: (...a: unknown[]) => saveFnMock(...a),
  };
});
vi.mock("@/lib/business-connect/mobile/card-scan-image", async (importOriginal) => {
  const orig =
    await importOriginal<typeof import("@/lib/business-connect/mobile/card-scan-image")>();
  return {
    ...orig,
    processCardScanImage: vi.fn(async () => ({
      ok: true,
      image: { dataUrl: "data:image/jpeg;base64,QUJD", width: 1200, height: 756, bytes: 128 },
    })),
  };
});
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import { CardScanFlow } from "@/components/business-connect/mobile/card-scan/CardScanFlow";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const T0 = 1_800_000_000_000;
const SCAN_ID = "0fd2f6d8-2c3d-4a1f-9c7e-1a2b3c4d5e6f";
const GUEST_UUID = "11111111-2222-3333-4444-555555555555";

const MODEL: OcrModelOutput = {
  isBusinessCard: true,
  unusableReason: null,
  lines: [
    { text: "TRẦN MINH ANH", confidence: 0.95 },
    { text: "Mobile: +84 909 111 222", confidence: 0.9 },
    { text: "anh.tran@example.vn", confidence: 0.94 },
  ],
  displayNameLine: 0,
  titleLine: null,
  companyNameLine: null,
  addressLine: null,
  qrPresent: false,
};

function candidate(model: OcrModelOutput = MODEL): BusinessCardCandidate {
  const built = buildCandidateFromModel(model, SCAN_ID);
  if (!built.ok) throw new Error("expected candidate");
  return built.candidate;
}

const toastError = vi.mocked(toast.error);
let infoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  scanFnMock.mockReset();
  resolveFnMock.mockClear();
  saveFnMock.mockReset();
  toastError.mockClear();
  vi.spyOn(Date, "now").mockReturnValue(T0);
  infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function becomeHiddenAndVisible() {
  // Returning to the tab: the flow re-validates the session on visibility.
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

// ── 1. Pure session math ─────────────────────────────────────────────────────

describe("BC-Mobile — card scan session math", () => {
  it("is valid strictly within [start, start + TTL)", () => {
    expect(isCardScanSessionValid(T0, T0)).toBe(true);
    expect(isCardScanSessionValid(T0, T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS - 1)).toBe(true);
    expect(isCardScanSessionValid(T0, T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS)).toBe(false);
    expect(isCardScanSessionValid(T0, T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS + 1)).toBe(false);
  });

  it("null/invalid starts are never valid; remaining clamps at 0", () => {
    expect(isCardScanSessionValid(null, T0)).toBe(false);
    expect(isCardScanSessionValid(Number.NaN, T0)).toBe(false);
    expect(cardScanSessionRemainingMs(null, T0)).toBe(0);
    expect(cardScanSessionRemainingMs(T0, T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS + 5)).toBe(0);
    expect(cardScanSessionRemainingMs(T0, T0 + 60_000)).toBe(
      CARD_SCAN_REVIEW_SESSION_TTL_MS - 60_000,
    );
  });
});

// ── 2. Flow harness ──────────────────────────────────────────────────────────

async function renderFlow(lang: "vi" | "en" = "en") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <LangContext.Provider value={{ lang, setLang: () => {} }}>
          <Outlet />
        </LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const home = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app",
    component: () => <div>home</div>,
  });
  const network = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network",
    component: () => <div>network</div>,
  });
  const scan = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/card-scan",
    component: CardScanFlow,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([home, network, scan]),
    history: createMemoryHistory({ initialEntries: ["/connect-app/card-scan"] }),
  });
  const view = render(<RouterProvider router={router as never} />);
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: /take photo|chụp ảnh/i })).not.toBeNull(),
  );
  return { router, container: view.container };
}

async function reachReview() {
  scanFnMock.mockResolvedValue({ ok: true, candidate: candidate() });
  const rendered = await renderFlow();
  fireEvent.change(screen.getByLabelText(/choose card photo from library|chọn ảnh danh thiếp/i), {
    target: { files: [new File(["x".repeat(64)], "card.jpg", { type: "image/jpeg" })] },
  });
  fireEvent.click(await screen.findByRole("button", { name: /read card|nhận diện/i }));
  await screen.findByDisplayValue("TRẦN MINH ANH");
  return rendered;
}

function lapseSession() {
  vi.mocked(Date.now).mockReturnValue(T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS + 1_000);
}

// ── 3. Live session: edits are preserved ─────────────────────────────────────

describe("BC-Mobile — live session preserves edits", () => {
  it("returning to the tab before TTL keeps every edit and notifies nothing", async () => {
    await reachReview();
    fireEvent.change(screen.getByDisplayValue("TRẦN MINH ANH"), {
      target: { value: "TRẦN MINH ANH (đã sửa)" },
    });
    // Still inside the session window — 30s before the TTL.
    vi.mocked(Date.now).mockReturnValue(T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS - 30_000);
    becomeHiddenAndVisible();
    expect(screen.getByDisplayValue("TRẦN MINH ANH (đã sửa)")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
    expect(
      infoSpy.mock.calls.filter((c: unknown[]) => String(c[0]).includes("SESSION_EXPIRED")),
    ).toHaveLength(0);
    // The save path still works.
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    await waitFor(() => expect(saveFnMock).toHaveBeenCalledTimes(1));
  });
});

// ── 4. Lapsed session: notify, lock, recapture ───────────────────────────────

describe("BC-Mobile — lapsed session", () => {
  it("notifies (toast + alert + telemetry) and locks the review on return past TTL", async () => {
    await reachReview();
    lapseSession();
    becomeHiddenAndVisible();

    // Inline alert replaces the form; the draft can no longer be saved.
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /recognition session expired/i })).toBeTruthy();
    expect(screen.queryByDisplayValue("TRẦN MINH ANH")).toBeNull();
    expect(screen.queryByRole("button", { name: /save to network/i })).toBeNull();

    // Toast carries the truthful title + guidance.
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(
      "Recognition session expired",
      expect.objectContaining({ description: expect.stringMatching(/scan the card again/i) }),
    );

    // Privacy-safe telemetry — a bare metric name, never PII.
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("OCR_REVIEW_SESSION_EXPIRED"));
    const metricCall = infoSpy.mock.calls.find((c: unknown[]) =>
      String(c[0]).includes("SESSION_EXPIRED"),
    );
    expect(String(metricCall?.[0])).not.toMatch(/TRẦN|909|anh\.tran/i);
  });

  it("expires exactly once even on repeated visibility checks", async () => {
    await reachReview();
    lapseSession();
    becomeHiddenAndVisible();
    becomeHiddenAndVisible();
    becomeHiddenAndVisible();
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(
      infoSpy.mock.calls.filter((c: unknown[]) => String(c[0]).includes("SESSION_EXPIRED")),
    ).toHaveLength(1);
  });

  it("recapture returns to the capture stage with a clean session", async () => {
    await reachReview();
    lapseSession();
    becomeHiddenAndVisible();
    fireEvent.click(await screen.findByRole("button", { name: /scan card again/i }));
    // Back at capture: no expired panel, no stale draft, no save path.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByDisplayValue("TRẦN MINH ANH")).toBeNull();
    expect(screen.getByRole("button", { name: /take photo/i })).toBeTruthy();
    // A NEW scan after recapture opens a fresh, saveable review.
    await reachReviewFromCapture();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    await waitFor(() => expect(saveFnMock).toHaveBeenCalledTimes(1));
  });

  async function reachReviewFromCapture() {
    scanFnMock.mockResolvedValue({ ok: true, candidate: candidate() });
    fireEvent.change(screen.getByLabelText(/choose card photo from library|chọn ảnh danh thiếp/i), {
      target: { files: [new File(["y".repeat(64)], "card2.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(await screen.findByRole("button", { name: /read card|nhận diện/i }));
    await screen.findByDisplayValue("TRẦN MINH ANH");
  }

  it("late-save guard: expiry while the duplicate sheet is open refuses the save", async () => {
    resolveFnMock.mockResolvedValue({
      state: "exact",
      candidates: [
        {
          personId: `g:${GUEST_UUID}`,
          kind: "guest",
          displayName: "Anh",
          title: null,
          companyName: null,
          reason: "email",
        },
      ],
    });
    await reachReview();
    // Live session → Continue opens the duplicate sheet for a human decision.
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    // The session lapses while the sheet is open; the save attempt is refused.
    lapseSession();
    fireEvent.click(screen.getByRole("button", { name: /save as new contact/i }));
    expect(saveFnMock).not.toHaveBeenCalled();
    // Sheet closed, expiry surfaced.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("the expired panel is accessible (axe) and announced", async () => {
    const { container } = await reachReview();
    lapseSession();
    becomeHiddenAndVisible();
    await screen.findByRole("alert");
    // Polite live region carries the same truthful state.
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      "Recognition session expired",
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

// ── 5. Static contract guards ────────────────────────────────────────────────

describe("BC-Mobile — session contract guards", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("the flow wires TTL re-validation on timer, visibility, AND save guards", () => {
    const flow = read("src/components/business-connect/mobile/card-scan/CardScanFlow.tsx");
    expect(flow).toContain("cardScanSessionRemainingMs(");
    expect(flow).toContain("window.setTimeout(expireReviewSession");
    expect(flow).toContain("visibilitychange");
    expect(flow).toContain("isReviewSessionLive()");
    expect(flow).toContain("OCR_REVIEW_SESSION_EXPIRED");
  });

  it("the expiry panel NEVER writes to the DB or bypasses RLS", () => {
    const panel = read(
      "src/components/business-connect/mobile/card-scan/CardScanSessionExpired.tsx",
    );
    expect(panel).not.toMatch(/\.from\(/);
    expect(panel).not.toMatch(/supabaseAdmin|service_role/i);
  });

  it("session copy exists in BOTH vi and en", () => {
    const i18n = read("src/lib/i18n.ts");
    for (const key of [
      "bc.mobile.cardScan.session.expiredTitle",
      "bc.mobile.cardScan.session.expiredDesc",
      "bc.mobile.cardScan.session.recapture",
    ]) {
      expect(i18n).toContain(`"${key}"`);
    }
    expect(i18n).toContain("Phiên nhận diện đã hết hạn");
    expect(i18n).toContain("Recognition session expired");
  });
});
