// CompanySDK — the client-facing facade for the Company (Organization) shared
// service (BC-2.7). Product surfaces (Association Hub, Business Connect,
// Community, Enterprise, Meetings, Affiliate, AI, CRM, Marketplace) MUST consume
// the Company domain through this SDK — never by importing the server functions
// or querying companies / company_members directly.
//
// DB-backed verbs delegate to the domain server functions (RPC stubs, safe on
// the client). This is a thin facade; no business logic lives here.
//
// Future compatibility: this SDK is the single integration point future B2B
// networking, CRM, marketplace, community, enterprise, meetings, affiliate, and
// AI graphs build ON. None are implemented here.

import {
  createCompanyFn,
  deleteCompanyFn,
  getCompanyFn,
  getPublicCompanyFn,
  inviteCompanyMemberFn,
  listCompaniesFn,
  listCompanyMembersFn,
  listVisibleCompaniesFn,
  removeCompanyMemberFn,
  updateCompanyFn,
} from "./company.functions";
import type {
  Company,
  CompanyMember,
  CreateCompanyInput,
  InviteMemberInput,
  PublicCompanyResult,
  UpdateCompanyInput,
} from "./company.types";

export const CompanySDK = {
  /** Create a company (owner = auth.uid(), set server-side). */
  createCompany(input: CreateCompanyInput): Promise<Company> {
    return createCompanyFn({ data: input });
  },
  /** Update a company the caller owns. */
  updateCompany(id: string, patch: UpdateCompanyInput): Promise<Company> {
    return updateCompanyFn({ data: { id, ...patch } });
  },
  /** Delete a company the caller owns. */
  deleteCompany(id: string): Promise<{ removed: boolean }> {
    return deleteCompanyFn({ data: { id } });
  },
  /** One company by id (RLS-scoped). */
  getCompany(id: string): Promise<Company> {
    return getCompanyFn({ data: { id } });
  },
  /** Companies owned by the caller. */
  listCompanies(): Promise<Company[]> {
    return listCompaniesFn();
  },
  /** All companies the caller can see (owned + member + public). */
  listVisibleCompanies(): Promise<Company[]> {
    return listVisibleCompaniesFn();
  },
  /** Public company projection by slug (no auth). */
  getPublicCompany(slug: string): Promise<PublicCompanyResult> {
    return getPublicCompanyFn({ data: { slug } });
  },
  /** Invite/add a member to a company the caller manages. */
  inviteMember(input: InviteMemberInput): Promise<CompanyMember> {
    return inviteCompanyMemberFn({ data: input });
  },
  /** List members of a company the caller can see. */
  listMembers(companyId: string): Promise<CompanyMember[]> {
    return listCompanyMembersFn({ data: { companyId } });
  },
  /** Remove a membership row (managers only). */
  removeMember(id: string): Promise<{ removed: boolean }> {
    return removeCompanyMemberFn({ data: { id } });
  },
};
