// @vitest-environment jsdom
// vCard preview — what-you-see-is-what-you-export.
//
// Contract under test:
// - parseVCardPreview parses the ACTUAL generated .vcf (unfolding, unescaping,
//   structured ADR), so the field list can never drift from the file bytes.
// - Envelope properties and the machine-only N fallback never appear as rows.
// - The preview sheet lists every exported field with bilingual labels, shows
//   the raw file, and only exports on explicit confirm (Escape/backdrop close
//   cancel without any export).

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { LangContext } from "@/lib/i18n";
import {
  parseVCardPreview,
  unfoldVCardLines,
  unescapeVCardValue,
} from "@/lib/business-connect/mobile/vcf-preview";
import { buildScanDraftVCard } from "@/lib/business-connect/mobile/card-scan.vcard";
import { buildPersonVCard } from "@/lib/business-connect/mobile/person-vcard";
import { buildCandidateFromModel } from "@/lib/business-connect/mobile/card-scan.extract";
import { draftFromCandidate } from "@/lib/business-connect/mobile/card-scan.review";
import type { OcrModelOutput } from "@/lib/business-connect/mobile/card-scan.types";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";
import { VcfPreviewSheet } from "@/components/business-connect/mobile/VcfPreviewSheet";

afterEach(cleanup);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SCAN_ID = "0fd2f6d8-2c3d-4a1f-9c7e-1a2b3c4d5e6f";
const MODEL: OcrModelOutput = {
  isBusinessCard: true,
  unusableReason: null,
  lines: [
    { text: "TRẦN MINH ANH", confidence: 0.95 },
    { text: "Giám đốc Kinh doanh", confidence: 0.9 },
    { text: "CÔNG TY TNHH ABC", confidence: 0.92 },
    { text: "Mobile: +84 909 111 222", confidence: 0.9 },
    { text: "anh.tran@example.vn", confidence: 0.94 },
    { text: "https://abc.example.vn", confidence: 0.85 },
  ],
  displayNameLine: 0,
  titleLine: 1,
  companyNameLine: 2,
  addressLine: null,
  qrPresent: false,
};

function scanVcf(
  overrides: Partial<ReturnType<typeof draftFromCandidate>> = {},
  origin?: string,
): string {
  const built = buildCandidateFromModel(MODEL, SCAN_ID);
  if (!built.ok) throw new Error("expected candidate");
  const vcf = buildScanDraftVCard({ ...draftFromCandidate(built.candidate), ...overrides }, origin);
  if (!vcf) throw new Error("expected vcf");
  return vcf;
}

function person(overrides: Partial<BcMobilePersonDetail> = {}): BcMobilePersonDetail {
  return {
    personId: "u:11111111-1111-4111-8111-111111111111",
    displayName: "Nguyễn Văn An",
    headline: "Giám đốc kinh doanh",
    companyName: "Công ty TNHH ABC",
    avatarUrl: null,
    primaryCardSlug: "an-nguyen",
    contact: {
      phone: "+84 912 345 678",
      phoneHref: "tel:+84912345678",
      email: "an@abc.vn",
      emailHref: "mailto:an@abc.vn",
      websiteHref: "https://abc.vn/",
      social: [],
    },
    relationship: { kind: "connected", connectedAt: null, requestedByViewer: null },
    ...overrides,
  } as BcMobilePersonDetail;
}

// ── 1. Unescape / unfold primitives ─────────────────────────────────────────

describe("vcf-preview — primitives", () => {
  it("unescapes separators in a single pass without re-triggering", () => {
    expect(unescapeVCardValue("Anh\\; Trần\\, Sr.")).toBe("Anh; Trần, Sr.");
    expect(unescapeVCardValue("A\\\\B")).toBe("A\\B");
    expect(unescapeVCardValue("dòng 1\\ndòng 2")).toBe("dòng 1 dòng 2");
    expect(unescapeVCardValue("plain")).toBe("plain");
  });

  it("unfolds RFC 2425 continuation lines", () => {
    expect(unfoldVCardLines("FN:abc\r\n def\r\nTEL:123\r\n")).toEqual(["FN:abcdef", "TEL:123"]);
    expect(unfoldVCardLines("FN:abc\n\txyz\n")).toEqual(["FN:abcxyz"]);
  });
});

// ── 2. Parser: rows match the file ───────────────────────────────────────────

