// @vitest-environment jsdom
//
// BC-Mobile-5B — NFC Identity & physical tap-to-connect.
//
// Contract coverage:
//  - Real capability detection; no fake NFC success paths.
//  - NDEF payload is exactly one URI record: the opaque /c/<token> URL.
//    No PII, no ids, no vCard, no query/fragment on the tag.
//  - Deterministic write state machine (double-write impossible).
//  - Localized product error mapping; raw DOMExceptions never render.
//  - Rotation/privacy invariants: ONE identity, ONE projection, NFC is only
//    a transport into the existing /c/:token resolver.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LangContext, translations } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";

import { detectNfcCapability } from "@/lib/nfc/capability";
import { buildIdentityNdefRecords, isValidIdentityShareUrl } from "@/lib/nfc/ndef";
import { NfcWriteError, toNfcErrorKind } from "@/lib/nfc/errors";
import { createWebNfcWriter, type NfcWriterAdapter } from "@/lib/nfc/writer";
import { isNfcWriteActive, nfcWriteInitialState, nfcWriteReducer } from "@/lib/nfc/write-machine";
import { toPublicIdentityCard } from "@/lib/business-connect/mobile/identity.projection";
import { buildIdentityVCard } from "@/lib/business-connect/mobile/identity.vcard";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

// QrCanvas touches canvas APIs jsdom lacks; IdentityQrSheet imports it.
vi.mock("@/components/member/QrCanvas", () => ({
  QrCanvas: ({ value }: { value: string }) => <div data-testid="qr-canvas" data-value={value} />,
}));

import { NfcSheet } from "@/components/business-connect/mobile/me/NfcSheet";
import {
  IdentityQrSheet,
  identityShareUrl,
} from "@/components/business-connect/mobile/me/IdentityQrSheet";

const TOKEN = "abcdef0123456789".repeat(4);
const ROTATED_TOKEN = "0123456789abcdef".repeat(4);
const PII = ["Trần Minh Anh", "anh@test.example", "+84901234567", "owner-1", "id-1"];

const shareLink = {
  token: TOKEN,
  status: "active" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  rotatedAt: null,
  lastUsedAt: null,
};

function renderWithLang(ui: React.ReactElement) {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{ui}</LangContext.Provider>,
  );
}

