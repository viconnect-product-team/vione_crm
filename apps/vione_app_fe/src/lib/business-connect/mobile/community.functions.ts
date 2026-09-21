import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  CommunityDetailDTO,
  CommunityMemberPageDTO,
  CommunityMemberProfileDTO,
  CommunitySummaryDTO,
} from "./community.types";
import { fetchNestApiFromServer } from "../../api-client";

const communityIdSchema = z.string().uuid();

export const listMyCommunitiesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CommunitySummaryDTO[]> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/connect-app/community", token);
  });

export const getCommunityDetailFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ communityId: communityIdSchema }).parse(i))
  .handler(async ({ data, context }): Promise<CommunityDetailDTO | null> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}`, token);
  });

const membersInput = z.object({
  communityId: communityIdSchema,
  query: z.string().max(120).optional(),
  offset: z.number().int().min(0).max(100_000).optional(),
  roleFilter: z.enum(["all", "admin", "member"]).optional(),
});

export const listCommunityMembersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => membersInput.parse(i))
  .handler(async ({ data, context }): Promise<CommunityMemberPageDTO | null> => {
    const { token } = context as any;
    const queryParams = new URLSearchParams();
    if (data.query) queryParams.set("query", data.query);
    if (data.offset !== undefined) queryParams.set("offset", String(data.offset));
    if (data.roleFilter) queryParams.set("roleFilter", data.roleFilter);
    const queryString = queryParams.toString();
    const endpoint = `/connect-app/community/${data.communityId}/members${queryString ? `?${queryString}` : ""}`;
    return fetchNestApiFromServer(endpoint, token);
  });

const profileInput = z.object({
  communityId: communityIdSchema,
  memberRef: z.string().min(1).max(64),
});

export const getCommunityMemberProfileFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => profileInput.parse(i))
  .handler(async ({ data, context }): Promise<CommunityMemberProfileDTO | null> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/members/${data.memberRef}`, token);
  });

const connectInput = z.object({
  communityId: communityIdSchema,
  memberRef: z.string().min(1).max(64),
  mutationKey: z.string().max(64).optional(),
});

export const connectCommunityMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => connectInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/members/${data.memberRef}/connect`, token, {
      method: "POST",
      body: JSON.stringify({ mutationKey: data.mutationKey }),
    });
  });

const roleUpdateInput = z.object({
  communityId: communityIdSchema,
  memberRef: z.string().min(1).max(64),
  role: z.enum(["admin", "member"]),
});

export const updateCommunityMemberRoleFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => roleUpdateInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/members/${data.memberRef}/role`, token, {
      method: "PATCH",
      body: JSON.stringify({ role: data.role }),
    });
  });

const createOpportunityInput = z.object({
  communityId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  budget: z.string().optional(),
  industry: z.string().optional(),
  deadline: z.string().optional(),
  contactPhone: z.string().optional(),
});

export const createCommunityOpportunityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => createOpportunityInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: boolean; opportunity?: any; error?: string }> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/opportunities`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

const createNewsInput = z.object({
  communityId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  coverImage: z.string().optional(),
});

export const createCommunityNewsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => createNewsInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: boolean; news?: any; error?: string }> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/news`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });


