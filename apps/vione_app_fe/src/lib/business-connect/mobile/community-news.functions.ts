// BC-Mobile-7B+ — Community news server-fn thin wrappers.
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type { CommunityNewsDetailDTO, CommunityNewsPageDTO } from "./community-news.types";

const listInput = z.object({
  communityId: z.string().uuid(),
  offset: z.number().int().min(0).max(100_000).optional(),
});

export const listCommunityNewsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listInput.parse(i))
  .handler(async ({ data, context }): Promise<CommunityNewsPageDTO | null> => {
    const queryParams = new URLSearchParams();
    if (data.offset !== undefined) queryParams.set("offset", String(data.offset));
    const queryString = queryParams.toString();
    return fetchNestApiFromServer(
      `/connect-app/community/${data.communityId}/news${queryString ? `?${queryString}` : ""}`,
      context.token,
    );
  });

const detailInput = z.object({
  communityId: z.string().uuid(),
  newsRef: z.string().min(1).max(64),
});

export const getCommunityNewsDetailFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => detailInput.parse(i))
  .handler(async ({ data, context }): Promise<CommunityNewsDetailDTO | null> => {
    return fetchNestApiFromServer(`/connect-app/community/${data.communityId}/news/${data.newsRef}`, context.token);
  });
