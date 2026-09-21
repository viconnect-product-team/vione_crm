// @vitest-environment jsdom
//
// BC-Mobile-5C — NFC tag registry tests.
//
// Covers:
//  - status derivation precedence (REVOKED > STALE > ACTIVE)
//  - service: owner-only register/revoke/list with honest error kinds
//  - list UI: status badges, timestamps, never leaks ids/tokens, axe-clean
//  - revoke is a two-step confirmation
//  - NfcSheet registers a tag ONLY after a confirmed write
//  - i18n keys exist (vi + en)

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { LangContext, hasTKey, translations, type TKey } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";

vi.mock("@/lib/business-connect/mobile/identity.telemetry", () => ({
  reportIdentityMetric: vi.fn(),
}));

import {
  deriveNfcTagStatus,
  listMyNfcTags,
  registerMyNfcTag,
  revokeMyNfcTag,
} from "@/lib/business-connect/mobile/nfc-tags.service";
import type { IdentityNfcTagInfo } from "@/lib/business-connect/mobile/nfc-tags.types";
import { NfcTagsList } from "@/components/business-connect/mobile/me/NfcTagsList";
import { NfcSheet } from "@/components/business-connect/mobile/me/NfcSheet";
import type { NfcWriterAdapter } from "@/lib/nfc/writer";
import type { IdentityShareLinkInfo } from "@/lib/business-connect/mobile/identity.types";

afterEach(cleanup);

function renderWithLang(ui: React.ReactElement) {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{ui}</LangContext.Provider>,
  );
}

// ---------------------------------------------------------------------------
// Mock Supabase client (chainable, awaitable like the PostgREST builder)
// ---------------------------------------------------------------------------

type Result = { data: unknown; error: { message: string } | null };

