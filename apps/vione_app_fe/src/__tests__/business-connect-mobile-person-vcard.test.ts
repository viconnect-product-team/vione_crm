// Person Detail .vcf export — builds vCard 3.0 from the visibility-cleared
// person DTO only. Verifies escaping, sanitization parity with the
// server-side vCard generator, and privacy (no extra fields leak).

import { describe, expect, it } from "vitest";
import { buildPersonVCard, personVcfFilename } from "@/lib/business-connect/mobile/person-vcard";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";

function makePerson(overrides: Partial<BcMobilePersonDetail> = {}): BcMobilePersonDetail {
  return {
    personId: "g:11111111-1111-1111-1111-111111111111",
    kind: "guest_contact",
    displayName: "Nguyễn Văn An",
    avatarUrl: null,
    headline: "Giám đốc kinh doanh",
    companyName: "Công ty TNHH ABC",
    primaryCardSlug: null,
    relationship: { kind: "guest", sharedAt: "2026-08-01T10:00:00Z", source: "business_card_scan" },
    contact: {
      phone: "+84 912 345 678",
      phoneHref: "tel:+84 912 345 678",
      email: "an@abc.vn",
      emailHref: "mailto:an@abc.vn",
      websiteLabel: "abc.vn",
      websiteHref: "https://abc.vn/",
      social: [],
    },
    ...overrides,
  };
}

