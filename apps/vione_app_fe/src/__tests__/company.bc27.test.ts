// BC-2.7 — Company (Organization) Platform tests.
//
// Covers: pure mapping, slug determinism, public projection privacy (no
// email/phone/owner exposed), and CompanyService orchestration (create,
// unique slug, invite membership, public/not_found) via a mocked repository.
// No CRM/Marketplace/Community/Messaging/Networking is exercised.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/company/company.repository", () => ({
  CompanyRepository: {
    insert: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
    listByOwner: vi.fn(),
    listVisible: vi.fn(),
    insertMember: vi.fn(),
    listMembers: vi.fn(),
    deleteMember: vi.fn(),
  },
}));

import {
  mapRowToCompany,
  mapToPublicCompany,
  slugifyCompany,
  mapRowToCompanyMember,
} from "@/lib/company/company.mappers";
import { CompanyService } from "@/lib/company/company.service";
import { CompanyRepository } from "@/lib/company/company.repository";

const repo = CompanyRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const fakeSb = {} as never;

function row(over: Record<string, unknown> = {}) {
  return {
    id: "c1",
    owner_user_id: "u1",
    name: "Acme Corp",
    slug: "acme-corp",
    logo_url: null,
    cover_url: null,
    industry: "Software",
    size: "11-50",
    country: "VN",
    city: "Ha Noi",
    website: "acme.com",
    email: "hi@acme.com",
    phone: "0900",
    description: "We build things.",
    verified: true,
    visibility: "public",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  for (const k of Object.keys(repo)) repo[k].mockReset();
});

describe("slugifyCompany", () => {
  it("is deterministic and diacritic-safe", () => {
    expect(slugifyCompany("Công ty Đại Việt")).toBe("cong-ty-dai-viet");
    expect(slugifyCompany("  Acme  Corp!! ")).toBe("acme-corp");
    expect(slugifyCompany("Acme Corp")).toBe(slugifyCompany("Acme Corp"));
  });
});

describe("mappers", () => {
  it("maps a row to a Company DTO", () => {
    const c = mapRowToCompany(row());
    expect(c).toMatchObject({ id: "c1", ownerUserId: "u1", verified: true, visibility: "public" });
  });

  it("public projection hides email, phone and owner", () => {
    const pub = mapToPublicCompany(row()) as Record<string, unknown>;
    expect(pub.email).toBeUndefined();
    expect(pub.phone).toBeUndefined();
    expect(pub.ownerUserId).toBeUndefined();
    expect(pub.name).toBe("Acme Corp");
  });

  it("normalizes invalid member role/status to safe defaults", () => {
    const m = mapRowToCompanyMember({
      id: "m1",
      company_id: "c1",
      user_id: "u2",
      role: "hacker",
      status: "bogus",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(m.role).toBe("member");
    expect(m.status).toBe("active");
  });
});

describe("CompanyService.create", () => {
  it("assigns caller as owner and generates a unique slug", async () => {
    repo.findBySlug.mockResolvedValue(null);
    repo.insert.mockResolvedValue(row());
    repo.insertMember.mockResolvedValue(row());
    const c = await CompanyService.create(fakeSb, "u1", { name: "Acme Corp" });
    expect(repo.insert).toHaveBeenCalledWith(
      fakeSb,
      expect.objectContaining({ owner_user_id: "u1", slug: "acme-corp" }),
    );
    expect(repo.insertMember).toHaveBeenCalledWith(
      fakeSb,
      expect.objectContaining({ company_id: "c1", user_id: "u1", role: "owner", status: "active" }),
    );
    expect(c.ownerUserId).toBe("u1");
  });

  it("suffixes the slug when the base is taken", async () => {
    repo.findBySlug.mockResolvedValueOnce(row()).mockResolvedValue(null);
    repo.insert.mockResolvedValue(row({ slug: "acme-corp-2" }));
    repo.insertMember.mockResolvedValue(row());
    await CompanyService.create(fakeSb, "u1", { name: "Acme Corp" });
    expect(repo.insert).toHaveBeenCalledWith(
      fakeSb,
      expect.objectContaining({ slug: "acme-corp-2" }),
    );
  });

  it("rejects an empty name", async () => {
    await expect(CompanyService.create(fakeSb, "u1", { name: "  " })).rejects.toThrow();
  });
});

describe("CompanyService.getPublic", () => {
  it("returns public projection for a resolvable slug", async () => {
    repo.findBySlug.mockResolvedValue(row());
    const res = await CompanyService.getPublic(fakeSb, "Acme Corp");
    expect(res.state).toBe("public");
    if (res.state === "public") expect(res.company.name).toBe("Acme Corp");
  });

  it("returns not_found when the row is hidden by RLS", async () => {
    repo.findBySlug.mockResolvedValue(null);
    const res = await CompanyService.getPublic(fakeSb, "missing");
    expect(res.state).toBe("not_found");
  });
});

describe("CompanyService.inviteMember", () => {
  it("requires either a userId or email", async () => {
    await expect(CompanyService.inviteMember(fakeSb, "u1", { companyId: "c1" })).rejects.toThrow();
  });

  it("marks email-only invites as invited", async () => {
    repo.insertMember.mockResolvedValue({
      id: "m1",
      company_id: "c1",
      email: "new@x.com",
      role: "member",
      status: "invited",
      created_at: "2026-01-01T00:00:00Z",
    });
    const m = await CompanyService.inviteMember(fakeSb, "u1", {
      companyId: "c1",
      email: "new@x.com",
    });
    expect(m.status).toBe("invited");
    expect(repo.insertMember).toHaveBeenCalledWith(
      fakeSb,
      expect.objectContaining({ status: "invited", invited_by: "u1" }),
    );
  });
});
