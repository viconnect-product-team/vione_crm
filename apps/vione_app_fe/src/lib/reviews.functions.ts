import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export type ReviewType = "service" | "event" | "networking";

export type ReviewRow = {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  reviewType: ReviewType;
  createdAt: string;
};

export const listReviewsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ sellerId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<{ reviews: ReviewRow[]; stats: { count: number; avg: number } }> => {
    return fetchNestApiFromServer(`/reviews?sellerId=${encodeURIComponent(data.sellerId)}`, context.token);
  });

export const addReviewFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sellerId: z.string().min(1).max(64),
        reviewerId: z.string().min(1).max(64),
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1).max(1000),
        reviewType: z.enum(["service", "event", "networking"]).default("service"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ReviewRow | null> => {
    return fetchNestApiFromServer("/reviews", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateReviewFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(64),
        reviewerId: z.string().min(1).max(64),
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1).max(1000),
        reviewType: z.enum(["service", "event", "networking"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ReviewRow | null> => {
    const { id, ...body } = data;
    return fetchNestApiFromServer(`/reviews/${id}`, context.token, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

export const deleteReviewFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(64),
        reviewerId: z.string().min(1).max(64),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer(`/reviews/${data.id}`, context.token, {
      method: "DELETE",
    });
  });
