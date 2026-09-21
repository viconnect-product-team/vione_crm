// Pass generator — produces provider-neutral pass payloads from a MembershipPass.
// Apple (.pkpass) and Google (JWT save link) require server-side signing with
// private certificates/keys, which is intentionally NOT done here (no fake
// security). These builders produce the *unsigned* field payloads a backend
// would sign. When no backend is configured, callers fall back to a shareable
// verify link so the user is never blocked.

import type { MembershipPass } from "@/lib/membership-pass";
import { STATE_STYLES } from "@/lib/card-themes";

export type GenericPassPayload = {
  formatVersion: 1;
  description: string;
  organizationName: string;
  memberCode: string;
  fields: { key: string; label: string; value: string }[];
  barcode: { format: "QR"; message: string };
  colors: { background: string; foreground: string };
  expiresAt: string | null;
};

export function buildGenericPass(pass: MembershipPass): GenericPassPayload {
  const state = STATE_STYLES[pass.state];
  return {
    formatVersion: 1,
    description: `${pass.associationName ?? "Membership"} — ${pass.memberName}`,
    organizationName: pass.associationName ?? pass.organization ?? "Membership",
    memberCode: pass.memberCode,
    fields: [
      { key: "name", label: "Member", value: pass.memberName },
      { key: "code", label: "Member ID", value: pass.memberCode },
      ...(pass.membershipLevel
        ? [{ key: "level", label: "Level", value: pass.membershipLevel }]
        : []),
      { key: "status", label: "Status", value: state.labelEn },
      ...(pass.expiresAt ? [{ key: "expires", label: "Valid Until", value: pass.expiresAt }] : []),
    ],
    barcode: { format: "QR", message: pass.verifyUrl },
    colors: { background: pass.brandPrimary ?? "#0e1f44", foreground: "#ffffff" },
    expiresAt: pass.expiresAt,
  };
}

/** A plain-text .vcf-like fallback that always works offline / without a backend. */
export function passToShareText(pass: MembershipPass): string {
  const lines = [
    pass.memberName,
    pass.organization ?? "",
    pass.associationName ? `Association: ${pass.associationName}` : "",
    `Member ID: ${pass.memberCode}`,
    pass.membershipLevel ? `Level: ${pass.membershipLevel}` : "",
    `Verify: ${pass.verifyUrl}`,
  ];
  return lines.filter(Boolean).join("\n");
}
