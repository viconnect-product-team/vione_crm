// CompanyService — the single home for Company (Organization) logic (BC-2.7).
// Orchestrates CompanyRepository + mappers; enforces invariants (owner =
// auth.uid(), valid visibility/status/role, unique slug). A Company is a
// first-class Platform entity.
//
// It does NOT merge Companies into Associations, reuse Association/Marketplace
// schema, duplicate the Business Profile, rewrite BusinessCardService, or
// implement CRM/Marketplace/Community/Messaging/Networking.
//
// Statically imports NO *.server module, so it is safe to import from
// *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import { CompanyRepository } from "./company.repository";
import {
  mapRowToCompany,
  mapRowToCompanyMember,
  mapToPublicCompany,
  slugifyCompany,
} from "./company.mappers";
import {
  COMPANY_ERR,
  COMPANY_MEMBER_ROLES,
  COMPANY_STATUSES,
  COMPANY_VISIBILITIES,
  type Company,
  type CompanyMember,
  type CompanyMemberRole,
  type CreateCompanyInput,
  type InviteMemberInput,
  type PublicCompanyResult,
  type UpdateCompanyInput,
} from "./company.types";

function str(v: string | null | undefined, max: number): string | null {
  return v?.trim() ? v.trim().slice(0, max) : null;
}

function reqStr(v: string, max: number): string {
  const s = (v ?? "").trim().slice(0, max);
  if (!s) throw new Error("Company name is required");
  return s;
}

function validVisibility(v: string | undefined) {
  if (v && !COMPANY_VISIBILITIES.includes(v as never))
    throw new Error(COMPANY_ERR.INVALID_VISIBILITY);
  return (v as (typeof COMPANY_VISIBILITIES)[number]) ?? "public";
}

function validStatus(v: string | undefined) {
  if (v && !COMPANY_STATUSES.includes(v as never)) throw new Error(COMPANY_ERR.INVALID_STATUS);
  return (v as (typeof COMPANY_STATUSES)[number]) ?? "active";
}

function validRole(v: string | undefined): CompanyMemberRole {
  if (v && !COMPANY_MEMBER_ROLES.includes(v as never)) throw new Error(COMPANY_ERR.INVALID_ROLE);
  return (v as CompanyMemberRole) ?? "member";
}

