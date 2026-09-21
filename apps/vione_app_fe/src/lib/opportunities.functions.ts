import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveMemberId } from "./current-member";
import type { Opportunity, OpportunityInterest, OpportunityTypeKey } from "./opportunities-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "./api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

type Row = Record<string, unknown>;

const TYPE_VALUES = [
  "opp.type.partnership",
  "opp.type.investment",
  "opp.type.supply",
  "opp.type.demand",
  "opp.type.distribution",
  "opp.type.other",
] as const;

function mapOpportunity(r: Row): Opportunity {
  return {
    id: r.id as string,
    posterId: (r.poster_id || r.posterId) as string,
    posterName: (r.poster_name || r.posterName) as string ?? undefined,
    posterAvatar: (r.poster_avatar || r.posterAvatar) as string ?? undefined,
    title: r.title as string,
    description: ((r.description as string) ?? ""),
    type: (r.type as OpportunityTypeKey) ?? "opp.type.partnership",
    budgetMin: r.budget_min != null ? Number(r.budget_min) : r.budgetMin != null ? Number(r.budgetMin) : undefined,
    budgetMax: r.budget_max != null ? Number(r.budget_max) : r.budgetMax != null ? Number(r.budgetMax) : undefined,
    region: ((r.region as string) ?? ""),
    industry: ((r.industry as string) ?? ""),
    deadline: (r.deadline as string) ?? new Date().toISOString(),
    status: (r.status as Opportunity["status"]) ?? "open",
    createdAt: (r.created_at || r.createdAt) as string,
    views: ((r.views as number) ?? 0),
    emoji: (r.emoji as string) ?? "💡",
    contactName: (r.contact_name || r.contactName) as string ?? undefined,
    contactPhone: (r.contact_phone || r.contactPhone) as string ?? undefined,
    contactTitle: (r.contact_title || r.contactTitle) as string ?? undefined,
    company: (r.company) as string ?? undefined,
    image: (r.image || r.image_url || r.imageUrl) as string ?? undefined,
    claimedById: (r.claimed_by_id || r.claimedById) as string ?? undefined,
    claimedByName: (r.claimed_by_name || r.claimedByName) as string ?? undefined,
    claimedAt: (r.claimed_at || r.claimedAt) as string ?? undefined,
    claimedPhone: (r.claimed_phone || r.claimedPhone) as string ?? undefined,
    claimedCompany: (r.claimed_company || r.claimedCompany) as string ?? undefined,
  };
}

function mapInterest(r: Row): OpportunityInterest {
  return {
    id: r.id as string,
    opportunityId: (r.opportunity_id || r.opportunityId) as string,
    memberId: (r.member_id || r.memberId) as string,
    message: ((r.message as string) ?? ""),
    contact: ((r.contact as string) ?? ""),
    createdAt: (r.created_at || r.createdAt) as string,
  };
}

export const listOpportunitiesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      opportunities: Opportunity[];
      interests: OpportunityInterest[];
      interestCounts: Record<string, number>;
    }> => {
      const token = (context as any)?.token;
      try {
        const res = await fetchNestApiFromServer<{
          opportunities: Opportunity[];
          interests: OpportunityInterest[];
          interestCounts: Record<string, number>;
        }>("/opportunities", token);
        if (res && res.opportunities) {
          return {
            opportunities: res.opportunities.map((r: any) => mapOpportunity(r as Row)),
            interests: (res.interests || []).map((r: any) => mapInterest(r as Row)),
            interestCounts: res.interestCounts || {},
          };
        }
      } catch (err) {
        console.warn("NestJS /opportunities fetch failed, falling back to db:", err);
      }

      // Fallback
      const [opps, interests] = await Promise.all([
        getDb(context)
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false }),
        getDb(context)
          .from("opportunity_interests")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      const mappedInterests = (interests.data ?? []).map((r: any) => mapInterest(r as Row));
      const interestCounts: Record<string, number> = {};
      for (const it of mappedInterests) {
        interestCounts[it.opportunityId] = (interestCounts[it.opportunityId] ?? 0) + 1;
      }
      return {
        opportunities: (opps.data ?? []).map((r: any) => mapOpportunity(r as Row)),
        interests: mappedInterests,
        interestCounts,
      };
    },
  );

export const getOpportunityFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ opportunity: Opportunity; interests: OpportunityInterest[] } | null> => {
      const token = (context as any)?.token;
      try {
        const res = await fetchNestApiFromServer<{
          opportunity: Opportunity;
          interests: OpportunityInterest[];
        }>(`/opportunities/${encodeURIComponent(data.id)}`, token);
        if (res && res.opportunity) {
          return {
            opportunity: mapOpportunity(res.opportunity as any),
            interests: (res.interests || []).map((i: any) => mapInterest(i as any)),
          };
        }
      } catch (err) {
        console.warn("NestJS /opportunities/:id fetch failed, falling back to db:", err);
      }

      // Fallback
      const { data: row, error } = await getDb(context)
        .from("opportunities")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (error || !row) return null;
      const { data: interests } = await getDb(context)
        .from("opportunity_interests")
        .select("*")
        .eq("opportunity_id", data.id)
        .order("created_at", { ascending: false });
      return {
        opportunity: mapOpportunity(row as Row),
        interests: (interests ?? []).map((i: any) => mapInterest(i as Row)),
      };
    },
  );

