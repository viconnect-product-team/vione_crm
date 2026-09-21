import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  BcMobileDismissRecommendationResult,
  BcMobilePersonRecommendationResult,
  BcMobileTodayRecommendationsResult,
} from "./relationship-intelligence.types";
import { fetchNestApiFromServer, fetchNestApi } from "../../api-client";

const personIdSchema = z.string().regex(/^([ucg]:)?[0-9a-fA-F-]{36}$/);
const localeSchema = z.enum(["vi", "en"]).optional();

export const bcRelationshipTodayRecommendationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ locale: localeSchema }).parse(input ?? {}))
  .handler(async ({ data, context }): Promise<BcMobileTodayRecommendationsResult> => {
    try {
      const { token } = context as any;
      return await fetchNestApiFromServer("/connect-app/network/recommendations/today", token);
    } catch {
      return { recommendations: [] };
    }
  });

export const bcRelationshipPersonRecommendationFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z.object({ personId: personIdSchema, locale: localeSchema }).parse(input),
  )
  .handler(async ({ data, context }): Promise<BcMobilePersonRecommendationResult> => {
    try {
      const { token } = context as any;
      return await fetchNestApiFromServer(`/connect-app/network/recommendations/person/${data.personId}`, token);
    } catch {
      return { recommendation: null };
    }
  });

export const bcRelationshipDismissRecommendationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        personId: personIdSchema,
        recommendationType: z.literal("reconnect"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<BcMobileDismissRecommendationResult> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/network/recommendations/person/${data.personId}`, token, {
      method: "DELETE",
    });
  });

// ── Client-side direct helpers (bypass serverFn middleware) ───────────────────

/** Lấy gợi ý kết nối hôm nay trực tiếp qua fetchNestApi (client JWT). */
export async function getTodayRecommendationsDirect(
  locale?: "vi" | "en",
): Promise<BcMobileTodayRecommendationsResult> {
  try {
    return await fetchNestApi<BcMobileTodayRecommendationsResult>(
      "/connect-app/network/recommendations/today",
    );
  } catch {
    return { recommendations: [] };
  }
}

/** Lấy gợi ý cho một người cụ thể trực tiếp qua fetchNestApi (client JWT). */
export async function getPersonRecommendationDirect(
  personId: string,
  locale?: "vi" | "en",
): Promise<BcMobilePersonRecommendationResult> {
  try {
    return await fetchNestApi<BcMobilePersonRecommendationResult>(
      `/connect-app/network/recommendations/person/${personId}`,
    );
  } catch {
    return { recommendation: null };
  }
}

/** Xóa gợi ý trực tiếp qua fetchNestApi (client JWT). */
export async function dismissRecommendationDirect(
  personId: string,
): Promise<BcMobileDismissRecommendationResult> {
  return fetchNestApi<BcMobileDismissRecommendationResult>(
    `/connect-app/network/recommendations/person/${personId}`,
    { method: "DELETE" },
  );
}