function makeAdapter(over: Partial<NfcWriterAdapter> = {}): NfcWriterAdapter {
  return {
    getCapability: () => "SUPPORTED_WRITE",
    writeIdentityUrl: vi.fn(async () => {}),
    ...over,
  };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeWindow(props: Record<string, unknown>): Window {
  return {
    isSecureContext: true,
    location: { hostname: "app.example" },
    ...props,
  } as unknown as Window;
}

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

beforeEach(() => cleanup);
afterEach(() => {
  delete (window as unknown as Record<string, unknown>).NDEFReader;
});

describe("capability detection", () => {
  it("01 reports SUPPORTED_WRITE only with a real NDEF write API", () => {
    class Full {
      write() {}
    }
    class ReadOnly {}
    expect(
      detectNfcCapability(fakeWindow({ NDEFReader: Full, location: { hostname: "localhost" } })),
    ).toBe("SUPPORTED_WRITE");
    expect(detectNfcCapability(fakeWindow({ NDEFReader: ReadOnly }))).toBe("READ_ONLY_OR_EXTERNAL");
    expect(detectNfcCapability(fakeWindow({}))).toBe("UNSUPPORTED");
  });

  it("02 reports UNSUPPORTED outside secure contexts (except localhost dev)", () => {
    class Full {
      write() {}
    }
    expect(detectNfcCapability(fakeWindow({ NDEFReader: Full, isSecureContext: false }))).toBe(
      "UNSUPPORTED",
    );
    expect(
      detectNfcCapability(
        fakeWindow({
          NDEFReader: Full,
          isSecureContext: false,
          location: { hostname: "localhost" },
        }),
      ),
    ).toBe("SUPPORTED_WRITE");
  });
});

describe("NDEF payload & URL validation", () => {
  const url = "https://app.example/c/" + TOKEN;

  it("03 writes exactly one URI record containing the /c/<token> URL", () => {
    const records = buildIdentityNdefRecords(url);
    expect(records).toEqual([{ recordType: "url", data: url }]);
  });

  it("04 payload contains no PII, ids, vCard or JSON profile", () => {
    const serialized = JSON.stringify(buildIdentityNdefRecords(url));
    for (const pii of PII) expect(serialized).not.toContain(pii);
    expect(serialized).not.toContain("BEGIN:VCARD");
    expect(serialized).not.toContain("business_identity");
  });

  it("05 rejects non-Business-Connect URLs, query strings and fragments", () => {
    expect(isValidIdentityShareUrl("https://evil.example/c/" + TOKEN, "https://app.example")).toBe(
      false,
    );
    expect(isValidIdentityShareUrl("https://app.example/x/" + TOKEN)).toBe(false);
    expect(isValidIdentityShareUrl(url + "?name=Anh")).toBe(false);
    expect(isValidIdentityShareUrl(url + "#email")).toBe(false);
    expect(isValidIdentityShareUrl("http://app.example/c/" + TOKEN)).toBe(false); // https only
    expect(isValidIdentityShareUrl("https://user:pw@app.example/c/" + TOKEN)).toBe(false);
    expect(isValidIdentityShareUrl(url, "https://app.example")).toBe(true);
  });

  it("06 rejects malformed tokens in the URL path", () => {
    expect(isValidIdentityShareUrl("https://app.example/c/" + "A".repeat(64))).toBe(false);
    expect(isValidIdentityShareUrl("https://app.example/c/" + "a".repeat(63))).toBe(false);
    expect(isValidIdentityShareUrl("https://app.example/c/" + "g".repeat(64))).toBe(false);
    expect(isValidIdentityShareUrl("https://app.example/c/" + TOKEN + "/extra")).toBe(false);
    expect(() => buildIdentityNdefRecords("https://app.example/c/bad")).toThrow();
  });

  it("07 writer refuses invalid URLs before touching NFC hardware", async () => {
    let constructions = 0;
    (window as unknown as Record<string, unknown>).NDEFReader = class {
      constructor() {
        constructions++;
      }
      async write() {}
    };
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    const writer = createWebNfcWriter(window.location.origin);
    await expect(writer.writeIdentityUrl("https://evil.example/c/" + TOKEN)).rejects.toMatchObject({
      kind: "LINK_NOT_CONFIRMED",
    });
    expect(constructions).toBe(0);
  });

  it("08 end-to-end adapter writes exactly the validated share URL", async () => {
    const writes: unknown[] = [];
    (window as unknown as Record<string, unknown>).NDEFReader = class {
      async write(message: unknown) {
        writes.push(message);
      }
    };
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    const writer = createWebNfcWriter(window.location.origin);
    const shareUrl = identityShareUrl(TOKEN);
    await writer.writeIdentityUrl(shareUrl);
    expect(writes).toEqual([{ records: [{ recordType: "url", data: shareUrl }] }]);
  });
});

describe("write state machine", () => {
  it("09 ignores START_WRITE unless READY with write support (double-write guard)", () => {
    let s = nfcWriteInitialState;
    expect(nfcWriteReducer(s, { type: "START_WRITE" })).toEqual(s);
    s = nfcWriteReducer(s, { type: "CHECK" });
    s = nfcWriteReducer(s, { type: "CAPABILITY", capability: "READ_ONLY_OR_EXTERNAL" });
    expect(nfcWriteReducer(s, { type: "START_WRITE" })).toEqual(s); // read-only: no write
    s = nfcWriteReducer(
      { status: "CAPABILITY_CHECKING" },
      { type: "CAPABILITY", capability: "SUPPORTED_WRITE" },
    );
    const waiting = nfcWriteReducer(s, { type: "START_WRITE" });
    expect(waiting.status).toBe("WAITING_FOR_TAG");
    expect(nfcWriteReducer(waiting, { type: "START_WRITE" })).toEqual(waiting); // no double write
    const writing = nfcWriteReducer(waiting, { type: "TAG_WRITE_STARTED" });
    expect(nfcWriteReducer(writing, { type: "START_WRITE" })).toEqual(writing);
  });

  it("10 WRITE_OK / WRITE_FAIL / CANCEL only apply while an operation is active", () => {
    const ready = nfcWriteReducer(nfcWriteReducer(nfcWriteInitialState, { type: "CHECK" }), {
      type: "CAPABILITY",
      capability: "SUPPORTED_WRITE",
    });
    expect(nfcWriteReducer(ready, { type: "WRITE_OK" })).toEqual(ready);
    expect(nfcWriteReducer(ready, { type: "WRITE_FAIL", kind: "WRITE_FAILED" })).toEqual(ready);
    expect(nfcWriteReducer(ready, { type: "CANCEL" })).toEqual(ready);
    const active = nfcWriteReducer(ready, { type: "START_WRITE" });
    expect(isNfcWriteActive(active)).toBe(true);
    expect(nfcWriteReducer(active, { type: "WRITE_OK" }).status).toBe("SUCCESS");
    expect(nfcWriteReducer(active, { type: "WRITE_FAIL", kind: "NO_TAG" })).toEqual({
      status: "ERROR",
      kind: "NO_TAG",
    });
    expect(nfcWriteReducer(active, { type: "CANCEL" }).status).toBe("CANCELLED");
  });
});

describe("NFC sheet — supported write path", () => {
  it("11 runs the full flow to a real success state", async () => {
    const adapter = makeAdapter();
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(screen.getAllByText("NFC Card Ready").length).toBeGreaterThan(0));
    expect(adapter.writeIdentityUrl).toHaveBeenCalledTimes(1);
    expect((adapter.writeIdentityUrl as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
      identityShareUrl(TOKEN),
    );
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /test card/i })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("NFC Card Ready");
  });

  it("12 prevents duplicate writes while an operation is active", async () => {
    const gate = deferred<void>();
    const adapter = makeAdapter({ writeIdentityUrl: vi.fn(() => gate.promise) });
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    // CTA is replaced by Cancel while active — a second write cannot start.
    expect(screen.queryByRole("button", { name: /write to nfc card/i })).toBeNull();
    expect(adapter.writeIdentityUrl).toHaveBeenCalledTimes(1);
    gate.resolve();
    await waitFor(() => expect(screen.getAllByText("NFC Card Ready").length).toBeGreaterThan(0));
    expect(adapter.writeIdentityUrl).toHaveBeenCalledTimes(1);
  });

  it("13 cancellation aborts and lands in the cancelled state", async () => {
    const adapter = makeAdapter({ writeIdentityUrl: vi.fn(() => new Promise<void>(() => {})) });
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    expect(screen.getByRole("status").textContent).toMatch(/writing/i);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("NFC writing cancelled."),
    );
  });

  it("14 Test Card explains a real tap — no fake tap detection", async () => {
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={makeAdapter()} />);
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(screen.getAllByText("NFC Card Ready").length).toBeGreaterThan(0));
    expect(screen.queryByText(/move the card away/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /test card/i }));
    expect(screen.getByText(/move the card away/i)).toBeTruthy();
  });
});

