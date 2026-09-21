// Pure row → DTO mapping + slug helper for the company domain.
// No supabase, no window — deterministic and unit-testable.

import {
  COMPANY_MEMBER_ROLES,
  COMPANY_MEMBER_STATUSES,
  COMPANY_STATUSES,
  COMPANY_VISIBILITIES,
  type Company,
  type CompanyMember,
  type CompanyMemberRole,
  type CompanyMemberStatus,
  type CompanyStatus,
  type CompanyVisibility,
  type PublicCompany,
} from "./company.types";

/** Deterministic slug from an arbitrary string (mirrors the DB trigger). */
export function slugifyCompany(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normVisibility(v: unknown): CompanyVisibility {
  return COMPANY_VISIBILITIES.includes(v as CompanyVisibility)
    ? (v as CompanyVisibility)
    : "private";
}

function normStatus(v: unknown): CompanyStatus {
  return COMPANY_STATUSES.includes(v as CompanyStatus) ? (v as CompanyStatus) : "draft";
}

function normRole(v: unknown): CompanyMemberRole {
  return COMPANY_MEMBER_ROLES.includes(v as CompanyMemberRole)
    ? (v as CompanyMemberRole)
    : "member";
}

function normMemberStatus(v: unknown): CompanyMemberStatus {
  return COMPANY_MEMBER_STATUSES.includes(v as CompanyMemberStatus)
    ? (v as CompanyMemberStatus)
    : "active";
}

/** Map a companies row to a Company DTO. */
export function mapRowToCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    ownerUserId: row.owner_user_id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string) ?? null,
    coverUrl: (row.cover_url as string) ?? null,
    industry: (row.industry as string) ?? null,
    size: (row.size as string) ?? null,
    country: (row.country as string) ?? null,
    city: (row.city as string) ?? null,
    website: (row.website as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    description: (row.description as string) ?? null,
    verified: Boolean(row.verified),
    visibility: normVisibility(row.visibility),
    status: normStatus(row.status),
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

/** Project a Company (or row) to its public-safe subset. */
export function mapToPublicCompany(row: Record<string, unknown>): PublicCompany {
  const c = mapRowToCompany(row);
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl,
    coverUrl: c.coverUrl,
    industry: c.industry,
    size: c.size,
    country: c.country,
    city: c.city,
    website: c.website,
    description: c.description,
    verified: c.verified,
  };
}

/** Map a company_members row to a CompanyMember DTO. */
export function mapRowToCompanyMember(row: Record<string, unknown>): CompanyMember {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    userId: (row.user_id as string) ?? null,
    email: (row.email as string) ?? null,
    role: normRole(row.role),
    status: normMemberStatus(row.status),
    invitedBy: (row.invited_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}
