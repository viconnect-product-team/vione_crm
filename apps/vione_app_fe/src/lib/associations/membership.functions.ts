import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type MyAssociation = {
  associationId: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  role: string;
  isActive: boolean;
};

export const listMyAssociationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyAssociation[]> => {
    const { data: rows, error } = await getDb(context)
      .from("memberships")
      .select("association_id, role, is_default, created_at, associations(name, slug, logo_url)")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r: any) => ({
      associationId: r.association_id,
      name: r.associations?.name ?? "—",
      slug: r.associations?.slug ?? null,
      logoUrl: r.associations?.logo_url ?? null,
      role: r.role,
      isActive: Boolean(r.is_default),
    }));
  });

export const setActiveAssociationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await getDb(context).rpc("set_active_association", {
      _association_id: data.associationId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ActiveAssociation = {
  associationId: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  role: string;
  isAdmin: boolean;
};

export const getActiveAssociationFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<ActiveAssociation | null> => {
    const { data: rows, error } = await getDb(context)
      .from("memberships")
      .select("association_id, role, is_default, created_at, associations(name, slug, logo_url)")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) throw new Error(error.message);
    const r: any = (rows ?? [])[0];
    if (!r) return null;
    return {
      associationId: r.association_id,
      name: r.associations?.name ?? "—",
      slug: r.associations?.slug ?? null,
      logoUrl: r.associations?.logo_url ?? null,
      role: r.role,
      isAdmin: r.role === "admin",
    };
  });