function makeChain(result: Result) {
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "insert", "update", "limit"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.then = (onFulfilled: (v: Result) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function makeDb(chains: Record<string, ReturnType<typeof makeChain>>) {
  return {
    from: vi.fn((table: string) => chains[table]),
  } as unknown as SupabaseClient<Database>;
}

const OWNER = "owner-user-id";
const SHARE_LINK_ID = "11111111-1111-4111-8111-111111111111";
const TAG_ID = "22222222-2222-4222-8222-222222222222";
const TOKEN = "a".repeat(64);
const WRITTEN = "2026-05-01T10:00:00.000Z";

function linkSlice(status: string, lastUsed: string | null = null) {
  return { status, last_used_at: lastUsed };
}

function tagInfo(overrides: Partial<IdentityNfcTagInfo> = {}): IdentityNfcTagInfo {
  return {
    id: TAG_ID,
    label: "Thẻ hội nghị",
    status: "ACTIVE",
    writtenAt: WRITTEN,
    lastTappedAt: "2026-05-02T08:00:00.000Z",
    updatedAt: WRITTEN,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Status derivation (pure)
// ---------------------------------------------------------------------------

describe("deriveNfcTagStatus", () => {
  it("1 is REVOKED when the registry row is revoked — precedence over link state", () => {
    expect(deriveNfcTagStatus("revoked", "active")).toBe("REVOKED");
    expect(deriveNfcTagStatus("revoked", "revoked")).toBe("REVOKED");
    expect(deriveNfcTagStatus("revoked", null)).toBe("REVOKED");
  });

  it("2 is STALE when the backing share link is no longer active", () => {
    expect(deriveNfcTagStatus("active", "revoked")).toBe("STALE");
    expect(deriveNfcTagStatus("active", null)).toBe("STALE");
  });

  it("3 is ACTIVE only when row and link are both active", () => {
    expect(deriveNfcTagStatus("active", "active")).toBe("ACTIVE");
  });
});

// ---------------------------------------------------------------------------
// Service — owner-only mutations + honest errors
// ---------------------------------------------------------------------------

describe("nfc tag service", () => {
  it("4 registerMyNfcTag throws share_link_not_found for an unknown/inactive token", async () => {
    const links = makeChain({ data: null, error: null });
    const db = makeDb({ identity_share_links: links });
    await expect(registerMyNfcTag(db, OWNER, { shareToken: TOKEN })).rejects.toThrow(
      "share_link_not_found",
    );
    expect(links.eq).toHaveBeenCalledWith("owner_user_id", OWNER);
    expect(links.eq).toHaveBeenCalledWith("status", "active");
  });

  it("5 registerMyNfcTag inserts the tag owned by the ACTOR, never client input", async () => {
    const links = makeChain({
      data: { id: SHARE_LINK_ID, identity_id: "ident-1", status: "active", last_used_at: null },
      error: null,
    });
    const tags = makeChain({
      data: {
        id: TAG_ID,
        label: "Thẻ hội nghị",
        status: "active",
        written_at: WRITTEN,
        updated_at: WRITTEN,
        identity_share_links: linkSlice("active"),
      },
      error: null,
    });
    const db = makeDb({ identity_share_links: links, identity_nfc_tags: tags });
    const result = await registerMyNfcTag(db, OWNER, { shareToken: TOKEN, label: "Thẻ hội nghị" });
    expect(tags.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: OWNER,
        identity_id: "ident-1",
        share_link_id: SHARE_LINK_ID,
      }),
    );
    expect(result.status).toBe("ACTIVE");
    expect(result.label).toBe("Thẻ hội nghị");
  });

  it("6 registerMyNfcTag surfaces insert failures instead of faking success", async () => {
    const links = makeChain({
      data: { id: SHARE_LINK_ID, identity_id: "ident-1", status: "active", last_used_at: null },
      error: null,
    });
    const tags = makeChain({ data: null, error: { message: "duplicate key value violates" } });
    const db = makeDb({ identity_share_links: links, identity_nfc_tags: tags });
    await expect(registerMyNfcTag(db, OWNER, { shareToken: TOKEN })).rejects.toThrow(
      /duplicate key/,
    );
  });

  it("7 revokeMyNfcTag throws tag_not_found when nothing matches owner + id", async () => {
    const tags = makeChain({ data: null, error: null });
    const db = makeDb({ identity_nfc_tags: tags });
    await expect(revokeMyNfcTag(db, OWNER, TAG_ID)).rejects.toThrow("tag_not_found");
    expect(tags.eq).toHaveBeenCalledWith("owner_user_id", OWNER);
  });

  it("8 revokeMyNfcTag marks the tag revoked and maps it as REVOKED", async () => {
    const tags = makeChain({
      data: {
        id: TAG_ID,
        label: null,
        status: "revoked",
        written_at: WRITTEN,
        updated_at: "2026-05-03T00:00:00Z",
        identity_share_links: linkSlice("active"),
      },
      error: null,
    });
    const db = makeDb({ identity_nfc_tags: tags });
    const result = await revokeMyNfcTag(db, OWNER, TAG_ID);
    expect(tags.update).toHaveBeenCalledWith(expect.objectContaining({ status: "revoked" }));
    expect(result.status).toBe("REVOKED");
  });

  it("9 listMyNfcTags derives per-tag status and last tap from the embedded link", async () => {
    const rows = [
      {
        id: TAG_ID,
        label: "Thẻ hội nghị",
        status: "active",
        written_at: WRITTEN,
        updated_at: WRITTEN,
        identity_share_links: linkSlice("active", "2026-05-02T08:00:00.000Z"),
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        label: null,
        status: "active",
        written_at: WRITTEN,
        updated_at: WRITTEN,
        identity_share_links: linkSlice("revoked"),
      },
    ];
    const tags = makeChain({ data: rows, error: null });
    const db = makeDb({ identity_nfc_tags: tags });
    const list = await listMyNfcTags(db, OWNER);
    expect(tags.eq).toHaveBeenCalledWith("owner_user_id", OWNER);
    expect(list).toHaveLength(2);
    expect(list[0].status).toBe("ACTIVE");
    expect(list[0].lastTappedAt).toBe("2026-05-02T08:00:00.000Z");
    expect(list[1].status).toBe("STALE");
    expect(list[1].lastTappedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// List UI
// ---------------------------------------------------------------------------

describe("NfcTagsList", () => {
  it("10 renders a labelled list with status text, write time and last tap — no ids", async () => {
    const { container } = renderWithLang(
      <NfcTagsList tags={[tagInfo()]} revokingId={null} onRevoke={() => {}} />,
    );
    const list = screen.getByRole("list", { name: "NFC card list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Thẻ hội nghị")).toBeTruthy();
    expect(screen.getByText(/Written/)).toBeTruthy();
    expect(screen.getByText(/Last tap:/)).toBeTruthy();
    expect(container.textContent).not.toContain(TAG_ID);
    await expectNoAxeViolations(container);
  });

  it("11 shows fallback name and 'No taps yet' when label/taps are missing", () => {
    renderWithLang(
      <NfcTagsList
        tags={[tagInfo({ label: null, status: "STALE", lastTappedAt: null })]}
        revokingId={null}
        onRevoke={() => {}}
      />,
    );
    expect(screen.getByText("NFC Card")).toBeTruthy();
    expect(screen.getByText("Link rotated")).toBeTruthy();
    expect(screen.getByText("No taps yet")).toBeTruthy();
  });

  it("12 revoke is a two-step confirmation and passes the tag id", () => {
    const onRevoke = vi.fn();
    renderWithLang(<NfcTagsList tags={[tagInfo()]} revokingId={null} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke card Thẻ hội nghị" }));
    expect(onRevoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(onRevoke).toHaveBeenCalledWith(TAG_ID);
  });

  it("13 cancel hides the confirmation without revoking", () => {
    const onRevoke = vi.fn();
    renderWithLang(<NfcTagsList tags={[tagInfo()]} revokingId={null} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke card Thẻ hội nghị" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRevoke).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
  });

  it("14 REVOKED tags offer no revoke action", () => {
    renderWithLang(
      <NfcTagsList tags={[tagInfo({ status: "REVOKED" })]} revokingId={null} onRevoke={() => {}} />,
    );
    expect(screen.getByText("Revoked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Revoke/ })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Write → registry wiring
// ---------------------------------------------------------------------------

function linkInfo(): IdentityShareLinkInfo {
  return {
    token: TOKEN,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    rotatedAt: null,
    lastUsedAt: null,
  };
}

describe("NfcSheet registry wiring", () => {
  it("15 calls registerTag exactly once after a CONFIRMED write", async () => {
    const adapter: NfcWriterAdapter = {
      getCapability: () => "SUPPORTED_WRITE",
      writeIdentityUrl: vi.fn(async () => {}),
    };
    const registerTag = vi.fn(async () => ({}));
    renderWithLang(
      <NfcSheet
        shareLink={linkInfo()}
        onClose={() => {}}
        adapter={adapter}
        registerTag={registerTag}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(adapter.writeIdentityUrl).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(registerTag).toHaveBeenCalledTimes(1));
  });

  it("16 never calls registerTag when the write fails", async () => {
    const adapter: NfcWriterAdapter = {
      getCapability: () => "SUPPORTED_WRITE",
      writeIdentityUrl: vi.fn(async () => {
        throw new Error("boom");
      }),
    };
    const registerTag = vi.fn(async () => ({}));
    renderWithLang(
      <NfcSheet
        shareLink={linkInfo()}
        onClose={() => {}}
        adapter={adapter}
        registerTag={registerTag}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /write to nfc card/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(registerTag).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// i18n coverage
// ---------------------------------------------------------------------------

describe("i18n", () => {
  const KEYS = [
    "bc.mobile.me.nfc.tags.rowTitle",
    "bc.mobile.me.nfc.tags.rowSubtitle",
    "bc.mobile.me.nfc.tags.pageTitle",
    "bc.mobile.me.nfc.tags.pageDesc",
    "bc.mobile.me.nfc.tags.tapNote",
    "bc.mobile.me.nfc.tags.listAria",
    "bc.mobile.me.nfc.tags.empty",
    "bc.mobile.me.nfc.tags.emptyHint",
    "bc.mobile.me.nfc.tags.defaultName",
    "bc.mobile.me.nfc.tags.status.active",
    "bc.mobile.me.nfc.tags.status.stale",
    "bc.mobile.me.nfc.tags.status.revoked",
    "bc.mobile.me.nfc.tags.writtenAt",
    "bc.mobile.me.nfc.tags.lastTap",
    "bc.mobile.me.nfc.tags.never",
    "bc.mobile.me.nfc.tags.revoke",
    "bc.mobile.me.nfc.tags.revokeAria",
    "bc.mobile.me.nfc.tags.revokeConfirm",
    "bc.mobile.me.nfc.tags.backToMe",
  ] as const;
  it.each(KEYS)("17 %s exists in vi and en", (key) => {
    expect(hasTKey(key)).toBe(true);
    expect(translations[key as TKey].vi).toBeTruthy();
    expect(translations[key as TKey].en).toBeTruthy();
  });
});
