// BC-Mobile-3A — Public Digital Card security-boundary tests.
//
// Verifies: whitelist DTO gating (hidden sections never cross the wire),
// slug contract, server-side vCard generation (RFC 2425 escaping/folding,
// URL/phone/email sanitization), and the public-endpoint rate limiter.

import { describe, expect, it, beforeEach } from "vitest";
import {
  isValidPublicSlug,
  toPublicBusinessCard,
  type PublicBusinessCard,
} from "@/lib/business-card/public-card";
import {
  buildVCard,
  escapeVCardValue,
  foldVCardLine,
  safeVCardEmail,
  safeVCardHttpUrl,
  safeVCardPhone,
  vcfFilenameForSlug,
} from "@/lib/business-card/vcard";
import { allowPublicRequest, resetPublicRateLimits } from "@/lib/public-rate-limit";
import type { BusinessCard } from "@/lib/business-card/business-card.types";

function makeCard(overrides: Partial<BusinessCard> = {}): BusinessCard {
  return {
    id: "card-uuid-secret",
    ownerUserId: "owner-uuid-secret",
    slug: "minh-nguyen",
    cardKind: "primary",
    status: "published",
    publicMode: "public",
    allowContactExchange: true,
    visibilitySettings: {
      mode: "public",
      showContact: true,
      showSocial: true,
      showServices: true,
      showNeeds: true,
    },
    displayName: "Minh Nguyễn",
    professionalTitle: "Giám đốc phát triển",
    companyName: "ViOne",
    companyLogoUrl: "https://cdn.example.com/logo.png",
    avatarUrl: "https://cdn.example.com/avatar.png",
    coverUrl: null,
    headline: "Kết nối tạo giá trị",
    bio: "Dòng đầu\nDòng hai",
    displayNameEn: null,
    professionalTitleEn: null,
    companyNameEn: null,
    headlineEn: null,
    bioEn: null,
    website: "https://vione.example.com",
    workEmail: "minh@vione.example.com",
    workPhone: "+84 912 345 678",
    zaloUrl: "https://zalo.me/0912345678",
    linkedinUrl: "https://linkedin.com/in/minh",
    facebookUrl: null,
    youtubeUrl: null,
    tiktokUrl: null,
    address: "Quận 1, TP.HCM",
    mapUrl: "https://maps.example.com/x",
    themeId: "navy-gold",
    customBrandColor: null,
    qrOptions: { background: "white", logoScale: 0.22, logoOffsetX: 0, logoOffsetY: 0 },
    publishedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
    skills: [{ label: "Chiến lược" }],
    services: [{ title: "Tư vấn", description: "Mô tả", category: null }],
    needs: [{ title: "Đối tác", description: null, category: null }],
    ...overrides,
  };
}

