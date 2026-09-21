// BC-1.0 / BC-1.2 — PlatformIdentitySDK (client-facing, no UI).
// Thin wrapper over the identity server functions. Business Connect surfaces
// consume this SDK; Association modules keep using AssociationIdentity.
//
// Every method documents: trusted source · nullable behavior · consumers ·
// forbidden usage. There is intentionally NO generic "resolve everything"
// method that hides authorization requirements.

import {
  getCurrentUserFn,
  getProfileFn,
  getAssociationsFn,
  resolvePlatformIdentityFn,
  upsertProfileFn,
} from "./platform-identity.functions";
import {
  getAccountStatusFn,
  getActiveAssociationContextFn,
  getActiveMemberIdFn,
  resolveBusinessCardOwnerContextFn,
  setActiveAssociationContextFn,
} from "./identity-bridge.functions";
import type {
  AccountStatusResult,
  ActiveAssociationContext,
  AssociationIdentity,
  BusinessCardOwnerContext,
  CommunityIdentityContext,
  GlobalIdentityContext,
  PlatformIdentity,
  ProfileUpdateInput,
  UserProfile,
} from "./identity.types";

/** Resolve the full platform identity (global + associations + communities). */
export async function resolvePlatformIdentity(): Promise<PlatformIdentity> {
  return resolvePlatformIdentityFn();
}

export const PlatformIdentitySDK = {
  /**
   * Authenticated global user context (valid even without a member row).
   * Source: JWT + user_profiles. Never null (throws if account inactive).
   * Consumers: any signed-in surface. Forbidden: tenant authorization.
   */
  async getCurrentUser(): Promise<GlobalIdentityContext> {
    return getCurrentUserFn();
  },

  /**
   * Current user's global profile. Source: user_profiles (owner RLS).
   * Nullable: null until created. Consumers: profile screens.
   * Forbidden: storing association/member/fee data here.
   */
  async getProfile(): Promise<UserProfile | null> {
    return getProfileFn();
  },

  /** Update (or create) the current user's global profile. */
  async updateProfile(input: ProfileUpdateInput): Promise<UserProfile> {
    return upsertProfileFn({ data: input });
  },

  /**
   * Platform account status. Source: user_profiles.account_status (server).
   * Never null. Consumers: platform-level gating. Forbidden: substituting
   * association member status for platform status (they are distinct).
   */
  async getAccountStatus(): Promise<AccountStatusResult> {
    return getAccountStatusFn();
  },

  /** True when the platform account is active. Source: getAccountStatus. */
  async isAccountActive(): Promise<boolean> {
    const s = await getAccountStatusFn();
    return s.isActive;
  },

  /**
   * All resolved contexts for the user. Source: identity resolver.
   * Never throws for a missing member/association. Consumers: overview UIs.
   */
  async getContexts(): Promise<PlatformIdentity> {
    return resolvePlatformIdentity();
  },

  /**
   * Association contexts. Source: memberships (frozen model).
   * Nullable: [] is valid. Consumers: association switchers/overview.
   * Forbidden: using as platform authorization.
   */
  async getAssociationContexts(): Promise<AssociationIdentity[]> {
    return getAssociationsFn();
  },

  /** @deprecated Use getAssociationContexts(). Kept for BC-1.0 callers. */
  async getAssociations(): Promise<AssociationIdentity[]> {
    return getAssociationsFn();
  },

  /**
   * Active association context. Source: current_member_id() /
   * current_association_id() (JWT-scoped). Nullable: null without an active
   * association. Consumers: tenant-scoped surfaces. Forbidden: trusting a
   * client-supplied memberId/associationId.
   */
  async getActiveAssociationContext(): Promise<ActiveAssociationContext | null> {
    return getActiveAssociationContextFn();
  },

  /**
   * Set the active association. Source: trusted set_active_association RPC
   * (validates membership; rejects cross-association). Forbidden: arbitrary
   * memberId or selecting an association the user is not a member of.
   */
  async setActiveAssociationContext(
    associationId: string,
  ): Promise<ActiveAssociationContext | null> {
    return setActiveAssociationContextFn({ data: { associationId } });
  },

  /**
   * Active member id, or null. Source: current_member_id() (JWT-scoped).
   * Additive bridge; NOT a replacement for resolveMemberId(). Consumers:
   * graceful read paths. Forbidden: write authorization.
   */
  async getActiveMemberId(): Promise<string | null> {
    const { memberId } = await getActiveMemberIdFn();
    return memberId;
  },

  /**
   * True when the user belongs to at least one association.
   * Source: getAssociationContexts. Consumers: onboarding gating.
   */
  async hasAssociation(): Promise<boolean> {
    const list = await getAssociationsFn();
    return list.length > 0;
  },

  /**
   * Community contexts — reserved for BC-6. Returns [] (data-driven empty;
   * no fabrication). Signature is frozen so BC-6 consumers can compile now.
   */
  async getCommunityContexts(): Promise<CommunityIdentityContext[]> {
    return [];
  },

  /** True when the user belongs to a community. Always false until BC-6. */
  async hasCommunity(): Promise<boolean> {
    return false;
  },

  /**
   * Card-owner bridge (read-only). Source: member_business_cards + unique
   * members.user_id mapping. ownershipMode "unresolved" for null/ambiguous.
   * Consumers: BC-2 prep/tooling. Forbidden: treating "unresolved" as a grant.
   */
  async resolveBusinessCardOwnerContext(cardId: string): Promise<BusinessCardOwnerContext> {
    return resolveBusinessCardOwnerContextFn({ data: { cardId } });
  },
} as const;

export type {
  PlatformIdentity,
  UserProfile,
  AssociationIdentity,
  ActiveAssociationContext,
  AccountStatusResult,
  BusinessCardOwnerContext,
  CommunityIdentityContext,
} from "./identity.types";