describe("NFC sheet — unsupported fallback", () => {
  it("15 shows Copy NFC Link fallback when writing is unsupported", () => {
    const adapter = makeAdapter({ getCapability: () => "UNSUPPORTED" });
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={adapter} />);
    expect(
      screen.getAllByText("NFC writing isn't available in this browser.").length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /copy nfc link/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /write to nfc card/i })).toBeNull();
  });

  it("16 read-only-capable browsers get the external-writer fallback", () => {
    const adapter = makeAdapter({ getCapability: () => "READ_ONLY_OR_EXTERNAL" });
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={adapter} />);
    expect(screen.queryByRole("button", { name: /write to nfc card/i })).toBeNull();
    expect(screen.getByRole("button", { name: /copy nfc link/i })).toBeTruthy();
  });
});

describe("NFC sheet — error mapping", () => {
  function rejectingAdapter(error: unknown): NfcWriterAdapter {
    return makeAdapter({
      writeIdentityUrl: vi.fn(async () => {
        throw error;
      }),
    });
  }

  it("17 maps permission denied to a localized product message", async () => {
    renderWithLang(
      <NfcSheet
        shareLink={shareLink}
        onClose={() => {}}
        adapter={rejectingAdapter(Object.assign(new Error("denied"), { name: "NotAllowedError" }))}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("NFC permission was not granted."),
    );
  });

  it("18 maps no-tag timeouts", async () => {
    renderWithLang(
      <NfcSheet
        shareLink={shareLink}
        onClose={() => {}}
        adapter={rejectingAdapter(Object.assign(new Error("io"), { name: "NotReadableError" }))}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("couldn't detect an NFC card"),
    );
  });

  it("19 maps read-only tags", async () => {
    renderWithLang(
      <NfcSheet
        shareLink={shareLink}
        onClose={() => {}}
        adapter={rejectingAdapter(
          Object.assign(new Error("tag is read-only"), { name: "NotSupportedError" }),
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("This NFC card cannot be rewritten."),
    );
  });

  it("20 maps generic write failures with a retry path", async () => {
    renderWithLang(
      <NfcSheet
        shareLink={shareLink}
        onClose={() => {}}
        adapter={rejectingAdapter(new Error("boom"))}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "We couldn't write this card. Please try again.",
      ),
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("21 never exposes raw DOMException names or messages", async () => {
    renderWithLang(
      <NfcSheet
        shareLink={shareLink}
        onClose={() => {}}
        adapter={rejectingAdapter(
          Object.assign(new Error("NotAllowedError: UA policy zqx9 refused"), {
            name: "NotAllowedError",
          }),
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(document.body.textContent).not.toContain("NotAllowedError");
    expect(document.body.textContent).not.toContain("zqx9");
    expect(toNfcErrorKind(new NfcWriteError("READ_ONLY"))).toBe("READ_ONLY");
  });
});

describe("privacy, rotation & recipient invariants", () => {
  function identity(): BusinessIdentity {
    return {
      id: "id-1",
      ownerUserId: "owner-1",
      displayName: "Trần Minh Anh",
      headline: null,
      jobTitle: "Director",
      companyName: null,
      bio: null,
      avatarUrl: null,
      primaryEmail: "anh@test.example",
      primaryPhone: "+84901234567",
      website: null,
      linkedinUrl: null,
      address: "1 Test Street",
      city: null,
      countryCode: "VN",
      preferredLocale: "vi",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  }
  const hidden = {
    primary_email: "PRIVATE",
    primary_phone: "PRIVATE",
    address: "PRIVATE",
  } as const;

  it("22 privacy explanation is visible in the management view", () => {
    renderWithLang(<NfcSheet shareLink={shareLink} onClose={() => {}} adapter={makeAdapter()} />);
    expect(screen.getByText(/not stored on the NFC card/i)).toBeTruthy();
    expect(screen.getByText(/secure link to your public Digital Identity/i)).toBeTruthy();
  });

  it("23 rotation confirmation warns about NFC impact in VI and EN", () => {
    expect(translations["bc.mobile.me.resetLink.confirmBody"].en).toContain("NFC");
    expect(translations["bc.mobile.me.resetLink.confirmBody"].vi).toContain("NFC");
    renderWithLang(
      <IdentityQrSheet
        shareLink={shareLink}
        rotating={false}
        onRotate={() => {}}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reset sharing link/i }));
    expect(document.body.textContent).toContain("deactivate NFC cards or tags");
  });

  it("24 rotation revokes old tokens; NFC writes only the CURRENT link", async () => {
    // Server contract (source guard): rotation revokes active links and the
    // public resolver only accepts status='active' — an old NFC URL pointing
    // at a rotated token converges to the neutral unavailable state.
    const service = readSrc("../lib/business-connect/mobile/identity.service.ts");
    expect(service).toMatch(/\.update\(\{ status: "revoked"/);
    expect(service).toMatch(/\.eq\("status", "active"\)/);
    // Client contract: the writer programs the link prop it is given — after
    // rotation the sheet receives the NEW link and writes the NEW token only.
    const adapter = makeAdapter();
    renderWithLang(
      <NfcSheet
        shareLink={{ ...shareLink, token: ROTATED_TOKEN }}
        onClose={() => {}}
        adapter={adapter}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(adapter.writeIdentityUrl).toHaveBeenCalled());
    const writtenUrl = (adapter.writeIdentityUrl as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(writtenUrl).toContain(ROTATED_TOKEN);
    expect(writtenUrl).not.toContain(TOKEN);
  });

  it("25 NFC recipients resolve through the existing /c/:token public resolver", () => {
    const url = identityShareUrl(TOKEN);
    expect(new URL(url).pathname).toMatch(/^\/c\/[a-f0-9]{64}$/);
    const route = readSrc("../routes/c.$token.tsx");
    expect(route).toContain("bcIdentityPublicByTokenFn");
    expect(route).toContain("RecipientCardView");
    expect(route).not.toContain("nfc"); // zero NFC-specific recipient behavior
  });

  it("26 PRIVATE email stays null for any transport (incl. NFC)", () => {
    expect(toPublicIdentityCard(identity(), hidden).primaryEmail).toBeNull();
  });

  it("27 PRIVATE phone stays null for any transport (incl. NFC)", () => {
    expect(toPublicIdentityCard(identity(), hidden).primaryPhone).toBeNull();
  });

  it("28 PRIVATE address stays null for any transport (incl. NFC)", () => {
    expect(toPublicIdentityCard(identity(), hidden).address).toBeNull();
  });

  it("29 recipient surface never creates connections (source guard)", () => {
    const surfaces =
      readSrc("../routes/c.$token.tsx") +
      readSrc("../components/business-connect/mobile/me/RecipientCardView.tsx") +
      readSrc("../components/business-connect/mobile/me/DigitalBusinessCard.tsx");
    expect(surfaces).not.toMatch(/user_connections/);
    expect(surfaces).not.toMatch(/\.from\("connections"\)/);
    expect(surfaces).not.toMatch(/createConnection/i);
  });

  it("30 Save Contact vCard is built from the projection only", () => {
    const card = toPublicIdentityCard(identity(), hidden);
    const vcf = buildIdentityVCard(card, "https://app.example/c/" + TOKEN);
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).not.toContain("anh@test.example");
    expect(vcf).not.toContain("+84901234567");
  });

  it("31 axe: NFC sheet has no accessibility violations", async () => {
    const { container } = renderWithLang(
      <NfcSheet shareLink={shareLink} onClose={() => {}} adapter={makeAdapter()} />,
    );
    await expectNoAxeViolations(container);
  });

  it("32 VI/EN parity for every NFC i18n key", () => {
    const nfcKeys = Object.keys(translations).filter((k) => k.startsWith("bc.mobile.me.nfc."));
    expect(nfcKeys.length).toBeGreaterThanOrEqual(25);
    for (const key of nfcKeys) {
      const entry = translations[key as keyof typeof translations];
      expect(entry.vi.trim().length, `${key} vi`).toBeGreaterThan(0);
      expect(entry.en.trim().length, `${key} en`).toBeGreaterThan(0);
    }
  });
});
