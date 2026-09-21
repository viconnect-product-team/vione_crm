// BC-Mobile-5C — NFC tag registry service (server-side logic).
//
// Ownership rules identical to 5A: the actor ALWAYS comes from
// context.userId; client input carries only a share token (register) or a
// tag id (revoke) — never owner/identity/link ids.
//
// STALE is derived, never stored: rotating the share link instantly marks
// every tag programmed with it as STALE without any batch job.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { reportIdentityMetric } from "./identity.telemetry";
import type { IdentityNfcTagInfo, IdentityNfcTagStatus } from "./nfc-tags.types";
import type { NfcTagRegisterInput } from "./nfc-tags.validation";

type DB = SupabaseClient<Database>;

type TagRow = Pick<
  Database["public"]["Tables"]["identity_nfc_tags"]["Row"],
  "id" | "label" | "status" | "written_at" | "updated_at"
>;
type LinkSlice = { status: string; last_used_at: string | null } | null;

/** REVOKED (registry) > STALE (derived from link) > ACTIVE. */
export function deriveNfcTagStatus(
  tagStatus: string,
  linkStatus: string | null,
): IdentityNfcTagStatus {
  if (tagStatus === "revoked") return "REVOKED";
  if (linkStatus !== "active") return "STALE";
  return "ACTIVE";
}

function mapTag(row: TagRow, link: LinkSlice): IdentityNfcTagInfo {
  return {
    id: row.id,
    label: row.label,
    status: deriveNfcTagStatus(row.status, link?.status ?? null),
    writtenAt: row.written_at,
    lastTappedAt: link?.last_used_at ?? null,
    updatedAt: row.updated_at,
  };
}

const TAG_SELECT =
  "id, label, status, written_at, updated_at, identity_share_links(status, last_used_at)";

type TagRowWithLink = TagRow & { identity_share_links: LinkSlice };

/** Owner's tags, newest first, with derived status + link-level last tap. */
export async function listMyNfcTags(supabase: DB, userId: string): Promise<IdentityNfcTagInfo[]> {
  const { data, error } = await supabase
    .from("identity_nfc_tags")
    .select(TAG_SELECT)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as TagRowWithLink[]).map((row) =>
    mapTag(row, row.identity_share_links),
  );
}

/**
 * Register a tag after the browser CONFIRMED the NFC write. The share
 * token must resolve to the owner's currently-active link — tags can only
 * be registered against a live link, and ownership is re-verified here
 * (RLS + explicit owner filter).
 */
export async function registerMyNfcTag(
  supabase: DB,
  userId: string,
  input: NfcTagRegisterInput,
): Promise<IdentityNfcTagInfo> {
  const { data: link, error: linkError } = await supabase
    .from("identity_share_links")
    .select("id, identity_id, status, last_used_at")
    .eq("owner_user_id", userId)
    .eq("public_token", input.shareToken)
    .eq("status", "active")
    .maybeSingle();
  if (linkError) throw new Error(linkError.message);
  if (!link) throw new Error("share_link_not_found");

  const { data, error } = await supabase
    .from("identity_nfc_tags")
    .insert({
      owner_user_id: userId,
      identity_id: link.identity_id,
      share_link_id: link.id,
      label: input.label ?? null,
    })
    .select(TAG_SELECT)
    .single();
  if (error) throw new Error(error.message);
  reportIdentityMetric("NFC_TAG_REGISTERED");
  const row = data as unknown as TagRowWithLink;
  return mapTag(row, row.identity_share_links);
}

/**
 * Owner-initiated revoke: marks the tag retired (registry bookkeeping so a
 * lost/destroyed card is tracked). The tag's URL keeps resolving until the
 * owner rotates the link — the sheet copy already teaches that rotation is
 * what kills a lost card; revoke here is inventory control.
 */
export async function revokeMyNfcTag(
  supabase: DB,
  userId: string,
  tagId: string,
): Promise<IdentityNfcTagInfo> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("identity_nfc_tags")
    .update({ status: "revoked", revoked_at: now, updated_at: now })
    .eq("id", tagId)
    .eq("owner_user_id", userId)
    .select(TAG_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("tag_not_found");
  reportIdentityMetric("NFC_TAG_REVOKED");
  const row = data as unknown as TagRowWithLink;
  return mapTag(row, row.identity_share_links);
}

/**
 * Đổi tên/nhãn thẻ NFC đã đăng ký. Chỉ đổi nhãn hiển thị — không đụng tới
 * link chia sẻ, trạng thái hay thời điểm ghi thẻ. Chủ thẻ lấy từ phiên.
 */
export async function renameMyNfcTag(
  supabase: DB,
  userId: string,
  input: { tagId: string; label?: string | null },
): Promise<IdentityNfcTagInfo> {
  const { data, error } = await supabase
    .from("identity_nfc_tags")
    .update({ label: input.label ?? null, updated_at: new Date().toISOString() })
    .eq("id", input.tagId)
    .eq("owner_user_id", userId)
    .select(TAG_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("tag_not_found");
  reportIdentityMetric("NFC_TAG_RENAMED");
  const row = data as unknown as TagRowWithLink;
  return mapTag(row, row.identity_share_links);
}
