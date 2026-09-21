import { describe, it, expect, vi } from "vitest";
import {
  buildNonMemberIdentity,
  resolveMemberCode,
  type MinimalClient,
} from "@/lib/member-identity";

// ---------------------------------------------------------------------------
// Unit tests guarding the two identity resolvers against the historical bug:
// resolving a member by email (or "first member") leaked another member's PII
// to accounts that have no member profile of their own.
// ---------------------------------------------------------------------------

/** A tiny fake of the Supabase query builder that records the filters used. */
function fakeClient(opts: { rowsByUserId?: Record<string, { code: string }> }): {
  client: MinimalClient;
  calls: { eqCol: string; eqVal: unknown }[];
} {
  const calls: { eqCol: string; eqVal: unknown }[] = [];
  const client: MinimalClient = {
    from() {
      let pendingEq: { col: string; val: unknown } | null = null;
      const builder: any = {
        select: () => builder,
        eq: (col: string, val: unknown) => {
          pendingEq = { col, val };
          calls.push({ eqCol: col, eqVal: val });
          return builder;
        },
        maybeSingle: async () => {
          if (pendingEq?.col === "user_id") {
            const row = opts.rowsByUserId?.[String(pendingEq.val)];
            return { data: row ?? null, error: null };
          }
          return { data: null, error: null };
        },
      };
      return builder;
    },
  };
  return { client, calls };
}

describe("resolveMemberCode", () => {
  it("returns the code for the member linked by user_id", async () => {
    const { client } = fakeClient({ rowsByUserId: { "u-1": { code: "CEO1983-000001" } } });
    expect(await resolveMemberCode(client, "u-1")).toBe("CEO1983-000001");
  });

  it("returns null when no member is linked to the user (no email fallback)", async () => {
    const { client, calls } = fakeClient({ rowsByUserId: { "u-1": { code: "X" } } });
    const result = await resolveMemberCode(client, "u-2");
    expect(result).toBeNull();
    // It must query strictly by user_id — never by email.
    expect(calls.every((c) => c.eqCol === "user_id")).toBe(true);
    expect(calls.some((c) => c.eqCol === "email")).toBe(false);
  });

  it("never returns another member's code for an unlinked account", async () => {
    const { client } = fakeClient({
      rowsByUserId: { "member-user": { code: "CEO1983-000009" } },
    });
    // admin account with no member row must NOT get member-user's code
    expect(await resolveMemberCode(client, "admin-user")).toBeNull();
  });
});

describe("buildNonMemberIdentity", () => {
  it("uses the profile's own name and email", () => {
    const id = buildNonMemberIdentity({
      profile: { full_name: "Nguyen Tuan Truong", email: "nguyentuantruong@gmail.com" },
      authUser: { email: "nguyentuantruong@gmail.com", user_metadata: {} },
    });
    expect(id).toEqual({
      name: "Nguyen Tuan Truong",
      email: "nguyentuantruong@gmail.com",
      avatar: null,
    });
  });

  it("falls back to auth metadata name when profile name is empty", () => {
    const id = buildNonMemberIdentity({
      profile: { full_name: "", email: "a@b.com" },
      authUser: { email: "a@b.com", user_metadata: { name: "Meta Name" } },
    });
    expect(id.name).toBe("Meta Name");
  });

  it("falls back to the email prefix when no name is available", () => {
    const id = buildNonMemberIdentity({
      profile: { full_name: null, email: "admin@vba.vn" },
      authUser: null,
    });
    expect(id.name).toBe("admin");
    expect(id.email).toBe("admin@vba.vn");
  });

  it("prefers profile email, then auth email", () => {
    expect(
      buildNonMemberIdentity({
        profile: { email: "profile@x.com" },
        authUser: { email: "auth@x.com", user_metadata: {} },
      }).email,
    ).toBe("profile@x.com");
    expect(
      buildNonMemberIdentity({
        profile: null,
        authUser: { email: "auth@x.com", user_metadata: {} },
      }).email,
    ).toBe("auth@x.com");
  });

  it("reads avatar from metadata avatar_url then picture", () => {
    expect(
      buildNonMemberIdentity({
        profile: { full_name: "A", email: "a@b.com" },
        authUser: { user_metadata: { avatar_url: "http://img/a.png" } },
      }).avatar,
    ).toBe("http://img/a.png");
    expect(
      buildNonMemberIdentity({
        profile: { full_name: "A", email: "a@b.com" },
        authUser: { user_metadata: { picture: "http://img/p.png" } },
      }).avatar,
    ).toBe("http://img/p.png");
  });

  it("ignores non-string metadata values", () => {
    const id = buildNonMemberIdentity({
      profile: { full_name: "", email: "x@y.com" },
      authUser: { user_metadata: { name: 123, avatar_url: { nested: true } } as any },
    });
    expect(id.name).toBe("x"); // falls through to email prefix
    expect(id.avatar).toBeNull();
  });
});
