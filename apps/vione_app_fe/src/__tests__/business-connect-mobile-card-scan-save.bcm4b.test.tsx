// @vitest-environment jsdom
// BC-Mobile-4B — Human Review + Duplicate Resolution + Save to Network.
//
// Guards the 4B contract: OCR proposes, the human confirms; fax never
// persists; one primary phone/email; client validation MIRRORS the server
// RPC; duplicate classification is exact-normalized-email/phone ONLY (name
// similarity can never create a match); the save RPC contract mapping is
// defensive; the flow saves confirmed values, resolves duplicates truthfully,
// and lands on Success with a Person deep link.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { readFileSync, existsSync } from "node:fs";
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

import {
  draftFromCandidate,
  validateScanReviewDraft,
  toScanSavePayload,
  normalizeScanWebsite,
  classifyScanDuplicates,
  computeScanFieldResolutions,
  SCAN_REVIEW_MAX_PHONES,
  type ScanDuplicateHit,
  type ScanSavePayload,
} from "@/lib/business-connect/mobile/card-scan.review";
import { mapResolveResponse } from "@/lib/business-connect/mobile/card-scan-save.functions";
import { buildCandidateFromModel } from "@/lib/business-connect/mobile/card-scan.extract";
import type {
  BusinessCardCandidate,
  OcrModelOutput,
} from "@/lib/business-connect/mobile/card-scan.types";
import { resetPublicRateLimits } from "@/lib/public-rate-limit";
import { reportCardScanMetric } from "@/lib/business-connect/mobile/card-scan.telemetry";

// ── Module-boundary mocks (flow tests) ───────────────────────────────────────