async function uniqueSlug(
  supabase: SupabaseClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugifyCompany(base) || "company";
  let candidate = root;
  for (let i = 0; i < 50; i++) {
    const existing = await CompanyRepository.findBySlug(supabase, candidate);
    if (!existing || (excludeId && (existing.id as string) === excludeId)) return candidate;
    candidate = `${root}-${i + 2}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export const CompanyService = {
  /** Create a company. The caller becomes owner + an active owner member. */
  async create(
    supabase: SupabaseClient,
    userId: string,
    input: CreateCompanyInput,
  ): Promise<Company> {
    const name = reqStr(input.name, 200);
    const slug = await uniqueSlug(supabase, input.slug || name);
    const row = await CompanyRepository.insert(supabase, {
      owner_user_id: userId,
      name,
      slug,
      logo_url: str(input.logoUrl, 500),
      cover_url: str(input.coverUrl, 500),
      industry: str(input.industry, 120),
      size: str(input.size, 60),
      country: str(input.country, 120),
      city: str(input.city, 120),
      website: str(input.website, 300),
      email: str(input.email, 200),
      phone: str(input.phone, 60),
      description: str(input.description, 4000),
      visibility: validVisibility(input.visibility),
      status: validStatus(input.status),
    });
    const company = mapRowToCompany(row);
    // Owner membership (best-effort; RLS allows the owner to add members).
    try {
      await CompanyRepository.insertMember(supabase, {
        company_id: company.id,
        user_id: userId,
        role: "owner",
        status: "active",
      });
    } catch {
      /* owner is always resolvable via owner_user_id; roster row is convenience */
    }
    return company;
  },

  /** Patch a company the caller owns. */
  async update(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    patch: UpdateCompanyInput,
  ): Promise<Company> {
    const p: Record<string, unknown> = {};
    if (patch.name !== undefined) p.name = reqStr(patch.name, 200);
    if (patch.slug !== undefined && patch.slug) p.slug = await uniqueSlug(supabase, patch.slug, id);
    if (patch.logoUrl !== undefined) p.logo_url = str(patch.logoUrl, 500);
    if (patch.coverUrl !== undefined) p.cover_url = str(patch.coverUrl, 500);
    if (patch.industry !== undefined) p.industry = str(patch.industry, 120);
    if (patch.size !== undefined) p.size = str(patch.size, 60);
    if (patch.country !== undefined) p.country = str(patch.country, 120);
    if (patch.city !== undefined) p.city = str(patch.city, 120);
    if (patch.website !== undefined) p.website = str(patch.website, 300);
    if (patch.email !== undefined) p.email = str(patch.email, 200);
    if (patch.phone !== undefined) p.phone = str(patch.phone, 60);
    if (patch.description !== undefined) p.description = str(patch.description, 4000);
    if (patch.visibility !== undefined) p.visibility = validVisibility(patch.visibility);
    if (patch.status !== undefined) p.status = validStatus(patch.status);
    const row = await CompanyRepository.update(supabase, id, p);
    if (!row) throw new Error(COMPANY_ERR.NOT_FOUND);
    return mapRowToCompany(row);
  },

  /** Delete a company the caller owns. */
  async delete(
    supabase: SupabaseClient,
    _userId: string,
    id: string,
  ): Promise<{ removed: boolean }> {
    const n = await CompanyRepository.deleteById(supabase, id);
    return { removed: n > 0 };
  },

  /** One company by id (RLS-scoped). */
  async get(supabase: SupabaseClient, id: string): Promise<Company> {
    const row = await CompanyRepository.findById(supabase, id);
    if (!row) throw new Error(COMPANY_ERR.NOT_FOUND);
    return mapRowToCompany(row);
  },

  /** Companies owned by the caller (newest first). */
  async list(supabase: SupabaseClient, userId: string): Promise<Company[]> {
    const rows = await CompanyRepository.listByOwner(supabase, userId);
    return rows.map(mapRowToCompany);
  },

  /** All companies the caller can see (owned + member + public). */
  async listVisible(supabase: SupabaseClient): Promise<Company[]> {
    const rows = await CompanyRepository.listVisible(supabase);
    return rows.map(mapRowToCompany);
  },

  /**
   * Public company projection by slug. Uses the anon/publishable client; the
   * public SELECT policy already restricts rows to visibility='public' AND
   * status='active', so a missing row → not_found.
   */
  async getPublic(supabase: SupabaseClient, slug: string): Promise<PublicCompanyResult> {
    const clean = slugifyCompany(slug);
    const row = await CompanyRepository.findBySlug(supabase, clean);
    if (!row) return { state: "not_found" };
    return { state: "public", company: mapToPublicCompany(row) };
  },

  // ---- membership ----

  /** Invite/add a member to a company the caller manages (owner/admin). */
  async inviteMember(
    supabase: SupabaseClient,
    userId: string,
    input: InviteMemberInput,
  ): Promise<CompanyMember> {
    if (!input.userId && !input.email) throw new Error(COMPANY_ERR.INVITE_TARGET_REQUIRED);
    const row = await CompanyRepository.insertMember(supabase, {
      company_id: input.companyId,
      user_id: input.userId ?? null,
      email: str(input.email, 200),
      role: validRole(input.role),
      status: input.userId ? "active" : "invited",
      invited_by: userId,
    });
    return mapRowToCompanyMember(row);
  },

  /** List members of a company the caller can see. */
  async listMembers(supabase: SupabaseClient, companyId: string): Promise<CompanyMember[]> {
    const rows = await CompanyRepository.listMembers(supabase, companyId);
    return rows.map(mapRowToCompanyMember);
  },

  /** Remove a membership row (managers only, enforced by RLS). */
  async removeMember(
    supabase: SupabaseClient,
    _userId: string,
    id: string,
  ): Promise<{ removed: boolean }> {
    const n = await CompanyRepository.deleteMember(supabase, id);
    return { removed: n > 0 };
  },
};
