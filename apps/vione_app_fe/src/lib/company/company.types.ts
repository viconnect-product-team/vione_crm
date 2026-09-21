// BC-2.7 — Organization & Company Platform.
//
// A Company is a FIRST-CLASS Platform entity. People belong to Companies via
// company_members; a Business Profile may optionally represent a Company (via
// the relationship/interaction company_id references — additive, never merged).
//
// This layer introduces the Company entity + membership ONLY. It does NOT
// implement CRM, Marketplace, Community, Messaging, or Networking. It does NOT
// merge Companies into Associations, reuse Association/Marketplace schema, or
// duplicate the Business Profile. Downstream phases (B2B networking, CRM,
// marketplace, community, enterprise, meetings, affiliate, AI) build ON these
// primitives; none are implemented here.

/** Company visibility for its public profile. */
export type CompanyVisibility = "public" | "members_only" | "private";

export const COMPANY_VISIBILITIES: CompanyVisibility[] = ["public", "members_only", "private"];

/** Lifecycle status of a company. */
export type CompanyStatus = "draft" | "active" | "suspended" | "archived";

export const COMPANY_STATUSES: CompanyStatus[] = ["draft", "active", "suspended", "archived"];

/** Role of a person within a company. Invitation-ready. */
export type CompanyMemberRole = "owner" | "admin" | "manager" | "member" | "viewer";

export const COMPANY_MEMBER_ROLES: CompanyMemberRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
];

/** Membership status (invitation-ready). */
export type CompanyMemberStatus = "active" | "invited";

export const COMPANY_MEMBER_STATUSES: CompanyMemberStatus[] = ["active", "invited"];

/** A first-class company entity. */
export type Company = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  industry: string | null;
  size: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  verified: boolean;
  visibility: CompanyVisibility;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
};

/** Public projection of a company (safe columns only). */
export type PublicCompany = Pick<
  Company,
  | "id"
  | "name"
  | "slug"
  | "logoUrl"
  | "coverUrl"
  | "industry"
  | "size"
  | "country"
  | "city"
  | "website"
  | "description"
  | "verified"
>;

/** Public fetch result (mirrors the business-card public result shape). */
export type PublicCompanyResult =
  | { state: "public"; company: PublicCompany }
  | { state: "not_found" };

/** A company membership edge. */
export type CompanyMember = {
  id: string;
  companyId: string;
  userId: string | null;
  email: string | null;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Input to create a company (owner is set server-side from auth.uid()). */
export type CreateCompanyInput = {
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  country?: string | null;
  city?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  visibility?: CompanyVisibility;
  status?: CompanyStatus;
};

/** Patch for an existing company. Only provided keys change. */
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

/** Input to invite/add a company member. */
export type InviteMemberInput = {
  companyId: string;
  email?: string | null;
  userId?: string | null;
  role?: CompanyMemberRole;
};

export const COMPANY_ERR = {
  NOT_FOUND: "COMPANY_NOT_FOUND",
  FORBIDDEN: "COMPANY_FORBIDDEN",
  INVALID_VISIBILITY: "COMPANY_INVALID_VISIBILITY",
  INVALID_STATUS: "COMPANY_INVALID_STATUS",
  INVALID_ROLE: "COMPANY_INVALID_ROLE",
  SLUG_TAKEN: "COMPANY_SLUG_TAKEN",
  INVITE_TARGET_REQUIRED: "COMPANY_INVITE_TARGET_REQUIRED",
} as const;