const scanFnMock = vi.fn();
vi.mock("@/lib/business-connect/mobile/card-scan.functions", () => ({
  bcMobileCardScanFn: (...a: unknown[]) => scanFnMock(...a),
}));
const resolveFnMock = vi.fn(
  async (..._a: unknown[]): Promise<unknown> => ({
    state: "none",
    candidates: [],
  }),
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
// Owner-scoped guest read used by the field-resolution step (§7). Mocked at
// the module boundary — flow tests control the returned stored contact.
const guestContactGetMineMock = vi.fn(async (..._a: unknown[]): Promise<unknown> => null);
vi.mock("@/lib/business-card/guest-contact.sdk", () => ({
  GuestContactSDK: {
    getMine: (...a: unknown[]) => guestContactGetMineMock(...a),
    listMine: vi.fn(async () => []),
  },
}));

import { CardScanFlow } from "@/components/business-connect/mobile/card-scan/CardScanFlow";
import { CardScanDuplicateSheet } from "@/components/business-connect/mobile/card-scan/CardScanDuplicateSheet";
import { CardScanFieldResolutionSheet } from "@/components/business-connect/mobile/card-scan/CardScanFieldResolutionSheet";

const MIGRATION_4B = "supabase/migrations/20260809102507_71d1df05-014a-4787-9250-1f58e93d974a.sql";

function readWorkspaceFile(p: string): string {
  const candidates = [
    join(process.cwd(), p),
    join(process.cwd(), "../../", p),
    join(process.cwd(), "../", p),
    join(__dirname, "../../../", p),
    join(__dirname, "../../../../", p),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return readFileSync(c, "utf8");
  }
  return readFileSync(join(process.cwd(), p), "utf8");
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SCAN_ID = "0fd2f6d8-2c3d-4a1f-9c7e-1a2b3c4d5e6f";
const GUEST_UUID = "11111111-2222-3333-4444-555555555555";

const VI_CARD: OcrModelOutput = {
  isBusinessCard: true,
  unusableReason: null,
  lines: [
    { text: "NGUYỄN VĂN BÌNH", confidence: 0.97 },
    { text: "Tổng Giám đốc", confidence: 0.9 },
    { text: "CÔNG TY CỔ PHẦN ABC", confidence: 0.93 },
    { text: "Mobile: +84 912 345 678", confidence: 0.88 },
    { text: "Fax: +84 24 3777 8888", confidence: 0.8 },
    { text: "binh@abc-corp.vn", confidence: 0.96 },
    { text: "www.abc-corp.vn", confidence: 0.9 },
  ],
  displayNameLine: 0,
  titleLine: 1,
  companyNameLine: 2,
  addressLine: null,
  qrPresent: false,
};

function candidate(model: OcrModelOutput = VI_CARD): BusinessCardCandidate {
  const built = buildCandidateFromModel(model, SCAN_ID);
  if (!built.ok) throw new Error("expected candidate");
  return built.candidate;
}

beforeEach(() => {
  scanFnMock.mockReset();
  resolveFnMock.mockClear();
  saveFnMock.mockReset();
  guestContactGetMineMock.mockReset();
  guestContactGetMineMock.mockResolvedValue(null);
  resetPublicRateLimits();
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

// ── 1. Review draft ──────────────────────────────────────────────────────────

describe("BC-Mobile-4B — review draft", () => {
  it("pre-fills from the candidate and EXCLUDES fax (documented omission)", () => {
    const d = draftFromCandidate(candidate());
    expect(d.displayName).toBe("NGUYỄN VĂN BÌNH");
    expect(d.title).toBe("Tổng Giám đốc");
    expect(d.companyName).toBe("CÔNG TY CỔ PHẦN ABC");
    expect(d.phones).toHaveLength(1);
    expect(d.phones[0]).toEqual({ value: "+84912345678", label: "mobile" });
    expect(d.primaryPhone).toBe(0);
    expect(d.emails).toEqual(["binh@abc-corp.vn"]);
    expect(d.primaryEmail).toBe(0);
    expect(d.website).toBe("https://www.abc-corp.vn/");
    expect(JSON.stringify(d)).not.toMatch(/fax/i);
    expect(JSON.stringify(d)).not.toContain("3777");
  });

  it("caps multi-values and picks the mobile number as primary", () => {
    const many: OcrModelOutput = {
      ...VI_CARD,
      lines: [
        { text: "A B", confidence: 0.9 },
        { text: "+84 901 000 001", confidence: 0.9 },
        { text: "+84 902 000 002", confidence: 0.9 },
        { text: "+84 903 000 003", confidence: 0.9 },
        { text: "+84 904 000 004", confidence: 0.9 },
      ],
      displayNameLine: 0,
      titleLine: null,
      companyNameLine: null,
      addressLine: null,
    };
    const d = draftFromCandidate(candidate(many));
    expect(d.phones.length).toBeLessThanOrEqual(SCAN_REVIEW_MAX_PHONES);
  });

  it("handles a candidate with no phone/email (empty primary indexes)", () => {
    const d = draftFromCandidate(
      candidate({
        ...VI_CARD,
        lines: [{ text: "A B", confidence: 0.9 }],
        titleLine: null,
        companyNameLine: null,
      }),
    );
    expect(d.phones).toEqual([]);
    expect(d.primaryPhone).toBe(-1);
    expect(d.primaryEmail).toBe(-1);
  });
});

// ── 2. Validation mirrors the server RPC ─────────────────────────────────────

describe("BC-Mobile-4B — validation mirrors save_scanned_guest_contact", () => {
  it("accepts a valid draft (name + phone OR email)", () => {
    expect(validateScanReviewDraft(draftFromCandidate(candidate()))).toEqual({ ok: true });
    const onlyEmail = { ...draftFromCandidate(candidate()), phones: [], primaryPhone: -1 };
    expect(validateScanReviewDraft(onlyEmail)).toEqual({ ok: true });
  });

  it("requires a name", () => {
    const d = { ...draftFromCandidate(candidate()), displayName: "   " };
    const v = validateScanReviewDraft(d);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.name_required).toBe(true);
  });

  it("requires at least one contact method", () => {
    const d = {
      ...draftFromCandidate(candidate()),
      phones: [],
      primaryPhone: -1,
      emails: [],
      primaryEmail: -1,
    };
    const v = validateScanReviewDraft(d);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.contact_method_required).toBe(true);
  });

  it("flags invalid phone / email / website like the server normalizers", () => {
    const d = draftFromCandidate(candidate());
    const badPhone = {
      ...d,
      phones: [{ value: "123" }],
      primaryPhone: 0,
      emails: ["not-an-email"],
      website: "javascript:alert(1)",
    };
    const v = validateScanReviewDraft(badPhone);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.errors.invalid_phone).toBe(true);
      expect(v.errors.invalid_email).toBe(true);
      expect(v.errors.invalid_website).toBe(true);
    }
  });

  it("website normalization is http(s)-only with an https default", () => {
    expect(normalizeScanWebsite("abc-corp.vn")).toBe("https://abc-corp.vn/");
    expect(normalizeScanWebsite("https://abc-corp.vn/x")).toBe("https://abc-corp.vn/x");
    expect(normalizeScanWebsite("javascript:alert(1)")).toBeNull();
    expect(normalizeScanWebsite("data:text/html,x")).toBeNull();
    expect(normalizeScanWebsite("   ")).toBeNull();
  });

  it("toScanSavePayload projects ONLY the confirmed primary values", () => {
    const d = draftFromCandidate(candidate());
    const p = toScanSavePayload(d);
    expect(p).toEqual({
      displayName: "NGUYỄN VĂN BÌNH",
      phone: "+84912345678",
      email: "binh@abc-corp.vn",
      companyName: "CÔNG TY CỔ PHẦN ABC",
      title: "Tổng Giám đốc",
      website: "https://www.abc-corp.vn/",
      address: null,
    });
  });
});

