// AI card import history — persist each generated suggestion so users can
// revisit and compare them later.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

const MAX_THUMB_BYTES = 400 * 1024; // ~400KB thumbnail cap

const SaveInput = z.object({
  thumbnail: z
    .string()
    .refine((s) => s.startsWith("data:image/"), "thumbnail must be data:image/*")
    .refine((s) => s.length <= MAX_THUMB_BYTES, "thumbnail too large"),
  suggestion: z.record(z.string(), z.unknown()),
  templateId: z.string().nullable().optional(),
  qrBackground: z.string().nullable().optional(),
  applied: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
});

export type CardAiHistoryEntry = {
  id: string;
  thumbnail: string;
  suggestion: Record<string, any>;
  templateId: string | null;
  qrBackground: string | null;
  appliedAt: string | null;
  note: string | null;
  createdAt: string;
};

export const saveCardAiHistory = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }): Promise<CardAiHistoryEntry> => {
    return await fetchNestApiFromServer<CardAiHistoryEntry>(
      "/business-cards/ai-history",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

export const listCardAiHistory = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CardAiHistoryEntry[]> => {
    try {
      const res = await fetchNestApiFromServer<CardAiHistoryEntry[]>(
        "/business-cards/ai-history",
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

export const deleteCardAiHistory = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await fetchNestApiFromServer(`/business-cards/ai-history/${data.id}`, context.token, {
      method: "DELETE",
    });
    return { ok: true as const };
  });
