import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "./api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type DashboardStats = {
  totalMembers: number;
  activeMembers: number;
  newMembers30d: number;
  companies: number;
  individuals: number;
  events: number;
  upcomingEvents: number;
  registrations: number;
  sponsors: number;
  documents: number;
  revenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  pendingRenewals: number;
  openOpportunities: number;
  pendingQuotes: number;
  industries: { key: string; count: number }[];
  regions: { key: string; count: number }[];
  growth: { month: string; count: number }[];
};

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<DashboardStats> => {
    const token = context.token;
    let nestMembers: any[] = [];
    let nestEvents: any[] = [];
    let nestInvoices: any[] = [];
    let nestOpps: any[] = [];
    let nestDocs: any[] = [];
    let nestSponsors: any[] = [];
    let nestTx: any[] = [];

    // 1. Fetch from NestJS REST APIs (direct Postgres database connection)
    try {
      const [membersRes, eventsRes, invoicesRes, oppsRes, docsRes, sponsorsRes, txRes] = await Promise.allSettled([
        fetchNestApiFromServer<any[]>("/members", token),
        fetchNestApiFromServer<any[]>("/events", token),
        fetchNestApiFromServer<any[]>("/admin/invoices", token),
        fetchNestApiFromServer<any>("/connect-app/opportunity", token),
        fetchNestApiFromServer<any[]>("/documents", token),
        fetchNestApiFromServer<any[]>("/sponsors", token),
        fetchNestApiFromServer<any[]>("/admin/transactions", token),
      ]);

      if (membersRes.status === "fulfilled" && Array.isArray(membersRes.value)) {
        nestMembers = membersRes.value;
      }
      if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value)) {
        nestEvents = eventsRes.value;
      }
      if (invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value)) {
        nestInvoices = invoicesRes.value;
      }
      if (oppsRes.status === "fulfilled" && oppsRes.value) {
        nestOpps = Array.isArray(oppsRes.value) ? oppsRes.value : (oppsRes.value.opportunities || []);
      }
      if (docsRes.status === "fulfilled" && Array.isArray(docsRes.value)) {
        nestDocs = docsRes.value;
      }
      if (sponsorsRes.status === "fulfilled" && Array.isArray(sponsorsRes.value)) {
        nestSponsors = sponsorsRes.value;
      }
      if (txRes.status === "fulfilled" && Array.isArray(txRes.value)) {
        nestTx = txRes.value;
      }
    } catch (e) {
      console.warn("[getDashboardStatsFn] Nest API fetch error:", e);
    }

    const now = new Date();
    const days30Time = Date.now() - 30 * 24 * 3600 * 1000;

    // Tally helper
    const tally = (rows: any[], key: string) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const v = r[key];
        if (!v) continue;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([k, c]) => ({ key: k, count: c }))
        .sort((a, b) => b.count - a.count);
    };

    // Calculate growth distribution over last 6 months
    const computeGrowth = (rows: any[]) => {
      const list: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const c = rows.filter((r: any) => {
          const j = r.joinedAt || r.joined_at ? new Date(r.joinedAt || r.joined_at) : null;
          return j && j >= start && j < end;
        }).length;
        list.push({ month: `${d.getMonth() + 1}/${d.getFullYear()}`, count: c });
      }
      return list;
    };

    // Use primary Postgres data from NestJS REST API
    const totalMembers = nestMembers.length;
    const activeMembers = nestMembers.filter((m) => m.status === "active").length;
    const newMembers30d = nestMembers.filter((m) => {
      const d = m.joinedAt ? new Date(m.joinedAt).getTime() : 0;
      return d >= days30Time;
    }).length;
    const companies = nestMembers.filter((m) => m.type === "company").length;
    const individuals = nestMembers.filter((m) => m.type === "individual").length;
    const pendingRenewals = nestMembers.filter((m) => m.status === "expired" || m.status === "pending").length;

    const events = nestEvents.length;
    const upcomingEvents = nestEvents.filter((e) => e.status === "upcoming" || e.status === "ongoing").length;
    const openOpportunities = nestOpps.filter((o) => o.status === "open").length;

    const paidInvoices = nestInvoices.filter((i) => i.status === "paid").length;
    const unpaidInvoices = nestInvoices.filter((i) => i.status !== "paid").length;
    const invoiceRevenue = nestInvoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const txRevenue = nestTx
      .filter((t) => t.type === "income" && t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const revenue = invoiceRevenue + txRevenue;

    const industries = tally(nestMembers, "industry").slice(0, 6);
    const regions = tally(nestMembers, "region");
    const growth = computeGrowth(nestMembers);

    return {
      totalMembers,
      activeMembers,
      newMembers30d,
      companies,
      individuals,
      events,
      upcomingEvents,
      registrations: nestEvents.reduce((acc, ev) => acc + (ev.attendeesCount || ev.attendee_count || 0), 0),
      sponsors: nestSponsors.length,
      documents: nestDocs.length,
      revenue,
      paidInvoices,
      unpaidInvoices,
      pendingRenewals,
      openOpportunities,
      pendingQuotes: 0,
      industries,
      regions,
      growth,
    };
  });
