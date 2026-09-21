// BC-Mobile-2E — Meeting Moment server adapter (server-only).
//
// Wires the pure Moment service to Supabase:
// - Authorization mirrors 2C exactly: GlobalConnectionService.getState for
//   `u:` (accepted, not blocked, not self) and an owner-scoped non-archived
//   saved_business_cards edge for `c:`. Fail-closed.
// - All queries run on the caller's RLS-scoped client; owner_user_id is set
//   server-side from context.userId — never from client input.
// - The brm_validate_moment_target trigger re-checks authorization at the
//   database layer as defense in depth.

import type { SupabaseClient } from "@supabase/supabase-js";
import { GlobalConnectionService } from "@/lib/global-network/service";
import {
  momentStoragePath,
  type MomentDraftRow,
  type MomentMediaSlotRow,
  type MomentServiceDeps,
} from "./moment.service";
import { parseMomentPersonId, type BcMobileMomentErrorCode } from "./moment.types";

const MOMENTS_TABLE = "business_relationship_moments";
const MEDIA_TABLE = "business_relationship_moment_media";
/** Kho ảnh riêng tư của khoảnh khắc (private bucket). */
const MOMENT_MEDIA_BUCKET = "relationship-moments";

type RawMomentRow = {
  id: string;
  owner_user_id: string;
  target_kind: "connection" | "saved_card" | "guest_contact";
  target_user_id: string | null;
  target_card_id: string | null;
  target_guest_id: string | null;
  occurred_at: string;
  event_name: string | null;
  place_label: string | null;
  note: string | null;
  status: "pending" | "active";
  client_token: string;
};

/** Column list used by every moment SELECT — includes the BC-Mobile-3B
 * guest target column. */
const MOMENT_COLUMNS =
  "id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id, occurred_at, event_name, place_label, note, status, client_token";

type RawMediaRow = {
  id: string;
  moment_id: string;
  storage_path: string;
  sort_order: number;
};

function toDraft(row: RawMomentRow): MomentDraftRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    targetKind: row.target_kind,
    targetUserId: row.target_user_id,
    targetCardId: row.target_card_id,
    targetGuestContactId: row.target_guest_id,
    occurredAt: row.occurred_at,
    eventName: row.event_name,
    placeLabel: row.place_label,
    note: row.note,
    status: row.status,
    clientToken: row.client_token,
  };
}

function toSlot(row: RawMediaRow): MomentMediaSlotRow {
  return {
    id: row.id,
    momentId: row.moment_id,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  };
}

function dbError(): { ok: false; error: BcMobileMomentErrorCode } {
  return { ok: false, error: "unavailable" };
}