describe("vcf-preview — parseVCardPreview", () => {
  it("maps a scan-draft vCard to labeled rows in file order", () => {
    const rows = parseVCardPreview(scanVcf({ address: "12 Lê Lợi, Quận 1" }));
    expect(rows).toEqual([
      { field: "name", value: "TRẦN MINH ANH" },
      { field: "company", value: "CÔNG TY TNHH ABC" },
      { field: "title", value: "Giám đốc Kinh doanh" },
      { field: "phone", value: "+84909111222" },
      { field: "email", value: "anh.tran@example.vn" },
      { field: "website", value: "https://abc.example.vn/" },
      { field: "address", value: "12 Lê Lợi, Quận 1" },
    ]);
  });

  it("skips envelope properties and the machine-only N fallback", () => {
    const fields = parseVCardPreview(scanVcf()).map((r: any) => r.field);
    expect(fields).not.toContain("N" as never);
    expect(fields.filter((f) => f === "name")).toHaveLength(1);
    expect(scanVcf()).toContain("N;CHARSET=UTF-8");
  });

  it("unescapes values exactly as the reader will see them", () => {
    const rows = parseVCardPreview(
      scanVcf({ displayName: "Anh; Trần, Sr.", address: "12 Lê Lợi; Quận 1" }),
    );
    expect(rows.find((r) => r.field === "name")?.value).toBe("Anh; Trần, Sr.");
    expect(rows.find((r) => r.field === "address")?.value).toBe("12 Lê Lợi; Quận 1");
  });

  it("joins folded long values back into one row", () => {
    const longName = `Nguyễn ${"Văn ".repeat(30)}An`;
    const vcf = scanVcf({ displayName: longName });
    expect(vcf).toContain("\r\n "); // folding actually happened
    expect(parseVCardPreview(vcf).find((r) => r.field === "name")?.value).toBe(longName);
  });

  it("labels the owner's digital card URL distinctly from websites", () => {
    const vcf = buildPersonVCard(person(), "https://app.example.com");
    if (!vcf) throw new Error("expected vcf");
    const rows = parseVCardPreview(vcf);
    expect(rows.find((r) => r.field === "cardUrl")?.value).toBe(
      "https://app.example.com/b/an-nguyen",
    );
    expect(rows.find((r) => r.field === "website")?.value).toBe("https://abc.vn/");
    expect(rows.find((r) => r.field === "phone")?.value).toBe("+84 912 345 678");
  });

  it("omits rows for fields the generator omitted", () => {
    const vcf = buildPersonVCard(
      person({ headline: null, companyName: null, contact: null, primaryCardSlug: null }),
      "https://app.example.com",
    );
    if (!vcf) throw new Error("expected vcf");
    // Provenance is still exported (platform origin), so it appears as a row.
    expect(parseVCardPreview(vcf)).toEqual([
      { field: "name", value: "Nguyễn Văn An" },
      { field: "source", value: "https://app.example.com/" },
    ]);
  });

  it("surfaces provenance (SOURCE) as a labeled row, last in file order", () => {
    const scanRows = parseVCardPreview(scanVcf({}, "https://scan.example.com"));
    expect(scanRows[scanRows.length - 1]).toEqual({
      field: "source",
      value: "https://scan.example.com/",
    });

    const personVcf = buildPersonVCard(person(), "https://app.example.com");
    if (!personVcf) throw new Error("expected vcf");
    const personRows = parseVCardPreview(personVcf);
    expect(personRows[personRows.length - 1]).toEqual({
      field: "source",
      value: "https://app.example.com/b/an-nguyen",
    });
  });
});

// ── 3. Sheet: human check before export ──────────────────────────────────────

function renderSheet(
  overrides: Partial<Parameters<typeof VcfPreviewSheet>[0]> = {},
  lang: "vi" | "en" = "en",
) {
  const props = {
    vcf: scanVcf({ address: "12 Lê Lợi, Quận 1" }),
    filename: "tran-minh-anh.vcf",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(
    <LangContext.Provider value={{ lang, setLang: () => {} }}>
      <VcfPreviewSheet {...props} />
    </LangContext.Provider>,
  );
  return props;
}

describe("vcf-preview — sheet", () => {
  it("lists every exported field with labels, filename, and raw content", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("tran-minh-anh.vcf");
    for (const label of [
      "Full name",
      "Company",
      "Job title",
      "Phone",
      "Email",
      "Website",
      "Address",
    ]) {
      expect(dialog.textContent).toContain(label);
    }
    expect(dialog.textContent).toContain("TRẦN MINH ANH");
    expect(dialog.textContent).toContain("+84909111222");
    // Raw file is present for full transparency.
    expect(dialog.textContent).toContain("BEGIN:VCARD");
    expect(dialog.textContent).toContain("END:VCARD");
  });

  it("renders bilingual labels (vi)", () => {
    renderSheet({}, "vi");
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Họ tên");
    expect(dialog.textContent).toContain("Chức danh");
    expect(dialog.textContent).toContain("Địa chỉ");
  });

  it("shows the provenance row with a bilingual label", () => {
    renderSheet({ vcf: scanVcf({}, "https://scan.example.com") });
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Source");
    expect(dialog.textContent).toContain("https://scan.example.com/");

    cleanup();
    renderSheet({ vcf: scanVcf({}, "https://scan.example.com") }, "vi");
    expect(screen.getByRole("dialog").textContent).toContain("Nguồn tạo");
  });

  it("exports only on explicit confirm; close and Escape cancel", () => {
    const { onConfirm, onClose } = renderSheet();
    const dialog = screen.getByRole("dialog");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /share \/ download/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("moves focus to the confirm action on open", () => {
    renderSheet();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /share \/ download/i }));
  });

  it("confirming state: loading label, disabled actions, inert Escape, aria-busy", () => {
    const { onConfirm, onClose } = renderSheet({ confirming: true });

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-busy")).toBe("true");

    // Confirm action is disabled and shows the loading label (bilingual).
    const confirmBtn = within(dialog).getByRole("button", { name: /preparing contact…/i });
    expect(confirmBtn).toHaveProperty("disabled", true);
    fireEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();

    // Close button + backdrop + Escape are all inert while delivering.
    const closeBtn = within(dialog).getByRole("button", { name: /^close$/i });
    expect(closeBtn).toHaveProperty("disabled", true);
    fireEvent.click(closeBtn);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    // Vietnamese loading label.
    cleanup();
    renderSheet({ confirming: true }, "vi");
    expect(screen.getByRole("button", { name: /đang tạo danh bạ…/i })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
