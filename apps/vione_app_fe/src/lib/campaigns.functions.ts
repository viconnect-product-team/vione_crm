import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "@/lib/api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  sentAt: string;
  status: "sent" | "scheduled" | "draft";
};

export const listCampaignsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Campaign[]> => {
    const token = (context as any)?.token;
    try {
      const nestCampaigns = await fetchNestApiFromServer<any[]>("/admin/campaigns", token);
      if (Array.isArray(nestCampaigns) && nestCampaigns.length > 0) {
        return nestCampaigns.map((c: any) => ({
          id: c.code || c.id,
          name: c.name,
          subject: c.subject ?? "",
          audience: c.audience ?? "",
          sent: Number(c.sent ?? 0),
          opened: Number(c.opened ?? 0),
          clicked: Number(c.clicked ?? 0),
          sentAt: c.sentAt || c.sent_at || "—",
          status: (c.status as Campaign["status"]) ?? "draft",
        }));
      }
    } catch (e) {
      console.warn("Fallback to db for listCampaigns:", e);
    }

    const { getActiveAssociationId } = await import("./assoc-scope.server");
    const activeId = await getActiveAssociationId(getDb(context));
    let query = getDb(context)
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (activeId) query = query.eq("association_id", activeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((c: any) => ({
      id: c.code,
      name: c.name,
      subject: c.subject,
      audience: c.audience,
      sent: Number(c.sent),
      opened: Number(c.opened),
      clicked: Number(c.clicked),
      sentAt: c.sent_at ?? "—",
      status: c.status as Campaign["status"],
    }));
  });

export const createCampaignFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(200),
        subject: z.string().max(300).default(""),
        audience: z.string().max(200).default(""),
        status: z.enum(["sent", "scheduled", "draft"]).default("draft"),
        time: z.string().max(40).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<Campaign> => {
    const token = (context as any)?.token;
    try {
      const created = await fetchNestApiFromServer<any>("/admin/campaigns", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (created && (created.id || created.code)) {
        return {
          id: created.code || created.id,
          name: created.name,
          subject: created.subject ?? data.subject,
          audience: created.audience ?? data.audience,
          sent: Number(created.sent ?? 0),
          opened: Number(created.opened ?? 0),
          clicked: Number(created.clicked ?? 0),
          sentAt: created.sentAt || created.sent_at || "—",
          status: (created.status as Campaign["status"]) ?? data.status,
        };
      }
    } catch (e) {
      console.warn("Fallback to db for createCampaign:", e);
    }

    const { getActiveAssociationId } = await import("./assoc-scope.server");
    const activeId = await getActiveAssociationId(getDb(context));
    const code = `CMP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: row, error } = await getDb(context)
      .from("email_campaigns")
      .insert({
        code,
        name: data.name,
        subject: data.subject,
        audience: data.audience,
        status: data.status,
        sent_at:
          data.time || (data.status === "sent" ? new Date().toISOString().slice(0, 10) : null),
        ...(activeId ? { association_id: activeId } : {}),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.code,
      name: row.name,
      subject: row.subject,
      audience: row.audience,
      sent: Number(row.sent),
      opened: Number(row.opened),
      clicked: Number(row.clicked),
      sentAt: row.sent_at ?? "—",
      status: row.status as Campaign["status"],
    };
  });

export const deleteCampaignFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer<any>(`/admin/campaigns/${data.id}`, token, {
        method: "DELETE",
      });
      return { ok: true };
    } catch (e) {
      console.warn("Fallback to db for deleteCampaign:", e);
    }

    const { error } = await getDb(context).from("email_campaigns").delete().eq("code", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
