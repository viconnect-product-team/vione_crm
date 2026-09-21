import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type AdminBenefit = {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  sortOrder: number;
};

type Row = Record<string, unknown>;

function mapBenefit(r: Row): AdminBenefit {
  return {
    id: r.id as string,
    titleVi: (r.title_vi as string) ?? "",
    titleEn: (r.title_en as string) ?? "",
    descVi: (r.desc_vi as string) ?? "",
    descEn: (r.desc_en as string) ?? "",
    sortOrder: (r.sort_order as number) ?? 0,
  };
}

async function activeAssociationId(context: any): Promise<string> {
  try {
    const { data } = await getDb(context).rpc("current_association_id");
    if (typeof data === "string" && data.length > 0) return data;
  } catch {}
  const { data: assoc } = await getDb(context).from("associations").select("id").limit(1).maybeSingle();
  return assoc?.id ?? "c1983000-0000-4000-8000-000000001983";
}

export const listBenefitsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AdminBenefit[]> => {
    const associationId = await activeAssociationId(context);
    const { data, error } = await getDb(context)
      .from("association_benefits")
      .select("*")
      .eq("association_id", associationId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapBenefit(r as Row));
  });

const benefitInput = z.object({
  titleVi: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).default(""),
  descVi: z.string().trim().max(400).default(""),
  descEn: z.string().trim().max(400).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

function toRow(d: z.infer<typeof benefitInput>) {
  return {
    title_vi: d.titleVi,
    title_en: d.titleEn,
    desc_vi: d.descVi,
    desc_en: d.descEn,
    sort_order: d.sortOrder,
  };
}

export const createBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => benefitInput.parse(d))
  .handler(async ({ data, context }): Promise<AdminBenefit> => {
    const associationId = await activeAssociationId(context);
    const { data: row, error } = await getDb(context)
      .from("association_benefits")
      .insert({ ...toRow(data), association_id: associationId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    try {
      const { logActivity } = await import("./crud.server");
      await logActivity(getDb(context), {
        action: "Tạo quyền lợi hội viên",
        target: data.titleVi,
        category: "member",
        associationId,
      });
    } catch {}
    return mapBenefit(row);
  });

export const updateBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => benefitInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<AdminBenefit> => {
    const associationId = await activeAssociationId(context);
    const { data: row, error } = await getDb(context)
      .from("association_benefits")
      .update(toRow(data))
      .eq("id", data.id)
      .eq("association_id", associationId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    try {
      const { logActivity } = await import("./crud.server");
      await logActivity(getDb(context), {
        action: "Cập nhật quyền lợi hội viên",
        target: data.titleVi,
        category: "member",
        associationId,
      });
    } catch {}
    return mapBenefit(row);
  });

export const deleteBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const associationId = await activeAssociationId(context);
    const { error } = await getDb(context)
      .from("association_benefits")
      .delete()
      .eq("id", data.id)
      .eq("association_id", associationId);
    if (error) throw new Error(error.message);
    try {
      const { logActivity } = await import("./crud.server");
      await logActivity(getDb(context), {
        action: "Xóa quyền lợi hội viên",
        target: data.id,
        category: "member",
        associationId,
      });
    } catch {}
    return { ok: true };
  });
