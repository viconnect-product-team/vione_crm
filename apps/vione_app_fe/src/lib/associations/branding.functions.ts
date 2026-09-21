import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type AssociationBranding = {
  brandPrimary: string | null;
  tagline: string | null;
  about: string | null;
  contactEmail: string | null;
  landingPublished: boolean;
};

/** Admin read of own association branding (RLS scopes access). */
export const getAssociationBrandingFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<AssociationBranding | null> => {
    const { data: row, error } = await getDb(context)
      .from("associations")
      .select("brand_primary, tagline, about, contact_email, landing_published")
      .eq("id", data.associationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const r: any = row;
    return {
      brandPrimary: r.brand_primary,
      tagline: r.tagline,
      about: r.about,
      contactEmail: r.contact_email,
      landingPublished: Boolean(r.landing_published),
    };
  });

/** Admin update of own association branding (RLS scopes writes). */
export const updateAssociationBrandingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) =>
    z
      .object({
        associationId: z.string().uuid(),
        brandPrimary: z
          .string()
          .regex(/^#([0-9a-fA-F]{6})$/, "INVALID_COLOR")
          .nullable(),
        tagline: z.string().max(200).nullable(),
        about: z.string().max(4000).nullable(),
        contactEmail: z.string().email().max(200).nullable().or(z.literal("")),
        landingPublished: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    // Before enabling public, require a verified custom domain (if one is set).
    if (data.landingPublished) {
      const { data: dom } = await getDb(context)
        .from("associations")
        .select("custom_domain, domain_status")
        .eq("id", data.associationId)
        .maybeSingle();
      const d: any = dom;
      if (d?.custom_domain && d.domain_status !== "verified") {
        throw new Error("DOMAIN_NOT_VERIFIED");
      }
    }
    const { error } = await getDb(context)
      .from("associations")
      .update({
        brand_primary: data.brandPrimary,
        tagline: data.tagline,
        about: data.about,
        contact_email: data.contactEmail === "" ? null : data.contactEmail,
        landing_published: data.landingPublished,
      })
      .eq("id", data.associationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