// ── 3. Duplicate classification (exact normalized email/phone ONLY) ──────────

function hit(partial: Partial<ScanDuplicateHit> & { personId: string }): ScanDuplicateHit {
  return {
    kind: "guest",
    displayName: null,
    title: null,
    companyName: null,
    emailHit: false,
    phoneHit: false,
    ...partial,
  };
}

describe("BC-Mobile-4B — deterministic duplicate classification", () => {
  it("0 persons → none · 1 → exact · ≥2 → ambiguous", () => {
    expect(classifyScanDuplicates([])).toEqual({ state: "none", candidates: [] });
    const one = classifyScanDuplicates([hit({ personId: `g:${GUEST_UUID}`, emailHit: true })]);
    expect(one.state).toBe("exact");
    expect(one.candidates[0]?.reason).toBe("email");
    const two = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, emailHit: true }),
      hit({
        personId: "c:99999999-8888-7777-6666-555555555555",
        kind: "saved_card",
        phoneHit: true,
      }),
    ]);
    expect(two.state).toBe("ambiguous");
  });

  it("dedupes by person ref and merges phone+email into one candidate", () => {
    const r = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, emailHit: true }),
      hit({ personId: `g:${GUEST_UUID}`, phoneHit: true }),
    ]);
    expect(r.state).toBe("exact");
    expect(r.candidates).toHaveLength(1);
    expect(r.candidates[0]?.reason).toBe("phone_email");
  });

  it("name/company similarity is NOT an input — it can never create a match", () => {
    // No emailHit/phoneHit flags ⇒ no match, even with an identical name.
    const r = classifyScanDuplicates([]);
    expect(r.state).toBe("none");
    const source = readWorkspaceFile(MIGRATION_4B);
    expect(source).not.toMatch(/similarity|trgm|fuzzy/i);
  });

  it("mapResolveResponse is defensive: junk → none, valid → mapped", () => {
    expect(mapResolveResponse(null)).toEqual({ state: "none", candidates: [] });
    expect(mapResolveResponse({ state: "exact", candidates: [{ bad: true }] })).toEqual({
      state: "none",
      candidates: [],
    });
    const ok = mapResolveResponse({
      state: "exact",
      candidates: [
        {
          personId: `g:${GUEST_UUID}`,
          kind: "guest",
          displayName: "Binh",
          title: null,
          companyName: null,
          matchLevel: "exact",
          reason: "phone",
        },
      ],
    });
    expect(ok.state).toBe("exact");
    expect(ok.candidates[0]?.personId).toBe(`g:${GUEST_UUID}`);
    expect(ok.candidates[0]?.matchLevel).toBe("exact");
    // Rejects non-guest/u:/c: refs and unknown shapes.
    expect(
      mapResolveResponse({
        state: "exact",
        candidates: [{ personId: "garbage", kind: "guest", matchLevel: "exact", reason: "phone" }],
      }),
    ).toEqual({ state: "none", candidates: [] });
    // A missing/invalid matchLevel rejects the candidate (defensive).
    expect(
      mapResolveResponse({
        state: "ambiguous",
        candidates: [
          { personId: `g:${GUEST_UUID}`, kind: "guest", reason: "phone" },
          {
            personId: `g:${GUEST_UUID}`,
            kind: "guest",
            matchLevel: "definitely-a-duplicate",
            reason: "phone",
          },
        ],
      }),
    ).toEqual({ state: "ambiguous", candidates: [] });
  });

  it("tiered matching: strong = name+company/domain, possible = name-only/company-only", () => {
    const strong = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, nameHit: true, companyHit: true }),
    ]);
    expect(strong.candidates[0]?.matchLevel).toBe("strong");
    expect(strong.candidates[0]?.reason).toBe("name_company");

    const strongDomain = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, nameHit: true, domainHit: true }),
    ]);
    expect(strongDomain.candidates[0]?.matchLevel).toBe("strong");
    expect(strongDomain.candidates[0]?.reason).toBe("name_domain");

    const nameOnly = classifyScanDuplicates([hit({ personId: `g:${GUEST_UUID}`, nameHit: true })]);
    expect(nameOnly.candidates[0]?.matchLevel).toBe("possible");
    expect(nameOnly.candidates[0]?.reason).toBe("name");

    const companyOnly = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, companyHit: true }),
    ]);
    expect(companyOnly.candidates[0]?.matchLevel).toBe("possible");
    expect(companyOnly.candidates[0]?.reason).toBe("company");
  });

  it("weak tiers NEVER escalate: a lone possible/strong match is ambiguous, never exact", () => {
    // Only a single exact-tier candidate may produce the `exact` state.
    expect(
      classifyScanDuplicates([
        hit({ personId: `g:${GUEST_UUID}`, nameHit: true, companyHit: true }),
      ]).state,
    ).toBe("ambiguous");
    expect(
      classifyScanDuplicates([hit({ personId: `g:${GUEST_UUID}`, nameHit: true })]).state,
    ).toBe("ambiguous");
    // Exact tier dominates the sort.
    const mixed = classifyScanDuplicates([
      hit({ personId: `g:${GUEST_UUID}`, nameHit: true, displayName: "A" }),
      hit({
        personId: "c:99999999-8888-7777-6666-555555555555",
        kind: "saved_card",
        emailHit: true,
        displayName: "B",
      }),
    ]);
    expect(mixed.state).toBe("ambiguous");
    expect(mixed.candidates[0]?.matchLevel).toBe("exact");
    expect(mixed.candidates[1]?.matchLevel).toBe("possible");
  });
});

