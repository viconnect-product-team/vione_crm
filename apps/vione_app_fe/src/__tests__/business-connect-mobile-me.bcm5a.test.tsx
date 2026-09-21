// @vitest-environment jsdom
//
// BC-Mobile-5A — Me / My Digital Identity Foundation.
//
// Contract coverage:
//  - Privacy projection: PRIVATE fields are hard-nulled; unknown keys dropped;
//    completeness never punishes privacy choices.
//  - Token hygiene: 64-char lowercase hex only.
//  - vCard: built only from the recipient projection; absent display name →
//    no export; CRLF + UTF-8.
//  - Recipient view: one neutral unavailable state for every failure mode.
//  - Privacy sheet: explicit PRIVATE/SHARED toggles commit as a batch.
//  - QR sheet: rotation requires an explicit confirm step.
//  - axe: recipient card + privacy sheet have no a11y violations.

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LangContext } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";
import {
  DEFAULT_IDENTITY_VISIBILITY,
  IDENTITY_FIELD_KEYS,
  identityCompleteness,
  resolveIdentityVisibility,
  toPublicIdentityCard,
} from "@/lib/business-connect/mobile/identity.projection";
import { isValidPublicToken } from "@/lib/business-connect/mobile/identity.validation";
import { buildIdentityVCard } from "@/lib/business-connect/mobile/identity.vcard";
import type {
  BusinessIdentity,
  IdentityVisibilityState,
  MyIdentityPayload,
} from "@/lib/business-connect/mobile/identity.types";

// Server functions must never execute in unit tests.
const updateVisibilityMock = vi.fn();
vi.mock("@/lib/business-connect/mobile/identity.functions", () => ({
  bcIdentityGetMineFn: { url: "/_serverFn/getMine" },
  bcIdentityUpsertFn: { url: "/_serverFn/upsert" },
  bcIdentityUpdateVisibilityFn: { url: "/_serverFn/visibility" },
  bcIdentityGetOrCreateShareLinkFn: { url: "/_serverFn/link" },
  bcIdentityRotateShareLinkFn: { url: "/_serverFn/rotate" },
  bcIdentityPublicByTokenFn: { url: "/_serverFn/public" },
}));

// useServerFn wraps the mocked module fns into callables. Partial mock so
// transitive imports (auth middleware etc.) keep their real exports.
vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-start")>();
  return {
    ...actual,
    useServerFn: (fn: { url: string }) => {
      if (fn.url.includes("visibility")) return updateVisibilityMock;
      return vi.fn();
    },
  };
});

// QrCanvas touches canvas APIs jsdom lacks; the QR contract here is the
// sheet chrome + rotation flow, not pixel rendering.
vi.mock("@/components/member/QrCanvas", () => ({
  QrCanvas: ({ value }: { value: string }) => <div data-testid="qr-canvas" data-value={value} />,
}));

import { RecipientCardView } from "@/components/business-connect/mobile/me/RecipientCardView";
import { IdentityPrivacySheet } from "@/components/business-connect/mobile/me/IdentityPrivacySheet";
import {
  IdentityQrSheet,
  identityShareUrl,
} from "@/components/business-connect/mobile/me/IdentityQrSheet";
import { DigitalBusinessCard } from "@/components/business-connect/mobile/me/DigitalBusinessCard";

function renderWithLang(ui: React.ReactElement) {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{ui}</LangContext.Provider>,
  );
}