describe("BC-Mobile-3A · toPublicBusinessCard whitelist", () => {
  it("strips every internal/denylist field", () => {
    const dto = toPublicBusinessCard(makeCard());
    const keys = Object.keys(dto);
    for (const forbidden of [
      "id",
      "ownerUserId",
      "cardKind",
      "status",
      "publicMode",
      "visibilitySettings",
      "qrOptions",
      "publishedAt",
      "updatedAt",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    expect(JSON.stringify(dto)).not.toContain("secret");
  });

  it("nulls contact + social fields when the owner hides those sections", () => {
    const dto = toPublicBusinessCard(
      makeCard({
        visibilitySettings: {
          mode: "public",
          showContact: false,
          showSocial: false,
          showServices: true,
          showNeeds: true,
        },
      }),
    );
    expect(dto.website).toBeNull();
    expect(dto.workEmail).toBeNull();
    expect(dto.workPhone).toBeNull();
    expect(dto.address).toBeNull();
    expect(dto.mapUrl).toBeNull();
    expect(dto.zaloUrl).toBeNull();
    expect(dto.linkedinUrl).toBeNull();
    // Non-gated identity fields stay visible.
    expect(dto.displayName).toBe("Minh Nguyễn");
  });

  it("empties services/needs lists when gated, keeps skills", () => {
    const dto = toPublicBusinessCard(
      makeCard({
        visibilitySettings: {
          mode: "public",
          showContact: true,
          showSocial: true,
          showServices: false,
          showNeeds: false,
        },
      }),
    );
    expect(dto.services).toEqual([]);
    expect(dto.needs).toEqual([]);
    expect(dto.skills).toEqual([{ label: "Chiến lược" }]);
  });
});

describe("BC-Mobile-3A · slug contract", () => {
  it.each(["minh", "minh-nguyen-1", "a".repeat(60)])("accepts %s", (s) => {
    expect(isValidPublicSlug(s)).toBe(true);
  });
  it.each(["", "A", "-minh", "minh_nguyen", "minh nguyen", "../etc", "minh.vcf", "a".repeat(61)])(
    "rejects %s",
    (s) => {
      expect(isValidPublicSlug(s)).toBe(false);
    },
  );
});

describe("BC-Mobile-3A · vCard generation", () => {
  const dto: PublicBusinessCard = toPublicBusinessCard(makeCard());
  const vcf = buildVCard(dto, "https://qlhh.lovable.app");

  it("produces a vCard 3.0 envelope with CRLF", () => {
    expect(vcf.startsWith("BEGIN:VCARD\r\n")).toBe(true);
    expect(vcf).toContain("VERSION:3.0");
    expect(vcf.trimEnd().endsWith("END:VCARD")).toBe(true);
    expect(vcf).not.toMatch(/(?<!\r)\n/);
  });

  it("carries the canonical public URL, never an internal id", () => {
    expect(vcf).toContain("URL;TYPE=WORK:https://qlhh.lovable.app/b/minh-nguyen");
    expect(vcf).not.toContain("card-uuid-secret");
    expect(vcf).not.toContain("owner-uuid-secret");
  });

  it("advertises provenance via SOURCE (canonical public URL only)", () => {
    const sourceLine = vcf.split("\r\n").find((l) => l.startsWith("SOURCE:"));
    expect(sourceLine).toBe("SOURCE:https://qlhh.lovable.app/b/minh-nguyen");
    expect(sourceLine).not.toContain("card-uuid-secret");
    expect(sourceLine).not.toContain("owner-uuid-secret");
  });

  it("keeps Vietnamese diacritics with explicit UTF-8 charset", () => {
    expect(vcf).toContain("FN;CHARSET=UTF-8:Minh Nguyễn");
    expect(vcf).toContain("N;CHARSET=UTF-8:Minh Nguyễn;;;;");
  });

  it("respects section gates (hidden contact = no TEL/EMAIL)", () => {
    const gated = buildVCard(
      toPublicBusinessCard(
        makeCard({
          visibilitySettings: {
            mode: "public",
            showContact: false,
            showSocial: false,
            showServices: true,
            showNeeds: true,
          },
        }),
      ),
      "https://qlhh.lovable.app",
    );
    expect(gated).not.toContain("TEL;");
    expect(gated).not.toContain("EMAIL;");
    expect(gated).not.toContain("vione.example.com");
    expect(gated).not.toContain("zalo.me");
  });

  it("emits PHOTO only for https avatars", () => {
    expect(vcf).toContain("PHOTO;VALUE=URI:https://cdn.example.com/avatar.png");
    const http = buildVCard(
      { ...dto, avatarUrl: "http://insecure.example.com/a.png" },
      "https://qlhh.lovable.app",
    );
    expect(http).not.toContain("PHOTO");
  });

  it("escapes vCard text values and strips control chars", () => {
    expect(escapeVCardValue("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
    expect(escapeVCardValue("ab")).toBe("ab");
  });

  it("folds long lines at ≤75 octets without splitting UTF-8 sequences", () => {
    const long = "NOTE:" + "ừ".repeat(60);
    const folded = foldVCardLine(long);
    const lines = folded.split("\r\n");
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((l) => l.startsWith(" "))).toBe(true);
    // Round-trip: unfolding restores the original text.
    expect(folded.replace(/\r\n /g, "")).toBe(long);
  });
});

describe("BC-Mobile-3A · vCard sanitizers", () => {
  it("rejects non-http(s) and credential-bearing URLs", () => {
    expect(safeVCardHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeVCardHttpUrl("data:text/html,x")).toBeNull();
    expect(safeVCardHttpUrl("file:///etc/passwd")).toBeNull();
    expect(safeVCardHttpUrl("https://user:pass@evil.example.com")).toBeNull();
    expect(safeVCardHttpUrl("not a url")).toBeNull();
    expect(safeVCardHttpUrl("https://ok.example.com/x")).toBe("https://ok.example.com/x");
  });

  it("cleans phones to a strict allowlist", () => {
    expect(safeVCardPhone("+84 912 345 678")).toBe("+84 912 345 678");
    expect(safeVCardPhone("+84\nBEGIN:VCARD")).toBe("+84");
    expect(safeVCardPhone("ab")).toBeNull();
  });

  it("accepts single-recipient emails only", () => {
    expect(safeVCardEmail("minh@vione.example.com")).toBe("minh@vione.example.com");
    expect(safeVCardEmail("a@b.c\nBCC:evil@x.com")).toBeNull();
    expect(safeVCardEmail("nope")).toBeNull();
  });

  it("derives header-safe filenames", () => {
    expect(vcfFilenameForSlug("minh-nguyen")).toBe("minh-nguyen.vcf");
    expect(vcfFilenameForSlug('../../etc"evil')).toBe("danh-thiep.vcf");
  });
});

describe("BC-Mobile-3A · public endpoint rate limiter", () => {
  beforeEach(() => resetPublicRateLimits());

  it("allows up to the limit, then blocks", () => {
    for (let i = 0; i < 30; i++) {
      expect(allowPublicRequest("1.2.3.4", 30, 60_000)).toBe(true);
    }
    expect(allowPublicRequest("1.2.3.4", 30, 60_000)).toBe(false);
  });

  it("tracks buckets per key", () => {
    expect(allowPublicRequest("1.1.1.1", 1, 60_000)).toBe(true);
    expect(allowPublicRequest("1.1.1.1", 1, 60_000)).toBe(false);
    expect(allowPublicRequest("2.2.2.2", 1, 60_000)).toBe(true);
  });

  it("resets after the window", () => {
    expect(allowPublicRequest("k", 1, -1)).toBe(true); // already-expired window
    expect(allowPublicRequest("k", 1, 60_000)).toBe(true); // fresh bucket
  });
});