// ── 3B. Field-level merge model (§7 — no silent overwrite) ──────────────────

function payload(partial: Partial<ScanSavePayload>): ScanSavePayload {
  return {
    displayName: "",
    phone: null,
    email: null,
    companyName: null,
    title: null,
    website: null,
    address: null,
    ...partial,
  };
}

describe("BC-Mobile-4B — field-level merge model", () => {
  it("conflict: both populated and different → explicit human choice", () => {
    const r = computeScanFieldResolutions(
      payload({ phone: "+84912345678", email: "new@corp.vn" }),
      {
        displayName: "Binh",
        phone: "0901111222",
        email: "old@corp.vn",
        companyName: null,
        title: null,
        website: null,
        address: null,
      },
    );
    expect(r).toEqual([
      { key: "phone", status: "conflict", currentValue: "0901111222", cardValue: "+84912345678" },
      { key: "email", status: "conflict", currentValue: "old@corp.vn", cardValue: "new@corp.vn" },
    ]);
  });

  it("fill: empty canonical + card value → fill (auto, surfaced)", () => {
    const r = computeScanFieldResolutions(payload({ website: "https://corp.vn/" }), {
      displayName: "Binh",
      phone: "0901111222",
      email: null,
      companyName: null,
      title: null,
      website: null,
      address: null,
    });
    expect(r).toEqual([
      { key: "website", status: "fill", currentValue: "", cardValue: "https://corp.vn/" },
    ]);
  });

  it("normalized-equal values are a silent keep — never a conflict", () => {
    const r = computeScanFieldResolutions(
      payload({ displayName: "Nguyễn  Bình", phone: "+84 901 111 222" }),
      {
        displayName: "nguyễn bình",
        phone: "+84901111222",
        email: null,
        companyName: null,
        title: null,
        website: null,
        address: null,
      },
    );
    expect(r).toEqual([]);
  });

  it("card has nothing for a field → not listed", () => {
    const r = computeScanFieldResolutions(payload({}), {
      displayName: "Binh",
      phone: "0901111222",
      email: null,
      companyName: null,
      title: null,
      website: null,
      address: null,
    });
    expect(r).toEqual([]);
  });
});

// ── 4. Contract guards (static) ──────────────────────────────────────────────

describe("BC-Mobile-4B — contract guards", () => {
  const read = (p: string) => readWorkspaceFile(p);

  it("review + duplicate sheet NEVER write to the DB or graph directly", () => {
    for (const f of [
      "src/lib/business-connect/mobile/card-scan.review.ts",
      "src/components/business-connect/mobile/card-scan/BusinessCardReviewForm.tsx",
      "src/components/business-connect/mobile/card-scan/CardScanDuplicateSheet.tsx",
      "src/components/business-connect/mobile/card-scan/CardScanSaveSuccess.tsx",
    ]) {
      const s = read(f);
      expect(s).not.toMatch(/\.from\(/);
      expect(s).not.toMatch(/supabaseAdmin|service_role/i);
    }
  });

  it("the save flow NEVER auto-merges: update requires an explicit human target", () => {
    const flow = read("src/components/business-connect/mobile/card-scan/CardScanFlow.tsx");
    // doSave("update", …) is only reachable from the sheet's explicit button.
    expect(flow).not.toMatch(/doSave\("update",\s*null\)/);
    const sql = read(MIGRATION_4B);
    expect(sql).toContain("match_conflict");
    expect(sql).toContain("target_required");
    expect(sql).toContain("contact_method_required");
  });

  it("telemetry accepts privacy-safe review/save codes and rejects others", () => {
    for (const code of [
      "OCR_REVIEW_OPENED",
      "OCR_REVIEW_SAVED_NEW",
      "OCR_REVIEW_MATCHED_EXISTING",
      "OCR_REVIEW_AMBIGUOUS",
      "OCR_REVIEW_CANCELLED",
    ]) {
      expect(() => reportCardScanMetric(code as never)).not.toThrow();
    }
    // Non-allowlisted codes are silently dropped (never reported).
    expect(() => reportCardScanMetric("BOGUS_CODE" as never)).not.toThrow();
  });
});

// ── 5. Flow: save happy path + duplicate decision + success ──────────────────

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
  const person = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/network/$personId",
    component: () => <div>person</div>,
  });
  const scan = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/card-scan",
    component: CardScanFlow,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([home, network, person, scan]),
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
  await screen.findByDisplayValue("NGUYỄN VĂN BÌNH");
  return rendered;
}