export const createOpportunityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(300),
        description: z.string().min(1).max(4000),
        type: z.enum(TYPE_VALUES),
        budgetMin: z.number().min(0).max(1e15).optional(),
        budgetMax: z.number().min(0).max(1e15).optional(),
        region: z.string().min(1).max(200),
        industry: z.string().min(1).max(200),
        deadline: z.string().min(1).max(64),
        emoji: z.string().min(1).max(16).optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactTitle: z.string().optional(),
        company: z.string().optional(),
        image: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<Opportunity> => {
    const token = (context as any)?.token;
    try {
      const res = await fetchNestApiFromServer<{ ok: boolean; id: string }>("/opportunities", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res && res.id) {
        return mapOpportunity({ id: res.id, ...data } as any);
      }
    } catch (err) {
      console.warn("NestJS create opportunity failed:", err);
    }

    // Fallback
    const id = `o-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const memberId = await resolveMemberId(token);
    const { data: row, error } = await getDb(context)
      .from("opportunities")
      .insert({
        id,
        poster_id: memberId,
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.type,
        budget_min: data.budgetMin ?? null,
        budget_max: data.budgetMax ?? null,
        region: data.region.trim(),
        industry: data.industry.trim(),
        deadline: data.deadline,
        status: "open",
        views: 0,
        emoji: data.emoji ?? "💡",
        contact_name: data.contactName?.trim() || null,
        contact_phone: data.contactPhone?.trim() || null,
        contact_title: data.contactTitle?.trim() || null,
        company: data.company?.trim() || null,
        image: data.image || data.imageUrl || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapOpportunity(row as Row);
  });

export const updateOpportunityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(128),
        title: z.string().min(1).max(300),
        description: z.string().min(1).max(4000),
        type: z.enum(TYPE_VALUES),
        budgetMin: z.number().min(0).max(1e15).optional(),
        budgetMax: z.number().min(0).max(1e15).optional(),
        region: z.string().min(1).max(200),
        industry: z.string().min(1).max(200),
        deadline: z.string().min(1).max(64),
        emoji: z.string().min(1).max(16),
        status: z.enum(["open", "closed"]),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactTitle: z.string().optional(),
        company: z.string().optional(),
        image: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<Opportunity | null> => {
    const memberId = await resolveMemberId((context as any)?.token);
    const { data: row, error } = await getDb(context)
      .from("opportunities")
      .update({
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.type,
        budget_min: data.budgetMin ?? null,
        budget_max: data.budgetMax ?? null,
        region: data.region.trim(),
        industry: data.industry.trim(),
        deadline: data.deadline,
        emoji: data.emoji,
        status: data.status,
        contact_name: data.contactName?.trim() || null,
        contact_phone: data.contactPhone?.trim() || null,
        contact_title: data.contactTitle?.trim() || null,
        company: data.company?.trim() || null,
        image: data.image || data.imageUrl || null,
      })
      .eq("id", data.id)
      .eq("poster_id", memberId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapOpportunity(row as Row) : null;
  });

export const deleteOpportunityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer(`/opportunities/${encodeURIComponent(data.id)}`, token, {
        method: "DELETE",
      });
      return { ok: true };
    } catch {
      const memberId = await resolveMemberId(token);
      const { error } = await getDb(context)
        .from("opportunities")
        .delete()
        .eq("id", data.id)
        .eq("poster_id", memberId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
  });

export const toggleOpportunityStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Opportunity | null> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer(`/opportunities/${encodeURIComponent(data.id)}/toggle-status`, token, {
        method: "PATCH",
      });
      const updated = await fetchNestApiFromServer<{ opportunity: Opportunity }>(`/opportunities/${encodeURIComponent(data.id)}`, token);
      if (updated?.opportunity) {
        return mapOpportunity(updated.opportunity as any);
      }
    } catch {
      /* fallback */
    }

    const memberId = await resolveMemberId(token);
    const { data: cur } = await getDb(context)
      .from("opportunities")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (!cur) return null;
    const next = (cur as Row).status === "open" ? "closed" : "open";
    const { data: row, error } = await getDb(context)
      .from("opportunities")
      .update({ status: next })
      .eq("id", data.id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapOpportunity(row as Row) : null;
  });

export const expressInterestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        opportunityId: z.string().min(1).max(128),
        message: z.string().min(1).max(4000),
        contact: z.string().min(1).max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<OpportunityInterest> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer(`/opportunities/${encodeURIComponent(data.opportunityId)}/interests`, token, {
        method: "POST",
        body: JSON.stringify({ message: data.message, contact: data.contact, interestLevel: "high" }),
      });
      return {
        id: `int-${Date.now()}`,
        opportunityId: data.opportunityId,
        memberId: (context as any)?.userId || "",
        message: data.message,
        contact: data.contact,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("NestJS expressInterest failed, falling back to db:", err);
    }

    const id = `oi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const memberId = await resolveMemberId(token);
    const { data: row, error } = await getDb(context)
      .from("opportunity_interests")
      .insert({
        id,
        opportunity_id: data.opportunityId,
        member_id: memberId,
        message: data.message.trim(),
        contact: data.contact.trim(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapInterest(row as Row);
  });
