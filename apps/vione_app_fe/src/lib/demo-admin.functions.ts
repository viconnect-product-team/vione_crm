import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { z } from "zod";

export const DEMO_LEAD_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type DemoLeadStatus = (typeof DEMO_LEAD_STATUSES)[number];

export type DemoLead = {
  id: string;
  name: string;
  email: string;
  organization: string;
  phone: string | null;
  jobTitle: string | null;
  preferredDate: string | null;
  preferredSlot: string | null;
  timezone: string | null;
  notes: string | null;
  locale: string | null;
  status: DemoLeadStatus;
  adminNotes: string | null;
  statusChangedAt: string | null;
  createdAt: string;
};

const listInput = z.object({
  status: z.string().optional(),
  search: z.string().max(200).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const updateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(DEMO_LEAD_STATUSES).optional(),
  adminNotes: z.string().max(2000).nullable().optional(),
});

type Row = {
  id: string;
  name: string;
  email: string;
  organization: string;
  phone: string | null;
  job_title: string | null;
  preferred_date: string | null;
  preferred_slot: string | null;
  timezone: string | null;
  notes: string | null;
  locale: string | null;
  status: string;
  admin_notes: string | null;
  status_changed_at: string | null;
  created_at: string;
};

function toDto(r: Row): DemoLead {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    organization: r.organization,
    phone: r.phone,
    jobTitle: r.job_title,
    preferredDate: r.preferred_date,
    preferredSlot: r.preferred_slot ? String(r.preferred_slot).slice(0, 5) : null,
    timezone: r.timezone,
    notes: r.notes,
    locale: r.locale,
    status: (DEMO_LEAD_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as DemoLeadStatus)
      : "new",
    adminNotes: r.admin_notes,
    statusChangedAt: r.status_changed_at,
    createdAt: r.created_at,
  };
}

const SELECT =
  "id, name, email, organization, phone, job_title, preferred_date, preferred_slot, timezone, notes, locale, status, admin_notes, status_changed_at, created_at";

import { fetchNestApiFromServer } from "@/lib/api-client";

/** Admin-only: list demo booking leads. */
export const listDemoLeads = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { token } = context as any;
    try {
      const qs = new URLSearchParams();
      if (data.status && data.status !== "all") qs.set("status", data.status);
      if (data.from) qs.set("from", data.from);
      if (data.to) qs.set("to", data.to);
      if (data.search?.trim()) qs.set("search", data.search.trim());

      const url = `/admin/demo-leads${qs.toString() ? `?${qs.toString()}` : ""}`;
      return await fetchNestApiFromServer(url, token);
    } catch (err) {
      console.error("listDemoLeads failed:", err);
      return { leads: [], counts: { all: 0, new: 0, contacted: 0, scheduled: 0, completed: 0, cancelled: 0 } };
    }
  });

/** Admin-only: update a lead's status and/or internal notes. */
export const updateDemoLead = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/admin/demo-leads/${data.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        status: data.status,
        adminNotes: data.adminNotes,
      }),
    });
  });

/* ------------------------------------------------------------------ */
/* CTA attribution analytics                                           */
/* ------------------------------------------------------------------ */

export type CtaBucket = {
  key: string;
  total: number;
  contacted: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  /** completed / total */
  conversionRate: number;
  /** (contacted+scheduled+completed) / total */
  engagementRate: number;
  lastAt: string | null;
};

export type CtaFunnel = {
  totals: {
    total: number;
    contacted: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    conversionRate: number;
  };
  bySource: CtaBucket[];
  byIntent: CtaBucket[];
  matrix: { source: string; intent: string; total: number; completed: number }[];
  daily: { date: string; total: number; completed: number }[];
};

const funnelInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Admin-only: CTA source/intent attribution funnel for landing page leads. */
export const getCtaFunnel = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => funnelInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<CtaFunnel> => {
    return {
      totals: {
        total: 0,
        contacted: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        conversionRate: 0,
      },
      bySource: [],
      byIntent: [],
      matrix: [],
      daily: [],
    };
  });

