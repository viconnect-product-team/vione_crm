import { describe, it, expect } from "vitest";
import { resolveCardListScope } from "@/lib/business-card-admin.functions";
import { cardPermissionErrorKey } from "@/lib/card-permission-error";
import { BC_ERR } from "@/lib/business-card.functions";

// ---------------------------------------------------------------------------
// Unit tests for the desktop Business Card module's role + association scoping
// decision (no DB). These lock the contract that the admin listing enforces:
//   - platform admins may read every association's cards ("all"),
//   - association admins are pinned to the associations they manage,
//   - everyone else is unauthorized and sees nothing,
// and that permission failures surface as clear, localized i18n keys.
// ---------------------------------------------------------------------------

describe("resolveCardListScope — role + association_id scoping", () => {
  it("platform admin sees every association (scope = all)", () => {
    expect(resolveCardListScope({ isPlatformAdmin: true, managedAssociationIds: [] })).toEqual({
      authorized: true,
      scope: "all",
    });
  });

  it("platform admin is unrestricted even when also managing associations", () => {
    expect(
      resolveCardListScope({ isPlatformAdmin: true, managedAssociationIds: ["a", "b"] }),
    ).toEqual({ authorized: true, scope: "all" });
  });

  it("association admin is scoped to the associations they manage", () => {
    const scope = resolveCardListScope({
      isPlatformAdmin: false,
      managedAssociationIds: ["assoc-a"],
    });
    expect(scope).toEqual({
      authorized: true,
      scope: "associations",
      associationIds: ["assoc-a"],
    });
  });

  it("admin of multiple associations is scoped to all of them (deduped)", () => {
    const scope = resolveCardListScope({
      isPlatformAdmin: false,
      managedAssociationIds: ["a", "b", "a"],
    });
    expect(scope.authorized).toBe(true);
    if (scope.authorized && scope.scope === "associations") {
      expect([...scope.associationIds].sort()).toEqual(["a", "b"]);
    } else {
      throw new Error("expected association-scoped result");
    }
  });

  it("a signed-in user with NO admin role sees nothing (unauthorized)", () => {
    expect(resolveCardListScope({ isPlatformAdmin: false, managedAssociationIds: [] })).toEqual({
      authorized: false,
    });
  });

  it("empty / falsy association ids are filtered out (no accidental blanket access)", () => {
    expect(
      resolveCardListScope({ isPlatformAdmin: false, managedAssociationIds: ["", ""] }),
    ).toEqual({ authorized: false });
  });
});

describe("cardPermissionErrorKey — permission failures map to i18n keys", () => {
  it("maps unauthorized (no session) to the auth key", () => {
    expect(cardPermissionErrorKey(new Error("Unauthorized"))).toBe("bc.perm.err.auth");
  });

  it("maps RLS / forbidden (wrong association or not owner) to the forbidden key", () => {
    expect(cardPermissionErrorKey(new Error(BC_ERR.FORBIDDEN))).toBe("bc.perm.err.forbidden");
    expect(cardPermissionErrorKey(new Error("new row violates row-level security policy"))).toBe(
      "bc.perm.err.forbidden",
    );
  });

  it("maps missing linked profile / not found / locked to their keys", () => {
    expect(cardPermissionErrorKey(new Error(BC_ERR.NO_PROFILE))).toBe("bc.perm.err.noProfile");
    expect(cardPermissionErrorKey(new Error(BC_ERR.NOT_FOUND))).toBe("bc.perm.err.notFound");
    expect(cardPermissionErrorKey(new Error(BC_ERR.LOCKED))).toBe("bc.perm.err.locked");
  });

  it("falls back to a generic key for unknown errors", () => {
    expect(cardPermissionErrorKey(new Error("boom"))).toBe("bc.perm.err.generic");
  });
});
