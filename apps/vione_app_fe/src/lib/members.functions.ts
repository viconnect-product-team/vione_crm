/**
 * members.functions.ts
 * Server functions cho quản lý hội viên — chỉ dùng NestJS REST API, không dùng Supabase.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Member } from "./members-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

// ── Schemas ────────────────────────────────────────────────────────────────────

const MemberWriteSchema = z.object({
  name: z.string().min(1).max(255),
  contact: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  phone: z.string().max(64).optional(),
  type: z.enum(["company", "individual"]).default("company"),
  level: z
    .enum([
      "memberLevel.large",
      "memberLevel.medium",
      "memberLevel.small",
      "memberLevel.individual",
    ])
    .default("memberLevel.medium"),
  industry: z
    .enum(["ind.trade", "ind.it", "ind.manufacturing", "ind.realestate", "ind.finance"])
    .default("ind.trade"),
  region: z.enum(["region.north", "region.central", "region.south"]).default("region.north"),
  status: z.enum(["active", "pending", "expired"]).default("pending"),
  address: z.string().max(500).optional(),
  website: z.string().max(255).optional(),
  taxCode: z.string().max(64).optional(),
  employees: z.coerce.number().int().nonnegative().optional(),
  about: z.string().max(2000).optional(),
});

const IdSchema = z.object({ id: z.string().min(1).max(64) });

// ── Row mapper ─────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function mapRow(r: Row): Member {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    contact: (r.contact as string) ?? "",
    email: (r.email as string) ?? "",
    phone: (r.phone as string) ?? "",
    type: r.type as Member["type"],
    level: r.level as Member["level"],
    industry: r.industry as Member["industry"],
    region: r.region as Member["region"],
    status: r.status as Member["status"],
    joinedAt: (r.joined_at || r.joinedAt || r.created_at || r.createdAt) as string,
    createdAt: (r.created_at || r.createdAt || r.joined_at || r.joinedAt) as string,
    feeYear: r.fee_year as number,
    feePaid: r.fee_paid as boolean,
    address: (r.address as string) ?? "",
    website: (r.website as string) ?? undefined,
    taxCode: (r.tax_code as string) ?? undefined,
    employees: (r.employees as number) ?? undefined,
    about: (r.about as string) ?? "",
    termEnd: (r.term_end as string) ?? undefined,
    reminderCount: (r.reminder_count as number) ?? 0,
    lastReminder: (r.last_reminder as string) ?? undefined,
    renewedAt: (r.renewed_at as string) ?? undefined,
    newTermEnd: (r.new_term_end as string) ?? undefined,
  };
}

// ── Server functions ───────────────────────────────────────────────────────────

/** GET /api/members — Danh sách hội viên */
export const listMembersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    return fetchNestApiFromServer("/members", context.token);
  });

/**
 * Danh sách đồng nghiệp (peer list) — gọi endpoint directory
 * không cần thông tin nhạy cảm.
 */
export const listPeersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Member[]> => {
    const data = await fetchNestApiFromServer("/members/directory", context.token);
    return Array.isArray(data) ? data.map((r: Row) => ({
      id: r.id as string,
      code: (r.code as string) ?? "",
      name: r.name as string,
      contact: "",
      email: "",
      phone: "",
      type: (r.type as Member["type"]) ?? "company",
      level: (r.level as Member["level"]) ?? "memberLevel.medium",
      industry: (r.industry as Member["industry"]) ?? "ind.trade",
      region: (r.region as Member["region"]) ?? "region.north",
      status: (r.status as Member["status"]) ?? "active",
      joinedAt: "",
      feeYear: new Date().getFullYear(),
      feePaid: false,
      address: "",
      about: "",
    })) : [];
  });

/** POST /api/members — Tạo hội viên mới */
export const createMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => MemberWriteSchema.parse(d))
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer("/members", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

/** GET /api/members/:id — Chi tiết hội viên */
export const getMemberFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/members/${encodeURIComponent(data.id)}`, context.token);
  });

/** PUT /api/members/:id — Cập nhật hội viên */
export const updateMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1).max(64) }).merge(MemberWriteSchema.partial()).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    return fetchNestApiFromServer(`/members/${encodeURIComponent(id)}`, context.token, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
  });

/** DELETE /api/members/:id — Xóa hội viên */
export const deleteMemberFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/members/${encodeURIComponent(data.id)}`, context.token, {
      method: "DELETE",
    });
  });

/** PATCH /api/members/:id/contact — Cập nhật thông tin liên hệ */
export const updateMemberContactFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(64),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(64).optional(),
        address: z.string().max(500).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    return fetchNestApiFromServer(`/members/${encodeURIComponent(id)}/contact`, context.token, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  });

/** PATCH /api/members/:id/renew — Gia hạn hội viên thêm 1 năm */
export const renewMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/members/${encodeURIComponent(data.id)}/renew`, context.token, {
      method: "PATCH",
    });
  });

/** PATCH /api/members/:id/remind — Gửi nhắc nhở gia hạn */
export const sendRenewalReminderFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    return fetchNestApiFromServer(`/members/${encodeURIComponent(data.id)}/remind`, context.token, {
      method: "PATCH",
    });
  });

const RoleAndDeptSchema = z.object({
  memberId: z.string().min(1),
  executiveRole: z.string().min(1),
  department: z.string().min(1),
  associationId: z.string().optional(),
});

/** Cập nhật vai trò ban điều hành & phòng ban */
export const updateMemberRoleAndDeptFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => RoleAndDeptSchema.parse(d))
  .handler(async ({ data, context }) => {
    const token = (context as any)?.token;
    try {
      const res = await fetchNestApiFromServer<any>(`/members/${data.memberId}/role-dept`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (res && res.ok) {
        return { ok: true };
      }
    } catch (e) {
      console.warn("Fallback to direct db update for role-dept:", e);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    
    // Update members
    await admin
      .from("members")
      .update({
        executive_role: data.executiveRole,
        department: data.department,
      })
      .eq("id", data.memberId);

    // Update memberships & user_roles
    const { data: m } = await admin
      .from("members")
      .select("user_id")
      .eq("id", data.memberId)
      .maybeSingle();

    if (m?.user_id) {
      const sysRole = (data.executiveRole === 'president' || data.executiveRole === 'vice_president' || data.executiveRole === 'secretary') ? 'admin' : 'member';
      await admin
        .from("memberships")
        .update({
          executive_role: data.executiveRole,
          department: data.department,
          role: sysRole,
        })
        .eq("user_id", m.user_id);

      await admin
        .from("user_roles")
        .upsert({
          user_id: m.user_id,
          role: sysRole,
        }, { onConflict: "user_id" });
    }

    return { ok: true };
  });
