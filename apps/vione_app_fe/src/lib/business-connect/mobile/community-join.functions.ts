// BC-Mobile-7B+ — Server-fn wrappers cho yêu cầu tham gia cộng đồng.
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type {
  CommunityJoinAdminRequestDTO,
  CommunityJoinCandidateDTO,
  CommunityJoinHistoryItemDTO,
  CommunityJoinStatus,
} from "./community-join.types";

export const listJoinableCommunitiesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CommunityJoinCandidateDTO[]> => {
    return fetchNestApiFromServer("/connect-app/community/joinable", context.token);
  });

export const requestCommunityJoinFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        communityId: z.string().uuid(),
        note: z.string().trim().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }): Promise<{ status: CommunityJoinStatus }> => {
    const { communityId, note } = data;
    return fetchNestApiFromServer(`/connect-app/community/${communityId}/join-requests`, context.token, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  });

export const cancelCommunityJoinFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        communityId: z.string().uuid(),
        cancelReason: z.string().trim().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }): Promise<{ status: CommunityJoinStatus }> => {
    const { communityId, cancelReason } = data;
    return fetchNestApiFromServer(`/connect-app/community/${communityId}/join-requests`, context.token, {
      method: "DELETE",
      body: JSON.stringify({ cancelReason }),
    });
  });

export const listCommunityJoinHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CommunityJoinHistoryItemDTO[]> => {
    return fetchNestApiFromServer("/connect-app/community/join-requests/history", context.token);
  });

export const syncCommunityJoinDecisionsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(
    async ({
      context,
    }): Promise<Array<{ communityId: string; name: string; status: "approved" | "rejected" }>> => {
      return fetchNestApiFromServer("/connect-app/community/join-requests/sync", context.token, {
        method: "POST",
      });
    },
  );

export const listCommunityJoinAdminRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CommunityJoinAdminRequestDTO[]> => {
    return fetchNestApiFromServer("/connect-app/community/join-requests/admin", context.token);
  });