describe("BC-Mobile-4B — save flow", () => {
  it("validates before saving: empty name blocks with a truthful alert", async () => {
    await reachReview();
    fireEvent.change(screen.getByDisplayValue("NGUYỄN VĂN BÌNH"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(saveFnMock).not.toHaveBeenCalled();
  });

  it("saves confirmed draft values and lands on Success with a Person link", async () => {
    saveFnMock.mockResolvedValue({
      ok: true,
      result: "created",
      personId: `g:${GUEST_UUID}`,
      displayName: "NGUYỄN VĂN BÌNH",
      title: "Tổng Giám đốc",
      companyName: "CÔNG TY CỔ PHẦN ABC",
    });
    const { container } = await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));

    await screen.findByRole("heading", { name: /saved to your network/i });
    const call = saveFnMock.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.resolution).toBe("new");
    expect(call.data.scanId).toBe(SCAN_ID);
    expect(call.data.displayName).toBe("NGUYỄN VĂN BÌNH");
    expect(call.data.phone).toBe("+84912345678");
    expect(call.data.email).toBe("binh@abc-corp.vn");
    // NO fax, NO card image, NO OCR internals in the save payload.
    expect(JSON.stringify(call.data)).not.toMatch(/3777|fax|dataUrl|image/i);
    expect(typeof call.data.clientToken).toBe("string");

    const viewLink = screen.getByRole("link", { name: /view contact/i });
    expect(viewLink.getAttribute("href")).toContain(`/connect-app/network/`);
    expect(decodeURIComponent(viewLink.getAttribute("href") ?? "")).toContain(`g:${GUEST_UUID}`);
    await waitFor(() => expect(document.activeElement?.textContent).toMatch(/saved/i));
    expect(container).toBeTruthy();
  });

  it("retry reuses the SAME client token (idempotent logical save)", async () => {
    saveFnMock.mockResolvedValueOnce({ ok: false, code: "failed" }).mockResolvedValueOnce({
      ok: true,
      result: "replay",
      personId: `g:${GUEST_UUID}`,
      displayName: "NGUYỄN VĂN BÌNH",
      title: null,
      companyName: null,
    });
    await reachReview();
    const saveBtn = await screen.findByRole("button", { name: /save to network/i });
    fireEvent.click(saveBtn);
    await screen.findByText(/couldn't save/i);
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    await screen.findByRole("heading", { name: /saved to your network/i });
    const t1 = (saveFnMock.mock.calls[0]?.[0] as { data: { clientToken: string } }).data
      .clientToken;
    const t2 = (saveFnMock.mock.calls[1]?.[0] as { data: { clientToken: string } }).data
      .clientToken;
    expect(t1).toBe(t2);
  });

  it("exact duplicate → human decides; update sends the chosen g: target", async () => {
    resolveFnMock.mockResolvedValueOnce({
      state: "exact",
      candidates: [
        {
          personId: `g:${GUEST_UUID}`,
          kind: "guest",
          displayName: "Nguyễn Bình",
          title: null,
          companyName: "ABC",
          matchLevel: "exact",
          reason: "phone",
        },
      ],
    });
    // The stored guest matches the card on every populated field (same phone
    // digits) → no conflicts → the field-resolution step is skipped and the
    // save RPC runs directly.
    guestContactGetMineMock.mockResolvedValue({
      id: GUEST_UUID,
      displayName: "nguyễn văn bình",
      phone: "+84 912 345 678",
      email: "binh@abc-corp.vn",
      companyName: "CÔNG TY CỔ PHẦN ABC",
      title: "Tổng Giám đốc",
      website: "https://www.abc-corp.vn/",
      address: null,
    });
    saveFnMock.mockResolvedValue({
      ok: true,
      result: "updated",
      personId: `g:${GUEST_UUID}`,
      displayName: "NGUYỄN VĂN BÌNH",
      title: null,
      companyName: null,
    });
    await reachReview();
    await waitFor(() => expect(resolveFnMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toMatch(/possible duplicate/i);
    fireEvent.click(screen.getByRole("button", { name: /update this contact/i }));

    await screen.findByRole("heading", { name: /contact updated/i });
    const call = saveFnMock.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.resolution).toBe("update");
    expect(call.data.targetPersonId).toBe(`g:${GUEST_UUID}`);
  });

  it("match_conflict refreshes truthfully instead of saving blindly", async () => {
    saveFnMock.mockResolvedValue({ ok: false, code: "match_conflict" });
    await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    await screen.findByText(/couldn't confirm the duplicate/i);
    expect(saveFnMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(resolveFnMock).toHaveBeenCalledTimes(2));
  });
});

// ── 6. Duplicate sheet component ─────────────────────────────────────────────

describe("BC-Mobile-4B — duplicate sheet", () => {
  it("ambiguous: update stays disabled until the human picks a target", async () => {
    render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <CardScanDuplicateSheet
          resolution={{
            state: "ambiguous",
            candidates: [
              {
                personId: `g:${GUEST_UUID}`,
                kind: "guest",
                displayName: "Binh A",
                title: null,
                companyName: null,
                matchLevel: "exact",
                reason: "phone",
              },
              {
                personId: "c:99999999-8888-7777-6666-555555555555",
                kind: "saved_card",
                displayName: "Binh B",
                title: "CEO",
                companyName: "ABC",
                matchLevel: "exact",
                reason: "email",
              },
            ],
          }}
          selectedTargetId={null}
          busy={false}
          onSelectTarget={() => {}}
          onUpdateExisting={() => {}}
          onKeepNew={() => {}}
          onEditFirst={() => {}}
        />
      </LangContext.Provider>,
    );
    const update = screen.getByRole("button", { name: /update this contact/i });
    expect(update.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/saved card/i)).toBeTruthy();
  });

  it("is axe-clean (light)", async () => {
    const { container } = render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <CardScanDuplicateSheet
          resolution={{
            state: "exact",
            candidates: [
              {
                personId: `g:${GUEST_UUID}`,
                kind: "guest",
                displayName: "Binh",
                title: null,
                companyName: null,
                matchLevel: "exact",
                reason: "phone_email",
              },
            ],
          }}
          selectedTargetId={`g:${GUEST_UUID}`}
          busy={false}
          onSelectTarget={() => {}}
          onUpdateExisting={() => {}}
          onKeepNew={() => {}}
          onEditFirst={() => {}}
        />
      </LangContext.Provider>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("possible-tier matches hide behind a toggle and are NEVER selectable", async () => {
    render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <CardScanDuplicateSheet
          resolution={{
            state: "ambiguous",
            candidates: [
              {
                personId: `g:${GUEST_UUID}`,
                kind: "guest",
                displayName: "Binh A",
                title: null,
                companyName: null,
                matchLevel: "exact",
                reason: "phone",
              },
              {
                personId: "g:22222222-3333-4444-5555-666666666666",
                kind: "guest",
                displayName: "Binh Weak",
                title: null,
                companyName: null,
                matchLevel: "possible",
                reason: "name",
              },
            ],
          }}
          selectedTargetId={null}
          busy={false}
          onSelectTarget={() => {}}
          onUpdateExisting={() => {}}
          onKeepNew={() => {}}
          onEditFirst={() => {}}
        />
      </LangContext.Provider>,
    );
    // Weak match is not shown until disclosed.
    expect(screen.queryByText("Binh Weak")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /show 1 possible match/i }));
    expect(screen.getByText("Binh Weak")).toBeTruthy();
    // Possible-tier rows are informational — no radio, no selection.
    expect(screen.getAllByTestId("dup-row")).toHaveLength(2);
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    // Only exact/strong guest rows are selectable.
    expect(screen.getByRole("radio").textContent).toMatch(/Binh A/);
  });
});

