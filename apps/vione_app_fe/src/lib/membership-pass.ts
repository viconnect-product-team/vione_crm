// Membership pass model — the canonical, provider-agnostic representation of a
// digital membership card. Wallet providers (Apple/Google) and the on-screen
// card all derive from this single shape so there is one source of truth.

import type { CardThemeId, MembershipState } from "@/lib/card-themes";

export type MembershipPass = {
  /** Stable member code (also encoded in QR/NFC). */
  memberCode: string;
  memberName: string;
  organization: string | null;
  associationName: string | null;
  associationLogoUrl: string | null;
  membershipLevel: string | null;
  state: MembershipState;
  issuedAt: string | null;
  expiresAt: string | null;
  themeId: CardThemeId;
  brandPrimary: string | null;
  /** Public verification URL for this member. */
  verifyUrl: string;
  photoUrl: string | null;
};

export type MembershipPassInput = {
  memberCode: string;
  memberName: string;
  organization?: string | null;
  associationName?: string | null;
  associationLogoUrl?: string | null;
  membershipLevel?: string | null;
  state: MembershipState;
  issuedAt?: string | null;
  expiresAt?: string | null;
  themeId: CardThemeId;
  brandPrimary?: string | null;
  origin: string;
  photoUrl?: string | null;
};

export function buildMembershipPass(input: MembershipPassInput): MembershipPass {
  return {
    memberCode: input.memberCode,
    memberName: input.memberName,
    organization: input.organization ?? null,
    associationName: input.associationName ?? null,
    associationLogoUrl: input.associationLogoUrl ?? null,
    membershipLevel: input.membershipLevel ?? null,
    state: input.state,
    issuedAt: input.issuedAt ?? null,
    expiresAt: input.expiresAt ?? null,
    themeId: input.themeId,
    brandPrimary: input.brandPrimary ?? null,
    verifyUrl: `${input.origin}/verify?code=${encodeURIComponent(input.memberCode)}`,
    photoUrl: input.photoUrl ?? null,
  };
}