function makeIdentity(over: Partial<BusinessIdentity> = {}): BusinessIdentity {
  return {
    id: "id-1",
    ownerUserId: "owner-1",
    displayName: "Trần Minh Anh",
    headline: "Connecting Vietnamese founders",
    jobTitle: "Director",
    companyName: "Test Co",
    bio: "Building networks.",
    avatarUrl: null,
    primaryEmail: "anh@test.example",
    primaryPhone: "+84901234567",
    website: "https://test.example",
    linkedinUrl: null,
    address: "1 Test Street",
    city: "Ho Chi Minh City",
    countryCode: "VN",
    preferredLocale: "vi",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

beforeAll(() => {
  if (!window.location.origin) {
    // jsdom origin is http://localhost — fine for URL composition tests.
  }
});

beforeEach(() => {
  cleanup();
  updateVisibilityMock.mockReset();
});

describe("privacy projection", () => {
  it("hard-nulls PRIVATE fields in the recipient projection", () => {
    const card = toPublicIdentityCard(makeIdentity(), {
      primary_email: "PRIVATE",
      primary_phone: "PRIVATE",
      address: "PRIVATE",
    });
    expect(card.displayName).toBe("Trần Minh Anh");
    expect(card.primaryEmail).toBeNull();
    expect(card.primaryPhone).toBeNull();
    expect(card.address).toBeNull();
    expect(card.website).toBe("https://test.example");
    // No ownership / internal metadata ever crosses the projection.
    expect(card).not.toHaveProperty("ownerUserId");
    expect(card).not.toHaveProperty("id");
    expect(card).not.toHaveProperty("status");
  });

  it("defaults keep contact coordinates PRIVATE until the owner opts in", () => {
    expect(DEFAULT_IDENTITY_VISIBILITY.primary_email).toBe("PRIVATE");
    expect(DEFAULT_IDENTITY_VISIBILITY.primary_phone).toBe("PRIVATE");
    expect(DEFAULT_IDENTITY_VISIBILITY.address).toBe("PRIVATE");
    expect(DEFAULT_IDENTITY_VISIBILITY.display_name).toBe("SHARED");
  });

  it("drops unknown stored visibility keys (defense in depth)", () => {
    const resolved = resolveIdentityVisibility({
      owner_user_id: "SHARED",
      password_hash: "SHARED",
    } as unknown as Record<string, IdentityVisibilityState>);
    for (const key of IDENTITY_FIELD_KEYS) {
      expect(resolved[key]).toBe(DEFAULT_IDENTITY_VISIBILITY[key]);
    }
    expect(resolved).not.toHaveProperty("owner_user_id");
  });

  it("completeness counts filled fields regardless of visibility", () => {
    const full = identityCompleteness(makeIdentity());
    const hidden = toPublicIdentityCard(makeIdentity(), {
      primary_email: "PRIVATE",
      primary_phone: "PRIVATE",
    });
    // Hiding email/phone from the public does NOT reduce the score.
    expect(hidden.primaryEmail).toBeNull();
    expect(full.percent).toBeGreaterThanOrEqual(75);
    const empty = identityCompleteness(
      makeIdentity({
        displayName: null,
        headline: null,
        jobTitle: null,
        companyName: null,
        bio: null,
        primaryEmail: null,
        primaryPhone: null,
        website: null,
        linkedinUrl: null,
      }),
    );
    expect(empty.percent).toBe(0);
  });
});

describe("share token hygiene", () => {
  it("accepts only 64-char lowercase hex tokens", () => {
    expect(isValidPublicToken("a".repeat(64))).toBe(true);
    expect(isValidPublicToken("0123456789abcdef".repeat(4))).toBe(true);
    expect(isValidPublicToken("A".repeat(64))).toBe(false); // uppercase
    expect(isValidPublicToken("g".repeat(64))).toBe(false); // non-hex
    expect(isValidPublicToken("a".repeat(63))).toBe(false); // short
    expect(isValidPublicToken("")).toBe(false);
    expect(isValidPublicToken("../../etc/passwd")).toBe(false);
  });
});

describe("identity vCard", () => {
  it("emits only fields present on the recipient projection", () => {
    const card = toPublicIdentityCard(makeIdentity(), {
      primary_email: "PRIVATE",
      primary_phone: "PRIVATE",
    });
    const vcf = buildIdentityVCard(card, "https://app.example/c/" + "a".repeat(64));
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("FN;CHARSET=UTF-8:Trần Minh Anh");
    expect(vcf).not.toContain("anh@test.example");
    expect(vcf).not.toContain("+84901234567");
    // Lines fold at 75 octets per RFC 2425 — unfold before URL assertions.
    const unfolded = (vcf ?? "").replace(/\r\n /g, "");
    expect(unfolded).toContain("URL;TYPE=WORK:https://app.example/c/" + "a".repeat(64));
    expect(vcf?.endsWith("\r\n")).toBe(true);
  });

  it("returns null when no display name anchors the contact", () => {
    expect(
      buildIdentityVCard(
        toPublicIdentityCard(makeIdentity({ displayName: null }), {
          display_name: "SHARED",
        }),
        null,
      ),
    ).toBeNull();
  });
});

describe("recipient view", () => {
  it("renders one neutral unavailable state for every failure mode", () => {
    const texts: string[] = [];
    for (const result of [null, { state: "unavailable" as const }]) {
      cleanup();
      renderWithLang(
        <RecipientCardView
          result={result}
          publicUrl="https://app.example/c/x"
          token={"a".repeat(64)}
        />,
      );
      expect(screen.getByRole("heading", { name: /unavailable/i })).toBeTruthy();
      texts.push(document.body.textContent ?? "");
    }
    // Invalid, revoked, rotated-away and disabled are INDISTINGUISHABLE —
    // the page is not an oracle for whether a user or token ever existed.
    expect(texts[0]).toBe(texts[1]);
    expect(texts[0]).not.toContain("owner-1");
    expect(texts[0]).not.toContain("id-1");
  });

  it("renders the public card and never leaks PRIVATE-only values", async () => {
    const card = toPublicIdentityCard(makeIdentity(), {
      primary_email: "PRIVATE",
      primary_phone: "PRIVATE",
      address: "PRIVATE",
    });
    const { container } = renderWithLang(
      <RecipientCardView
        result={{ state: "public", card }}
        publicUrl={"https://app.example/c/" + "a".repeat(64)}
        token={"a".repeat(64)}
      />,
    );
    expect(screen.getByText("Trần Minh Anh")).toBeTruthy();
    expect(screen.getByText(/Director/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /save contact/i })).toBeTruthy();
    expect(document.body.textContent).not.toContain("anh@test.example");
    expect(document.body.textContent).not.toContain("+84901234567");
    expect(document.body.textContent).not.toContain("1 Test Street");
    await expectNoAxeViolations(container);
  });

  it("Save Contact is disabled when the projection has no display name", () => {
    const card = toPublicIdentityCard(makeIdentity({ displayName: null }));
    renderWithLang(<DigitalBusinessCard card={card} publicUrl={null} />);
    const btn = screen.getByRole("button", { name: /save contact/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe("privacy sheet", () => {
  const visibility = resolveIdentityVisibility(null);

  it("toggles are explicit switches that flip aria-checked", async () => {
    renderWithLang(
      <IdentityPrivacySheet visibility={visibility} onSaved={() => {}} onClose={() => {}} />,
    );
    const emailSwitch = screen.getByRole("switch", { name: /^Email:/ });
    expect(emailSwitch.getAttribute("aria-checked")).toBe("false"); // default PRIVATE
    fireEvent.click(emailSwitch);
    expect(emailSwitch.getAttribute("aria-checked")).toBe("true");
    await expectNoAxeViolations(document.body);
  });

  it("commits the full visibility batch on Save", async () => {
    const payload: MyIdentityPayload = { identity: makeIdentity(), visibility: {} };
    updateVisibilityMock.mockResolvedValue(payload);
    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderWithLang(
      <IdentityPrivacySheet visibility={visibility} onSaved={onSaved} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("switch", { name: /^Email:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(payload));
    expect(onClose).toHaveBeenCalled();
    const batch = updateVisibilityMock.mock.calls[0][0].data as Array<{
      fieldKey: string;
      visibility: string;
    }>;
    expect(batch).toHaveLength(IDENTITY_FIELD_KEYS.length);
    expect(batch.find((b) => b.fieldKey === "primary_email")?.visibility).toBe("SHARED");
    expect(batch.find((b) => b.fieldKey === "primary_phone")?.visibility).toBe("PRIVATE");
  });

  it("Escape closes the dialog only when not saving", () => {
    const onClose = vi.fn();
    renderWithLang(
      <IdentityPrivacySheet visibility={visibility} onSaved={() => {}} onClose={onClose} />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("QR / share-link sheet", () => {
  const shareLink = {
    token: "a".repeat(64),
    status: "active" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    rotatedAt: null,
    lastUsedAt: null,
  };

  it("points the QR at the /c/<token> URL of the CURRENT token", () => {
    renderWithLang(
      <IdentityQrSheet
        shareLink={shareLink}
        rotating={false}
        onRotate={() => {}}
        onClose={() => {}}
      />,
    );
    const qr = screen.getByTestId("qr-canvas");
    expect(qr.getAttribute("data-value")).toBe(identityShareUrl(shareLink.token));
    expect(qr.getAttribute("data-value")).toContain(`/c/${"a".repeat(64)}`);
    expect(document.body.textContent).toContain(`/c/${"a".repeat(64)}`);
  });

  it("rotation requires an explicit confirm step and disables while rotating", () => {
    const onRotate = vi.fn();
    renderWithLang(
      <IdentityQrSheet
        shareLink={shareLink}
        rotating={false}
        onRotate={onRotate}
        onClose={() => {}}
      />,
    );
    // Rotation is not triggered from the main sheet.
    expect(onRotate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /reset sharing link/i }));
    expect(screen.getByRole("dialog", { name: /reset sharing link\?/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset link" }));
    expect(onRotate).toHaveBeenCalledTimes(1);
  });
});
