// @vitest-environment jsdom
// BC-Mobile — Instant .vcf export from the card-scan Review screen.
//
// Contract under test:
// - The exported vCard is built from the CURRENT review draft — every human
//   edit is included, exactly the values that would be saved. Primary
//   phone/email selection is honored; empty/unsafe fields are omitted.
// - Export works BEFORE saving (no save call, no network); it downloads a
//   .vcf with an ASCII-slugified filename.
// - The button is disabled while the draft has no name; after the
//   recognition session lapses the export path is closed with the review.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { useState, act } from "react";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
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
import { buildCandidateFromModel } from "@/lib/business-connect/mobile/card-scan.extract";
import { draftFromCandidate } from "@/lib/business-connect/mobile/card-scan.review";
import type {
  BusinessCardCandidate,
  OcrModelOutput,
} from "@/lib/business-connect/mobile/card-scan.types";
import {
  buildScanDraftVCard,
  shareScanDraftVCard,
} from "@/lib/business-connect/mobile/card-scan.vcard";
import { CARD_SCAN_REVIEW_SESSION_TTL_MS } from "@/lib/business-connect/mobile/card-scan.session";

// ── Module-boundary mocks (same pattern as the 4B/4C suites) ────────────────

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
// Spy on the shared share/download delivery so tests can assert the exact
// vcf payload + filename without jsdom Blob/URL/Share Sheet plumbing.
const triggerSpy = vi.fn();
/** Optional delivery override — set to a deferred promise to hold the export
    in its loading state mid-test. Reset in beforeEach. */
let shareImpl: (() => Promise<string>) | null = null;
vi.mock("@/lib/business-connect/mobile/person-vcard", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/business-connect/mobile/person-vcard")>();
  return {
    ...orig,
    triggerVcfDownload: (...a: unknown[]) => triggerSpy(...a),
    shareOrDownloadVcf: (...a: unknown[]) => {
      triggerSpy(...a);
      return shareImpl ? shareImpl() : Promise.resolve("downloaded");
    },
  };
});

import { CardScanFlow } from "@/components/business-connect/mobile/card-scan/CardScanFlow";
import { BusinessCardReviewForm } from "@/components/business-connect/mobile/card-scan/BusinessCardReviewForm";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const T0 = 1_800_000_000_000;
const SCAN_ID = "0fd2f6d8-2c3d-4a1f-9c7e-1a2b3c4d5e6f";

const MODEL: OcrModelOutput = {
  isBusinessCard: true,
  unusableReason: null,
  lines: [
    { text: "TRẦN MINH ANH", confidence: 0.95 },
    { text: "Giám đốc Kinh doanh", confidence: 0.9 },
    { text: "CÔNG TY TNHH ABC", confidence: 0.92 },
    { text: "Mobile: +84 909 111 222", confidence: 0.9 },
    { text: "Mobile: +84 918 333 444", confidence: 0.88 },
    { text: "anh.tran@example.vn", confidence: 0.94 },
    { text: "https://abc.example.vn", confidence: 0.85 },
  ],
  displayNameLine: 0,
  titleLine: 1,
  companyNameLine: 2,
  addressLine: null,
  qrPresent: false,
};

function candidate(model: OcrModelOutput = MODEL): BusinessCardCandidate {
  const built = buildCandidateFromModel(model, SCAN_ID);
  if (!built.ok) throw new Error("expected candidate");
  return built.candidate;
}

