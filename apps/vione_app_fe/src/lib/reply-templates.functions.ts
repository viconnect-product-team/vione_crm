import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { resolveAssociationId } from "@/lib/current-member";

// Reply templates managed per-association. Channel mirrors the business-card
// ReplyChannel union. {name}/{card} tokens are filled client-side at compose time.
export type ReplyTemplateChannel = "email" | "phone" | "note";

export type ReplyTemplateRow = {
  id: string;
  channel: ReplyTemplateChannel;
  labelVi: string;
  labelEn: string;
  subjectVi: string | null;
  subjectEn: string | null;
  bodyVi: string;
  bodyEn: string;
  priority: number;
  isActive: boolean;
};

function mapRow(r: Record<string, unknown>): ReplyTemplateRow {
  return {
    id: r.id as string,
    channel: (r.channel as ReplyTemplateChannel) ?? "email",
    labelVi: (r.label_vi as string) ?? "",
    labelEn: (r.label_en as string) ?? "",
    subjectVi: (r.subject_vi as string) ?? null,
    subjectEn: (r.subject_en as string) ?? null,
    bodyVi: (r.body_vi as string) ?? "",
    bodyEn: (r.body_en as string) ?? "",
    priority: (r.priority as number) ?? 0,
    isActive: Boolean(r.is_active),
  };
}

const templateInput = z.object({
  id: z.string().uuid().optional(),
  channel: z.enum(["email", "phone", "note"]),
  labelVi: z.string().max(120),
  labelEn: z.string().max(120),
  subjectVi: z.string().max(200).nullable().optional(),
  subjectEn: z.string().max(200).nullable().optional(),
  bodyVi: z.string().max(4000),
  bodyEn: z.string().max(4000),
  priority: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

// Members: active templates only (RLS also enforces this). Ordered by priority.
export const listReplyTemplatesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<ReplyTemplateRow[]> => {
    const { supabase } = context;
    const assoc = await resolveAssociationId(supabase);
    const { data, error } = await supabase
      .from("reply_templates")
      .select("*")
      .eq("association_id", assoc)
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r as Record<string, unknown>));
  });

// Managers: all templates (active + inactive) for the management screen.
export const listAllReplyTemplatesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<ReplyTemplateRow[]> => {
    const { supabase } = context;
    const assoc = await resolveAssociationId(supabase);
    const { data, error } = await supabase
      .from("reply_templates")
      .select("*")
      .eq("association_id", assoc)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r as Record<string, unknown>));
  });

export const upsertReplyTemplateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input) => templateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const assoc = await resolveAssociationId(supabase);
    const row = {
      association_id: assoc,
      channel: data.channel,
      label_vi: data.labelVi,
      label_en: data.labelEn,
      subject_vi: data.subjectVi ?? null,
      subject_en: data.subjectEn ?? null,
      body_vi: data.bodyVi,
      body_en: data.bodyEn,
      priority: data.priority,
      is_active: data.isActive,
    };
    if (data.id) {
      const { error } = await supabase
        .from("reply_templates")
        .update(row)
        .eq("id", data.id)
        .eq("association_id", assoc);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await supabase
      .from("reply_templates")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (inserted as { id: string }).id };
  });

export const deleteReplyTemplateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const assoc = await resolveAssociationId(supabase);
    const { error } = await supabase
      .from("reply_templates")
      .delete()
      .eq("id", data.id)
      .eq("association_id", assoc);
    if (error) throw error;
    return { ok: true };
  });