describe("buildPersonVCard", () => {
  it("emits a valid vCard 3.0 with name, org, title, tel, email, url", () => {
    const vcf = buildPersonVCard(makePerson())!;
    expect(vcf.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(vcf).toContain("FN;CHARSET=UTF-8:Nguyễn Văn An");
    expect(vcf).toContain("N;CHARSET=UTF-8:Nguyễn Văn An;;;;");
    expect(vcf).toContain("ORG;CHARSET=UTF-8:Công ty TNHH ABC");
    expect(vcf).toContain("TITLE;CHARSET=UTF-8:Giám đốc kinh doanh");
    expect(vcf).toContain("TEL;TYPE=CELL:+84 912 345 678");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET,WORK:an@abc.vn");
    expect(vcf).toContain("URL;TYPE=HOME:https://abc.vn/");
    expect(vcf.trimEnd().endsWith("END:VCARD")).toBe(true);
  });

  it("returns null when there is no display name", () => {
    expect(buildPersonVCard(makePerson({ displayName: null }))).toBeNull();
    expect(buildPersonVCard(makePerson({ displayName: "   " }))).toBeNull();
  });

  it("omits empty channels instead of emitting blank properties", () => {
    const vcf = buildPersonVCard(makePerson({ contact: null, companyName: null, headline: null }))!;
    expect(vcf).not.toContain("TEL");
    expect(vcf).not.toContain("EMAIL");
    expect(vcf).not.toContain("URL;TYPE=HOME");
    expect(vcf).not.toContain("ORG");
    expect(vcf).not.toContain("TITLE");
  });

  it("rejects non-http(s) website / avatar URLs", () => {
    const vcf = buildPersonVCard(
      makePerson({
        avatarUrl: "javascript:alert(1)",
        contact: {
          ...makePerson().contact!,
          websiteHref: null, // sanitizeHttpUrl already nulled it upstream
        },
      }),
    )!;
    expect(vcf).not.toContain("PHOTO");
    expect(vcf).not.toContain("URL;TYPE=HOME");
  });

  it("includes avatar only when it is an https URL", () => {
    const https = buildPersonVCard(makePerson({ avatarUrl: "https://cdn.example.com/a.png" }))!;
    expect(https).toContain("PHOTO;VALUE=URI:https://cdn.example.com/a.png");
    const http = buildPersonVCard(makePerson({ avatarUrl: "http://cdn.example.com/a.png" }))!;
    expect(http).not.toContain("PHOTO");
  });

  it("includes the canonical public card URL when a slug + origin exist", () => {
    const vcf = buildPersonVCard(
      makePerson({ kind: "connection", primaryCardSlug: "an-nguyen" }),
      "https://app.example.com",
    )!;
    expect(vcf).toContain("URL;TYPE=WORK:https://app.example.com/b/an-nguyen");
  });

  it("escapes vCard-reserved characters in text values", () => {
    const vcf = buildPersonVCard(
      makePerson({ displayName: "An; Kỳ, Lục", companyName: "A\\B; Co" }),
    )!;
    expect(vcf).toContain("FN;CHARSET=UTF-8:An\\; Kỳ\\, Lục");
    expect(vcf).toContain("ORG;CHARSET=UTF-8:A\\\\B\\; Co");
  });

  it("drops malformed phone/email instead of exporting them", () => {
    const vcf = buildPersonVCard(
      makePerson({
        contact: {
          ...makePerson().contact!,
          phone: "x", // too short after allowlist
          email: "not-an-email",
        },
      }),
    )!;
    expect(vcf).not.toContain("TEL");
    expect(vcf).not.toContain("EMAIL");
  });

  it("never leaks internal ids, notes, or source metadata", () => {
    const vcf = buildPersonVCard(makePerson())!;
    expect(vcf).not.toContain("11111111-1111");
    expect(vcf).not.toContain("business_card_scan");
    expect(vcf).not.toContain("NOTE");
    expect(vcf).not.toContain("X-");
  });

  it("folds long lines to ≤75 octets, UTF-8 aware", () => {
    const longName = "Nguyễn Thị Phương Anh " + "Trần Đức ".repeat(10);
    const vcf = buildPersonVCard(makePerson({ displayName: longName }))!;
    for (const line of vcf.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("vCard provenance (SOURCE)", () => {
  it("names the canonical public card URL when a slug exists", () => {
    const vcf = buildPersonVCard(
      makePerson({ kind: "connection", primaryCardSlug: "an-nguyen" }),
      "https://app.example.com",
    )!;
    const sourceLine = vcf.split("\r\n").find((l) => l.startsWith("SOURCE:"));
    expect(sourceLine).toBe("SOURCE:https://app.example.com/b/an-nguyen");
    expect(sourceLine).not.toContain("11111111-1111");
  });

  it("falls back to the platform origin when there is no public card", () => {
    const vcf = buildPersonVCard(makePerson(), "https://app.example.com")!;
    expect(vcf).toContain("SOURCE:https://app.example.com/");
  });

  it("omits SOURCE when no origin is available", () => {
    expect(buildPersonVCard(makePerson())!).not.toContain("SOURCE");
  });

  it("strips query and fragment; rejects credentialed origins outright", () => {
    const clean = buildPersonVCard(
      makePerson(),
      "https://app.example.com/anything?token=secret#frag",
    )!;
    expect(clean).toContain("SOURCE:https://app.example.com/");
    expect(clean).not.toContain("token=secret");
    expect(clean).not.toContain("frag");

    const credentialed = buildPersonVCard(
      makePerson(),
      "https://user:pass@app.example.com/?token=secret",
    )!;
    expect(credentialed).not.toContain("SOURCE");
  });
});

describe("personVcfFilename", () => {
  it("slugifies Vietnamese names to ascii", () => {
    expect(personVcfFilename("Nguyễn Văn An")).toBe("nguyen-van-an.vcf");
    expect(personVcfFilename("Đặng Thu Hà")).toBe("dang-thu-ha.vcf");
  });

  it("falls back when the name has no slugifiable characters", () => {
    expect(personVcfFilename(null)).toBe("lien-he.vcf");
    expect(personVcfFilename("!!!")).toBe("lien-he.vcf");
  });

  it("never produces header-breaking characters", () => {
    const f = personVcfFilename("a/b\\c:d\r\nContent-Disposition");
    expect(f).toMatch(/^[a-z0-9-]+\.vcf$/);
  });
});
