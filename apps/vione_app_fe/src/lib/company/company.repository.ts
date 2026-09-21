// CompanyRepository — the ONLY module that queries companies / company_members
// directly. Pure data access; authorization is enforced by RLS + explicit
// filters. No DTO shaping beyond typing.

import type { SupabaseClient } from "@supabase/supabase-js";

const COMPANIES = "companies";
const MEMBERS = "company_members";

const COMPANY_SELECT =
  "id, owner_user_id, name, slug, logo_url, cover_url, industry, size, country, city, website, email, phone, description, verified, visibility, status, created_at, updated_at";

const MEMBER_SELECT =
  "id, company_id, user_id, email, role, status, invited_by, created_at, updated_at";

export type CompanyRow = Record<string, unknown>;

export const CompanyRepository = {
  async insert(supabase: SupabaseClient, row: CompanyRow): Promise<CompanyRow> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .insert(row as never)
      .select(COMPANY_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as CompanyRow;
  },

  async findById(supabase: SupabaseClient, id: string): Promise<CompanyRow | null> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .select(COMPANY_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as CompanyRow | null;
  },

  async findBySlug(supabase: SupabaseClient, slug: string): Promise<CompanyRow | null> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .select(COMPANY_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as CompanyRow | null;
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    patch: CompanyRow,
  ): Promise<CompanyRow | null> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .update(patch as never)
      .eq("id", id)
      .select(COMPANY_SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as CompanyRow | null;
  },

  async deleteById(supabase: SupabaseClient, id: string): Promise<number> {
    const { data, error } = await supabase.from(COMPANIES).delete().eq("id", id).select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },

  /** Companies owned by the caller (newest first). */
  async listByOwner(
    supabase: SupabaseClient,
    ownerUserId: string,
    limit = 200,
  ): Promise<CompanyRow[]> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .select(COMPANY_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as CompanyRow[];
  },

  /** Companies the caller can currently see (RLS-scoped: owned + member + public). */
  async listVisible(supabase: SupabaseClient, limit = 200): Promise<CompanyRow[]> {
    const { data, error } = await supabase
      .from(COMPANIES)
      .select(COMPANY_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as CompanyRow[];
  },

  // ---- members ----
  async insertMember(supabase: SupabaseClient, row: CompanyRow): Promise<CompanyRow> {
    const { data, error } = await supabase
      .from(MEMBERS)
      .insert(row as never)
      .select(MEMBER_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as CompanyRow;
  },

  async listMembers(
    supabase: SupabaseClient,
    companyId: string,
    limit = 500,
  ): Promise<CompanyRow[]> {
    const { data, error } = await supabase
      .from(MEMBERS)
      .select(MEMBER_SELECT)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as CompanyRow[];
  },

  async deleteMember(supabase: SupabaseClient, id: string): Promise<number> {
    const { data, error } = await supabase.from(MEMBERS).delete().eq("id", id).select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },
};
