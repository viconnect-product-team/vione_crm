// BC-2.7 — Company (Organization) server functions.
//
// Thin adapters over CompanyService. Owner/manager scope is enforced by
// requireSupabaseAuth + RLS on companies / company_members. The public getter
// uses the anon publishable client (public SELECT policy restricts rows to
// visibility='public' AND status='active').

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CompanyService } from "./company.service";
import type { PublicCompanyResult } from "./company.types";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const visibilitySchema = z.enum(["public", "members_only", "private"]);
const statusSchema = z.enum(["draft", "active", "suspended", "archived"]);
const roleSchema = z.enum(["owner", "admin", "manager", "member", "viewer"]);

const companyWriteShape = {
  name: z.string().trim().min(1).max(200),
  slug: z.string().max(120).nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  coverUrl: z.string().max(500).nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  size: z.string().max(60).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  website: z.string().max(300).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  visibility: visibilitySchema.optional(),
  status: statusSchema.optional(),
};

export const createCompanyFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object(companyWriteShape).parse(d))
  .handler(({ data, context }) => CompanyService.create(getDb(context), context.userId, data));

export const updateCompanyFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), ...companyWriteShape })
      .partial({ name: true })
      .parse(d),
  )
  .handler(({ data, context }) => {
    const { id, ...patch } = data;
    return CompanyService.update(getDb(context), context.userId, id, patch);
  });

export const deleteCompanyFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(({ data, context }) => CompanyService.delete(getDb(context), context.userId, data.id));

export const getCompanyFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(({ data, context }) => CompanyService.get(getDb(context), data.id));

export const listCompaniesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(({ context }) => CompanyService.list(getDb(context), context.userId));

export const listVisibleCompaniesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(({ context }) => CompanyService.listVisible(getDb(context)));

// Public projection by slug (no auth). Builds the anon publishable client.
export const getPublicCompanyFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<PublicCompanyResult> => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return CompanyService.getPublic(supabase, data.slug);
  });

// ---- membership ----
export const inviteCompanyMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        companyId: z.string().uuid(),
        email: z.string().email().max(200).nullable().optional(),
        userId: z.string().uuid().nullable().optional(),
        role: roleSchema.optional(),
      })
      .parse(d),
  )
  .handler(({ data, context }) =>
    CompanyService.inviteMember(getDb(context), context.userId, data),
  );

export const listCompanyMembersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(({ data, context }) => CompanyService.listMembers(getDb(context), data.companyId));

export const removeCompanyMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(({ data, context }) =>
    CompanyService.removeMember(getDb(context), context.userId, data.id),
  );