// ── 7. Field-resolution sheet component (§7) ────────────────────────────────

describe("BC-Mobile-4B — field-resolution sheet", () => {
  const resolutions = [
    {
      key: "phone" as const,
      status: "conflict" as const,
      currentValue: "0901111222",
      cardValue: "+84912345678",
    },
    {
      key: "website" as const,
      status: "fill" as const,
      currentValue: "",
      cardValue: "https://corp.vn/",
    },
  ];

  it("conflicts default to keep-current; choosing card value is explicit", () => {
    const onChoice = vi.fn();
    render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <CardScanFieldResolutionSheet
          targetName="Nguyễn Bình"
          resolutions={resolutions}
          choices={{}}
          busy={false}
          onChoice={onChoice}
          onConfirm={() => {}}
          onBack={() => {}}
        />
      </LangContext.Provider>,
    );
    // Both choices render for the conflict; current is preselected.
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[0]?.textContent).toMatch(/keep current/i);
    expect(radios[1]?.textContent).toMatch(/use card value/i);
    // The fill is surfaced read-only (auto-applied).
    expect(screen.getByText(/will be added from the card/i)).toBeTruthy();
    expect(screen.getByText(/https:\/\/corp\.vn\//)).toBeTruthy();
    // Human picks the card value explicitly.
    fireEvent.click(radios[1] as HTMLElement);
    expect(onChoice).toHaveBeenCalledWith("phone", "card");
  });

  it("is axe-clean (light)", async () => {
    const { container } = render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <CardScanFieldResolutionSheet
          targetName="Nguyễn Bình"
          resolutions={resolutions}
          choices={{ phone: "card" }}
          busy={false}
          onChoice={() => {}}
          onConfirm={() => {}}
          onBack={() => {}}
        />
      </LangContext.Provider>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

// ── 8. Flow: conflicting update → field sheet → explicit choices ─────────────

describe("BC-Mobile-4B — update with field conflicts", () => {
  it("conflicting phone requires a human choice; 'card' choice is sent to the save RPC", async () => {
    resolveFnMock.mockResolvedValueOnce({
      state: "exact",
      candidates: [
        {
          personId: `g:${GUEST_UUID}`,
          kind: "guest",
          displayName: "Nguyễn Bình",
          title: null,
          companyName: "ABC",
          matchLevel: "exact",
          reason: "email",
        },
      ],
    });
    // Stored phone DIFFERS from the card phone → conflict, never a silent
    // overwrite: the field sheet must gate the save.
    guestContactGetMineMock.mockResolvedValue({
      id: GUEST_UUID,
      displayName: "NGUYỄN VĂN BÌNH",
      phone: "0901111222",
      email: "binh@abc-corp.vn",
      companyName: null,
      title: null,
      website: null,
      address: null,
    });
    saveFnMock.mockResolvedValue({
      ok: true,
      result: "updated",
      personId: `g:${GUEST_UUID}`,
      displayName: "NGUYỄN VĂN BÌNH",
      title: null,
      companyName: null,
    });
    await reachReview();
    await waitFor(() => expect(resolveFnMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    fireEvent.click(await screen.findByRole("button", { name: /update this contact/i }));

    // Field sheet opens instead of saving immediately.
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(saveFnMock).not.toHaveBeenCalled();
    expect(screen.getByText("0901111222")).toBeTruthy();
    // The card value renders both in the field-comparison list and in the
    // "use card value" radio option — assert presence, not uniqueness.
    expect(screen.getAllByText("+84912345678").length).toBeGreaterThan(0);

    // Human picks the card value, then confirms.
    fireEvent.click(screen.getByRole("radio", { name: /use card value/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm update/i }));

    await screen.findByRole("heading", { name: /contact updated/i });
    const call = saveFnMock.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.resolution).toBe("update");
    expect(call.data.targetPersonId).toBe(`g:${GUEST_UUID}`);
    expect(call.data.fieldChoices).toEqual({ phone: "card" });
  });

  it("'save as new contact' proves the human decision via confirmedNew", async () => {
    resolveFnMock.mockResolvedValueOnce({
      state: "exact",
      candidates: [
        {
          personId: `g:${GUEST_UUID}`,
          kind: "guest",
          displayName: "Nguyễn Bình",
          title: null,
          companyName: null,
          matchLevel: "exact",
          reason: "phone",
        },
      ],
    });
    saveFnMock.mockResolvedValue({
      ok: true,
      result: "created",
      personId: "g:33333333-4444-5555-6666-777777777777",
      displayName: "NGUYỄN VĂN BÌNH",
      title: null,
      companyName: null,
    });
    await reachReview();
    await waitFor(() => expect(resolveFnMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /save to network/i }));
    fireEvent.click(await screen.findByRole("button", { name: /save as new contact/i }));

    await screen.findByRole("heading", { name: /saved to your network/i });
    const call = saveFnMock.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.resolution).toBe("new");
    expect(call.data.confirmedNew).toBe(true);
  });
});