beforeEach(() => {
  scanFnMock.mockReset();
  resolveFnMock.mockClear();
  saveFnMock.mockReset();
  triggerSpy.mockReset();
  shareImpl = null;
  vi.spyOn(Date, "now").mockReturnValue(T0);
  vi.spyOn(console, "info").mockImplementation(() => {});
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── 1. Builder: the draft is the contract ────────────────────────────────────

describe("BC-Mobile — scan draft → vCard builder", () => {
  it("exports the confirmed draft values with primary phone/email selection", () => {
    const draft = draftFromCandidate(candidate());
    const vcf = buildScanDraftVCard(draft);
    expect(vcf).not.toBeNull();
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("VERSION:3.0");
    expect(vcf).toContain("FN;CHARSET=UTF-8:TRẦN MINH ANH");
    expect(vcf).toContain("N;CHARSET=UTF-8:TRẦN MINH ANH;;;;");
    expect(vcf).toContain("TITLE;CHARSET=UTF-8:Giám đốc Kinh doanh");
    expect(vcf).toContain("ORG;CHARSET=UTF-8:CÔNG TY TNHH ABC");
    // First phone is primary by default.
    expect(vcf).toContain("TEL;TYPE=CELL:+84909111222");
    expect(vcf).not.toContain("+84918333444");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET,WORK:anh.tran@example.vn");
    expect(vcf).toContain("URL;TYPE=WORK:https://abc.example.vn");
    expect(vcf).toContain("END:VCARD");
    expect(vcf!.endsWith("\r\n")).toBe(true);
    // No raw LF outside the CRLF line folding contract.
    expect(vcf!.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("adds safe provenance (SOURCE) from the origin — never the scan session id", () => {
    const draft = draftFromCandidate(candidate());
    const vcf = buildScanDraftVCard(draft, "https://app.example.com")!;
    expect(vcf).toContain("SOURCE:https://app.example.com/");
    expect(vcf).not.toContain(SCAN_ID);
    // Query/fragment/credentials never survive into provenance.
    const dirty = buildScanDraftVCard(draft, "https://app.example.com/x?token=secret#f")!;
    expect(dirty).toContain("SOURCE:https://app.example.com/");
    expect(dirty).not.toContain("token=secret");
    // No origin → provenance omitted rather than invented.
    expect(buildScanDraftVCard(draft)!).not.toContain("SOURCE");
  });

  it("honors human edits and a changed primary selection", () => {
    const draft = {
      ...draftFromCandidate(candidate()),
      displayName: "Trần Minh Anh (sửa)",
      primaryPhone: 1,
      companyName: "",
    };
    const vcf = buildScanDraftVCard(draft)!;
    expect(vcf).toContain("FN;CHARSET=UTF-8:Trần Minh Anh (sửa)");
    expect(vcf).toContain("TEL;TYPE=CELL:+84918333444");
    expect(vcf).not.toContain("+84909111222");
    // Cleared fields are omitted entirely.
    expect(vcf).not.toContain("ORG");
  });

  it("escapes separators and places free-form address in ADR", () => {
    const draft = {
      ...draftFromCandidate(candidate()),
      displayName: "Anh; Trần, Sr.",
      address: "12 Lê Lợi; Quận 1",
    };
    const vcf = buildScanDraftVCard(draft)!;
    expect(vcf).toContain("FN;CHARSET=UTF-8:Anh\\; Trần\\, Sr.");
    expect(vcf).toContain("ADR;TYPE=WORK;CHARSET=UTF-8:;;12 Lê Lợi\\; Quận 1;;;;");
  });

  it("returns null without a name; drops unsafe channels", () => {
    expect(
      buildScanDraftVCard({ ...draftFromCandidate(candidate()), displayName: "   " }),
    ).toBeNull();

    const draft = {
      ...draftFromCandidate(candidate()),
      phones: [{ value: "call me maybe" }],
      primaryPhone: 0,
      emails: ["not-an-email"],
      primaryEmail: 0,
      website: "javascript:alert(1)",
    };
    const vcf = buildScanDraftVCard(draft)!;
    expect(vcf).not.toContain("TEL");
    expect(vcf).not.toContain("EMAIL");
    expect(vcf).not.toContain("URL");
  });
});

// ── 2. Download trigger ──────────────────────────────────────────────────────

describe("BC-Mobile — scan draft vCard share/download", () => {
  it("delivers with an ASCII-slugified filename", async () => {
    const channel = await shareScanDraftVCard(draftFromCandidate(candidate()));
    expect(channel).toBe("downloaded");
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    const [vcf, filename] = triggerSpy.mock.calls[0] as [string, string];
    expect(filename).toBe("tran-minh-anh.vcf");
    expect(vcf).toContain("FN;CHARSET=UTF-8:TRẦN MINH ANH");
  });

  it("is a no-op when the draft has no name", async () => {
    const channel = await shareScanDraftVCard({
      ...draftFromCandidate(candidate()),
      displayName: " ",
    });
    expect(channel).toBeNull();
    expect(triggerSpy).not.toHaveBeenCalled();
  });
});

// ── 3. Review form: the button itself ────────────────────────────────────────

function renderForm(overrides: Partial<Parameters<typeof BusinessCardReviewForm>[0]> = {}) {
  const cand = candidate();
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
      <BusinessCardReviewForm
        candidate={cand}
        draft={draftFromCandidate(cand)}
        errors={{}}
        duplicateHint={false}
        saveErrorText={null}
        saving={false}
        onChange={() => {}}
        onContinue={() => {}}
        onCancel={() => {}}
        {...overrides}
      />
    </LangContext.Provider>,
  );
}

describe("BC-Mobile — review form export button", () => {
  it("renders and fires onExportVcf on click", () => {
    const onExportVcf = vi.fn();
    renderForm({ onExportVcf });
    fireEvent.click(screen.getByRole("button", { name: /share contact \(\.vcf\)/i }));
    expect(onExportVcf).toHaveBeenCalledTimes(1);
  });

  it("is disabled while saving or when the draft has no name", () => {
    const onExportVcf = vi.fn();
    renderForm({ onExportVcf, exportVcfDisabled: true });
    const btn = screen.getByRole("button", { name: /share contact \(\.vcf\)/i });
    expect(btn).toHaveProperty("disabled", true);
    fireEvent.click(btn);
    expect(onExportVcf).not.toHaveBeenCalled();
  });

  it("stays absent when no export handler is provided (other consumers unaffected)", () => {
    renderForm();
    expect(screen.queryByRole("button", { name: /share contact \(\.vcf\)/i })).toBeNull();
  });
});

// ── 3b. Inline live vCard preview (before the export button) ────────────────

describe("BC-Mobile — inline live vCard preview on review", () => {
  it("shows the parsed export content above the export button", () => {
    renderForm({ onExportVcf: () => {} });
    const preview = screen.getByTestId("vcf-inline-preview");
    // Name, company, title, phone and email from the draft are all visible
    // BEFORE the export button is pressed.
    expect(preview.textContent).toMatch(/TRẦN MINH ANH/);
    expect(preview.textContent).toMatch(/CÔNG TY TNHH ABC/);
    expect(preview.textContent).toMatch(/Giám đốc Kinh doanh/);
    expect(preview.textContent).toMatch(/\+84909111222/);
    expect(preview.textContent).toMatch(/anh\.tran@example\.vn/);
    // It sits immediately before the export action.
    const exportBtn = screen.getByRole("button", { name: /share contact \(\.vcf\)/i });
    expect(
      preview.compareDocumentPosition(exportBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("updates live as the human edits the draft", () => {
    function Harness() {
      const cand = candidate();
      const [draft, setDraft] = useState(() => draftFromCandidate(cand));
      return (
        <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
          <BusinessCardReviewForm
            candidate={cand}
            draft={draft}
            errors={{}}
            duplicateHint={false}
            saveErrorText={null}
            saving={false}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            onContinue={() => {}}
            onCancel={() => {}}
            onExportVcf={() => {}}
          />
        </LangContext.Provider>
      );
    }
    render(<Harness />);
    fireEvent.change(screen.getByDisplayValue("TRẦN MINH ANH"), {
      target: { value: "TRẦN MINH ANH (Sửa)" },
    });
    const preview = screen.getByTestId("vcf-inline-preview");
    expect(preview.textContent).toMatch(/TRẦN MINH ANH \(Sửa\)/);
    expect(preview.textContent).not.toMatch(/TRẦN MINH ANH"/);
  });

  it("disappears when the draft has no name or no export handler exists", () => {
    const cand = candidate();
    const draft = { ...draftFromCandidate(cand), displayName: "" };
    const { unmount } = render(
      <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <BusinessCardReviewForm
          candidate={cand}
          draft={draft}
          errors={{}}
          duplicateHint={false}
          saveErrorText={null}
          saving={false}
          onChange={() => {}}
          onContinue={() => {}}
          onCancel={() => {}}
          onExportVcf={() => {}}
          exportVcfDisabled
        />
      </LangContext.Provider>,
    );
    expect(screen.queryByTestId("vcf-inline-preview")).toBeNull();
    unmount();
    renderForm(); // no onExportVcf → no preview either
    expect(screen.queryByTestId("vcf-inline-preview")).toBeNull();
  });
});

// ── 4. Flow: share instantly, before saving ──────────────────────────────────

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
  const scan = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connect-app/card-scan",
    component: CardScanFlow,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([home, scan]),
    history: createMemoryHistory({ initialEntries: ["/connect-app/card-scan"] }),
  });
  render(<RouterProvider router={router as never} />);
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: /take photo|chụp ảnh/i })).not.toBeNull(),
  );
}

async function reachReview() {
  scanFnMock.mockResolvedValue({ ok: true, candidate: candidate() });
  await renderFlow();
  fireEvent.change(screen.getByLabelText(/choose card photo from library|chọn ảnh danh thiếp/i), {
    target: { files: [new File(["x".repeat(64)], "card.jpg", { type: "image/jpeg" })] },
  });
  fireEvent.click(await screen.findByRole("button", { name: /read card|nhận diện/i }));
  await screen.findByDisplayValue("TRẦN MINH ANH");
}

describe("BC-Mobile — instant .vcf export from review", () => {
  it("previews the edited draft, then exports on confirm; no save call is made", async () => {
    await reachReview();
    fireEvent.change(screen.getByDisplayValue("TRẦN MINH ANH"), {
      target: { value: "TRẦN MINH ANH (đã sửa)" },
    });
    fireEvent.click(screen.getByRole("button", { name: /share contact \(\.vcf\)/i }));

    // Preview sheet opens first — nothing is exported yet.
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("tran-minh-anh-da-sua.vcf");
    expect(dialog.textContent).toContain("TRẦN MINH ANH (đã sửa)");
    expect(dialog.textContent).toContain("+84909111222");
    expect(triggerSpy).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[bc-ocr] OCR_REVIEW_VCF_PREVIEW_OPENED"),
    );

    fireEvent.click(screen.getByRole("button", { name: /share \/ download/i }));
    await waitFor(() => expect(triggerSpy).toHaveBeenCalledTimes(1));
    const [vcf, filename] = triggerSpy.mock.calls[0] as [string, string];
    expect(vcf).toContain("FN;CHARSET=UTF-8:TRẦN MINH ANH (đã sửa)");
    expect(vcf).toContain("TEL;TYPE=CELL:+84909111222");
    expect(filename).toBe("tran-minh-anh-da-sua.vcf");
    // Success toast fires after the share/download resolves.
    expect(toast.success).toHaveBeenCalledWith("Contact downloaded (.vcf)");
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[bc-ocr] OCR_REVIEW_VCF_EXPORTED_DOWNLOADED"),
    );
    // Instant share never touches the network save path.
    expect(saveFnMock).not.toHaveBeenCalled();
  });

  it("closes the export path once the recognition session lapses", async () => {
    await reachReview();
    vi.spyOn(Date, "now").mockReturnValue(T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS + 1);
    fireEvent(document, new Event("visibilitychange"));

    // Review locks: expired panel replaces the form, export is gone.
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: /share contact \(\.vcf\)/i })).toBeNull();
    expect(triggerSpy).not.toHaveBeenCalled();
  });

  it("keeps the sheet open with a disabled loading confirm until delivery resolves", async () => {
    let resolveShare!: (v: string) => void;
    shareImpl = () => new Promise<string>((res) => (resolveShare = res));
    // Module-level toast mock: drop call history from earlier tests.
    (toast.success as unknown as { mockClear(): void }).mockClear();
    await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /share contact \(\.vcf\)/i }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: /share \/ download/i }));

    // While the Share Sheet is being generated/opened: loading label, the
    // confirm action is disabled, and the sheet stays open (aria-busy).
    const confirmingBtn = await screen.findByRole("button", { name: /preparing contact…/i });
    expect(confirmingBtn).toHaveProperty("disabled", true);
    expect(dialog.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(confirmingBtn);
    expect(triggerSpy).toHaveBeenCalledTimes(1); // no double delivery
    expect(toast.success).not.toHaveBeenCalled();

    // Delivery resolves → sheet closes, success toast fires once.
    resolveShare("downloaded");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(toast.success).toHaveBeenCalledWith("Contact downloaded (.vcf)");
  });

  it("offers a one-tap Retry on the failure toast that re-runs the same export", async () => {
    let attempts = 0;
    shareImpl = () => {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error("share sheet unavailable"))
        : Promise.resolve("shared");
    };
    (toast.error as unknown as { mockClear(): void }).mockClear();
    (toast.success as unknown as { mockClear(): void }).mockClear();
    await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /share contact \(\.vcf\)/i }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: /share \/ download/i }));

    // First attempt fails: the error toast carries a Retry action; sheet closed.
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [message, options] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, { action: { label: string; onClick: () => void } }];
    expect(message).toBe("Couldn't export the contact. Please try again.");
    expect(options.action.label).toBe("Retry");
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[bc-ocr] OCR_REVIEW_VCF_FAILED"),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(triggerSpy).toHaveBeenCalledTimes(1);

    // One tap on Retry re-opens the preview sheet and re-delivers the same file.
    await act(async () => {
      options.action.onClick();
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Contact shared (.vcf)"));
    expect(triggerSpy).toHaveBeenCalledTimes(2);
    const [firstVcf, firstName] = triggerSpy.mock.calls[0] as [string, string];
    const [retryVcf, retryName] = triggerSpy.mock.calls[1] as [string, string];
    expect(retryVcf).toBe(firstVcf);
    expect(retryName).toBe(firstName);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes the retry path once the recognition session lapses before the tap", async () => {
    shareImpl = () => Promise.reject(new Error("share sheet unavailable"));
    (toast.error as unknown as { mockClear(): void }).mockClear();
    await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /share contact \(\.vcf\)/i }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: /share \/ download/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [, options] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { action: { label: string; onClick: () => void } },
    ];

    // The session lapses between the failure and the retry tap.
    vi.spyOn(Date, "now").mockReturnValue(T0 + CARD_SCAN_REVIEW_SESSION_TTL_MS + 1);
    await act(async () => {
      options.action.onClick();
    });
    expect(triggerSpy).toHaveBeenCalledTimes(1); // no retry delivery
    await screen.findByRole("alert"); // expired panel replaces the review form
    expect(screen.queryByRole("button", { name: /share contact \(\.vcf\)/i })).toBeNull();
  });
});
