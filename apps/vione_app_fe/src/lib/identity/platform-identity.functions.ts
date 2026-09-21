// BC-1.0 — Platform Identity server functions (client-callable RPCs).
// Backward-compatible: does NOT touch current_member_id / current_association_id.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  buildGlobalIdentityContext,
  getAssociationContexts,
  requirePlatformUser,
  resolveUserProfile,
} from "./platform-identity.server";
import type {
  GlobalIdentityContext,
  PlatformIdentity,
  UserProfile,
  AssociationIdentity,
} from "./identity.types";
import { fetchNestApiFromServer } from "../api-client";

/** Global identity context for the signed in user (no member required). */
export const getCurrentUserFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<GlobalIdentityContext> => {
    const { token, userId, user } = context as any;
    const profile = await fetchNestApiFromServer("/connect-app/me/profile", token);
    return {
      userId,
      email: user?.email || (profile ? profile.email : null),
      profile: profile ? {
        userId: profile.user_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        professionalTitle: profile.professional_title,
        companyName: profile.company_name,
        industry: profile.industry,
        region: profile.region,
        bio: profile.bio,
        locale: profile.locale,
        timezone: profile.timezone,
        onboardingStatus: profile.onboarding_status,
        accountStatus: profile.account_status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } : null,
      hasProfile: profile !== null,
    };
  });

/** Read the current user's global profile (null if not created yet). */
export const getProfileFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<UserProfile | null> => {
    const { token } = context as any;
    const profile = await fetchNestApiFromServer("/connect-app/me/profile", token);
    if (!profile) return null;
    return {
      userId: profile.user_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      professionalTitle: profile.professional_title,
      companyName: profile.company_name,
      industry: profile.industry,
      region: profile.region,
      bio: profile.bio,
      locale: profile.locale,
      timezone: profile.timezone,
      onboardingStatus: profile.onboarding_status,
      accountStatus: profile.account_status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  });

const profileUpdateSchema = z.object({
  displayName: z.string().max(200).nullish(),
  avatarUrl: z.string().url().max(1000).nullish(),
  professionalTitle: z.string().max(200).nullish(),
  companyName: z.string().max(200).nullish(),
  industry: z.string().max(120).nullish(),
  region: z.string().max(120).nullish(),
  bio: z.string().max(2000).nullish(),
  locale: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
  onboardingStatus: z.enum(["new", "in_progress", "completed"]).optional(),
});

/** Create or update the current user's global profile (owner-scoped by RLS). */
export const upsertProfileFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ data, context }): Promise<UserProfile> => {
    const { token } = context as any;
    const payload: any = {};
    if (data.displayName !== undefined) payload.display_name = data.displayName;
    if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
    if (data.professionalTitle !== undefined) payload.professional_title = data.professionalTitle;
    if (data.companyName !== undefined) payload.company_name = data.companyName;
    if (data.industry !== undefined) payload.industry = data.industry;
    if (data.region !== undefined) payload.region = data.region;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.locale !== undefined) payload.locale = data.locale;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.onboardingStatus !== undefined) payload.onboarding_status = data.onboardingStatus;

    const profile = await fetchNestApiFromServer("/connect-app/me/profile", token, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return {
      userId: profile.user_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      professionalTitle: profile.professional_title,
      companyName: profile.company_name,
      industry: profile.industry,
      region: profile.region,
      bio: profile.bio,
      locale: profile.locale,
      timezone: profile.timezone,
      onboardingStatus: profile.onboarding_status,
      accountStatus: profile.account_status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  });

/** Association contexts for the current user (compatibility layer; [] is valid). */
export const getAssociationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async (): Promise<AssociationIdentity[]> => {
    return [];
  });

/**
 * Full identity resolver. Never throws because a member/association is missing.
 * Communities are empty at BC-1.0 (reserved for BC-2+).
 */
export const resolvePlatformIdentityFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<PlatformIdentity> => {
    const { token, userId, user } = context as any;
    const profileRes = await fetchNestApiFromServer("/connect-app/me/profile", token);
    const globalProfile = profileRes ? {
      userId: profileRes.user_id,
      displayName: profileRes.display_name,
      avatarUrl: profileRes.avatar_url,
      professionalTitle: profileRes.professional_title,
      companyName: profileRes.company_name,
      industry: profileRes.industry,
      region: profileRes.region,
      bio: profileRes.bio,
      locale: profileRes.locale,
      timezone: profileRes.timezone,
      onboardingStatus: profileRes.onboarding_status,
      accountStatus: profileRes.account_status,
      createdAt: profileRes.created_at,
      updatedAt: profileRes.updated_at,
    } : null;
    return {
      global: {
        userId,
        email: user?.email || (profileRes ? profileRes.email : null),
        profile: globalProfile,
        hasProfile: profileRes !== null,
      },
      associations: [],
      communities: [],
    };
  });
