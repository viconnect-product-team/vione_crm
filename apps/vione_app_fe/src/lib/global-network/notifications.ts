// BC-3.1F — Networking notification read service (server-invoked).
// RLS scopes every read/update to the current recipient. Notifications are
// emitted by a DB trigger; clients can only read their own rows and flip
// read state via the controlled gn_mark_notifications_read RPC.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toGlobalNetworkError } from "./errors";
import { requireGlobalNetworkUser } from "./identity";
import type { CounterpartSummary } from "./types";
import type { GnNotificationDTO, GnNotificationPrefs, GnNotificationType } from "./abuse.types";

type DB = SupabaseClient<Database>;
type Row = Record<string, unknown>;

function toActor(summary: unknown): CounterpartSummary | null {
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Row;
  const userId = s.userId as string | undefined;
  if (!userId) return null;
  return {
    userId,
    displayName: (s.displayName as string | null) ?? null,
    avatarUrl: (s.avatarUrl as string | null) ?? null,
    headline: (s.headline as string | null) ?? null,
    companyName: (s.companyName as string | null) ?? null,
    primaryCardSlug: (s.primaryCardSlug as string | null) ?? null,
  };
}

function mapNotification(row: Row): GnNotificationDTO {
  return {
    id: row.id as string,
    type: row.type as GnNotificationType,
    connectionId: (row.connection_id as string | null) ?? null,
    actor: toActor(row.actor_summary),
    read: row.read_at != null,
    createdAt: row.created_at as string,
  };
}

export const NotificationService = {
  async list(
    supabase: DB,
    userId: string | null | undefined,
    options?: { limit?: number },
  ): Promise<GnNotificationDTO[]> {
    await requireGlobalNetworkUser(supabase, userId);
    const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100);
    const { data, error } = await supabase
      .from("gn_notifications")
      .select("id, type, connection_id, actor_summary, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw toGlobalNetworkError(error);
    return (data ?? []).map((r: any) => mapNotification(r as Row));
  },

  async unreadCount(supabase: DB, userId: string | null | undefined): Promise<number> {
    await requireGlobalNetworkUser(supabase, userId);
    const { count, error } = await supabase
      .from("gn_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw toGlobalNetworkError(error);
    return count ?? 0;
  },

  async markRead(supabase: DB, userId: string | null | undefined, ids?: string[]): Promise<number> {
    await requireGlobalNetworkUser(supabase, userId);
    const { data, error } = await supabase.rpc("gn_mark_notifications_read", {
      _ids: ids && ids.length ? ids : undefined,
    });
    if (error) throw toGlobalNetworkError(error);
    return Number(data ?? 0);
  },

  async getPrefs(supabase: DB, userId: string | null | undefined): Promise<GnNotificationPrefs> {
    await requireGlobalNetworkUser(supabase, userId);
    const { data, error } = await supabase
      .from("gn_notification_prefs")
      .select("connection_request, connection_accepted, connection_status_update")
      .maybeSingle();
    if (error) throw toGlobalNetworkError(error);
    const r = (data ?? {}) as Row;
    return {
      connectionRequest: (r.connection_request as boolean | undefined) ?? true,
      connectionAccepted: (r.connection_accepted as boolean | undefined) ?? true,
      connectionStatusUpdate: (r.connection_status_update as boolean | undefined) ?? true,
    };
  },

  async setPrefs(
    supabase: DB,
    userId: string | null | undefined,
    prefs: GnNotificationPrefs,
  ): Promise<GnNotificationPrefs> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    const { error } = await supabase.from("gn_notification_prefs").upsert(
      {
        user_id: me.userId,
        connection_request: prefs.connectionRequest,
        connection_accepted: prefs.connectionAccepted,
        connection_status_update: prefs.connectionStatusUpdate,
      },
      { onConflict: "user_id" },
    );
    if (error) throw toGlobalNetworkError(error);
    return prefs;
  },
};