export function makeMomentServiceDeps(sb: SupabaseClient): MomentServiceDeps {
  return {
    async authorizePerson({ viewerId, personId }) {
      const parsed = parseMomentPersonId(personId);
      if (!parsed.ok) return { ok: false, error: "relationship_not_authorized" };

      if (parsed.namespace === "u") {
        if (parsed.id === viewerId) return { ok: false, error: "relationship_not_authorized" };
        try {
          const state = await GlobalConnectionService.getState(sb, viewerId, parsed.id);
          if (state.status !== "accepted" || state.blocked) {
            return { ok: false, error: "relationship_not_authorized" };
          }
        } catch {
          return dbError();
        }
        return { ok: true, target: { kind: "connection", userId: parsed.id } };
      }

      // BC-Mobile-3B — guest contact target: owner-scoped row IS the auth.
      if (parsed.namespace === "g") {
        const { data, error } = await sb
          .from("guest_contacts")
          .select("id")
          .eq("owner_user_id", viewerId)
          .eq("id", parsed.id)
          .limit(1)
          .maybeSingle();
        if (error) return dbError();
        if (!data) return { ok: false, error: "relationship_not_authorized" };
        return { ok: true, target: { kind: "guest_contact", guestContactId: parsed.id } };
      }

      const { data, error } = await sb
        .from("saved_business_cards")
        .select("id")
        .eq("owner_user_id", viewerId)
        .eq("target_card_id", parsed.id)
        .eq("archived", false)
        .limit(1)
        .maybeSingle();
      if (error) return dbError();
      if (!data) return { ok: false, error: "relationship_not_authorized" };
      return { ok: true, target: { kind: "saved_card", cardId: parsed.id } };
    },

    async findDraftByToken({ ownerId, clientToken }) {
      const { data, error } = await sb
        .from(MOMENTS_TABLE)
        .select(MOMENT_COLUMNS)
        .eq("owner_user_id", ownerId)
        .eq("client_token", clientToken)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`moment draft lookup failed: ${error.message}`);
      return data ? toDraft(data as unknown as RawMomentRow) : null;
    },

    async createDraft(input) {
      const row = {
        owner_user_id: input.ownerId,
        target_kind: input.target.kind,
        target_user_id: input.target.kind === "connection" ? input.target.userId : null,
        target_card_id: input.target.kind === "saved_card" ? input.target.cardId : null,
        target_guest_id:
          input.target.kind === "guest_contact" ? input.target.guestContactId : null,
        occurred_at: input.occurredAt,
        event_name: input.eventName,
        place_label: input.placeLabel,
        note: input.note,
        status: "pending" as const,
        client_token: input.clientToken,
      };
      const { data, error } = await sb
        .from(MOMENTS_TABLE)
        .insert(row as never)
        .select(MOMENT_COLUMNS)
        .single();
      if (error || !data) throw new Error(`moment draft insert failed: ${error?.message}`);
      return toDraft(data as unknown as RawMomentRow);
    },

    async updateDraftFields(input) {
      const { error } = await sb
        .from(MOMENTS_TABLE)
        .update({
          occurred_at: input.occurredAt,
          event_name: input.eventName,
          place_label: input.placeLabel,
          note: input.note,
        } as never)
        .eq("id", input.momentId)
        .eq("owner_user_id", input.ownerId)
        .eq("status", "pending");
      if (error) throw new Error(`moment draft update failed: ${error.message}`);
    },

    async replaceMediaSlots({ ownerId, momentId, count }) {
      const del = await sb
        .from(MEDIA_TABLE)
        .delete()
        .eq("moment_id", momentId)
        .eq("owner_user_id", ownerId);
      if (del.error) throw new Error(`moment media reset failed: ${del.error.message}`);
      if (count === 0) return [];
      const rows = Array.from({ length: count }, (_, i) => {
        const mediaId = crypto.randomUUID();
        return {
          id: mediaId,
          moment_id: momentId,
          owner_user_id: ownerId,
          storage_path: momentStoragePath({ ownerId, momentId, mediaId }),
          media_type: "image/jpeg",
          sort_order: i,
        };
      });
      const { data, error } = await sb
        .from(MEDIA_TABLE)
        .insert(rows as never)
        .select("id, moment_id, storage_path, sort_order");
      if (error) throw new Error(`moment media slot insert failed: ${error.message}`);
      return ((data ?? []) as unknown as RawMediaRow[]).map(toSlot);
    },

    async getMomentForOwner({ ownerId, momentId }) {
      const { data, error } = await sb
        .from(MOMENTS_TABLE)
        .select(MOMENT_COLUMNS)
        .eq("id", momentId)
        .eq("owner_user_id", ownerId)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`moment lookup failed: ${error.message}`);
      return data ? toDraft(data as unknown as RawMomentRow) : null;
    },

    async listMediaSlots({ momentId }) {
      const { data, error } = await sb
        .from(MEDIA_TABLE)
        .select("id, moment_id, storage_path, sort_order")
        .eq("moment_id", momentId)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(`moment media lookup failed: ${error.message}`);
      return ((data ?? []) as unknown as RawMediaRow[]).map(toSlot);
    },

    async finalizeDraft({ ownerId, momentId, keepMediaIds, allMediaIds }) {
      const drop = allMediaIds.filter((id) => !keepMediaIds.includes(id));
      if (drop.length > 0) {
        const del = await sb
          .from(MEDIA_TABLE)
          .delete()
          .eq("moment_id", momentId)
          .eq("owner_user_id", ownerId)
          .in("id", drop);
        if (del.error) throw new Error(`moment media prune failed: ${del.error.message}`);
      }
      const { error } = await sb
        .from(MOMENTS_TABLE)
        .update({ status: "active" } as never)
        .eq("id", momentId)
        .eq("owner_user_id", ownerId)
        .eq("status", "pending");
      if (error) throw new Error(`moment finalize failed: ${error.message}`);
    },

    // BC-Mobile-7C — sửa nội dung khoảnh khắc đã lưu. Chỉ các trường nội dung;
    // chủ sở hữu và đối tượng liên quan không bao giờ đổi được từ client.
    async updateMomentFields(input) {
      const { error } = await sb
        .from(MOMENTS_TABLE)
        .update({
          occurred_at: input.occurredAt,
          event_name: input.eventName,
          place_label: input.placeLabel,
          note: input.note,
        } as never)
        .eq("id", input.momentId)
        .eq("owner_user_id", input.ownerId);
      if (error) throw new Error(`moment update failed: ${error.message}`);
    },

    // BC-Mobile-7C — xoá hẳn: ảnh riêng tư trước, rồi hàng media, rồi moment.
    async deleteMomentCascade({ ownerId, momentId, storagePaths }) {
      if (storagePaths.length > 0) {
        // Ảnh mồ côi trong kho không được phép chặn việc xoá dữ liệu.
        try {
          await sb.storage.from(MOMENT_MEDIA_BUCKET).remove(storagePaths);
        } catch {
          /* bỏ qua: hàng dữ liệu vẫn phải được xoá */
        }
      }
      const media = await sb
        .from(MEDIA_TABLE)
        .delete()
        .eq("moment_id", momentId)
        .eq("owner_user_id", ownerId);
      if (media.error) throw new Error(`moment media delete failed: ${media.error.message}`);
      const { error } = await sb
        .from(MOMENTS_TABLE)
        .delete()
        .eq("id", momentId)
        .eq("owner_user_id", ownerId);
      if (error) throw new Error(`moment delete failed: ${error.message}`);
    },

    // BC-Mobile-7D — thêm chỗ ảnh mới cho khoảnh khắc đã lưu.
    async appendMediaSlots({ ownerId, momentId, startSort, count }) {
      const rows = Array.from({ length: count }, (_, i) => {
        const mediaId = crypto.randomUUID();
        return {
          id: mediaId,
          moment_id: momentId,
          owner_user_id: ownerId,
          storage_path: momentStoragePath({ ownerId, momentId, mediaId }),
          media_type: "image/jpeg",
          sort_order: startSort + i,
        };
      });
      const { data, error } = await sb
        .from(MEDIA_TABLE)
        .insert(rows as never)
        .select("id, moment_id, storage_path, sort_order");
      if (error) throw new Error(`moment media append failed: ${error.message}`);
      return ((data ?? []) as unknown as RawMediaRow[]).map(toSlot);
    },

    // BC-Mobile-7D — gỡ ảnh khỏi kho rồi xoá hàng dữ liệu.
    async deleteMediaRows({ ownerId, momentId, mediaIds, storagePaths }) {
      if (mediaIds.length === 0) return;
      if (storagePaths.length > 0) {
        try {
          await sb.storage.from(MOMENT_MEDIA_BUCKET).remove(storagePaths);
        } catch {
          /* bỏ qua: hàng dữ liệu vẫn phải được xoá */
        }
      }
      const { error } = await sb
        .from(MEDIA_TABLE)
        .delete()
        .eq("moment_id", momentId)
        .eq("owner_user_id", ownerId)
        .in("id", mediaIds);
      if (error) throw new Error(`moment media delete failed: ${error.message}`);
    },

    // BC-Mobile-7D — URL ký ngắn hạn để xem ảnh riêng tư khi sửa.
    async signMediaUrls({ paths }) {
      if (paths.length === 0) return {};
      const { data, error } = await sb.storage
        .from(MOMENT_MEDIA_BUCKET)
        .createSignedUrls(paths, 300);
      if (error || !data) return {};
      const map: Record<string, string> = {};
      for (const row of data) {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      }
      return map;
    },

    now: () => Date.now(),

    newId: () => crypto.randomUUID(),
  };
}
