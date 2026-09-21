// Phiên & thiết bị — logic phía máy chủ. Chủ thể luôn lấy từ requireSupabaseAuth.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DeviceSessionInfo } from "./device-session.types";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["user_device_sessions"]["Row"];

export type DeviceHeartbeatInput = {
  deviceKey: string;
  label?: string | null;
  platform?: string | null;
  browser?: string | null;
  isStandalone?: boolean;
};

function mapRow(row: Row, currentKey: string | null): DeviceSessionInfo {
  return {
    id: row.id,
    deviceKey: row.device_key,
    label: row.device_label ?? "Thiết bị",
    platform: row.platform,
    browser: row.browser,
    isStandalone: row.is_standalone,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    isCurrent: currentKey != null && row.device_key === currentKey,
  };
}

/** Danh sách phiên của chính người dùng, mới nhất trước. */
export async function listMyDeviceSessions(
  supabase: DB,
  userId: string,
  currentKey: string | null,
): Promise<DeviceSessionInfo[]> {
  const { data, error } = await supabase
    .from("user_device_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row, currentKey));
}

/**
 * Ghi nhận thiết bị đang dùng và trả về trạng thái thu hồi.
 * Nếu thiết bị đã bị ngắt từ xa, phía client phải đăng xuất ngay.
 */
export async function touchMyDeviceSession(
  supabase: DB,
  userId: string,
  input: DeviceHeartbeatInput,
): Promise<{ revoked: boolean }> {
  const { data: existing, error: readError } = await supabase
    .from("user_device_sessions")
    .select("id, revoked_at")
    .eq("user_id", userId)
    .eq("device_key", input.deviceKey)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing?.revoked_at) return { revoked: true };

  const now = new Date().toISOString();
  if (existing) {
    const { error } = await supabase
      .from("user_device_sessions")
      .update({ last_seen_at: now })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { revoked: false };
  }

  const { error } = await supabase.from("user_device_sessions").insert({
    user_id: userId,
    device_key: input.deviceKey,
    device_label: input.label ?? null,
    platform: input.platform ?? null,
    browser: input.browser ?? null,
    is_standalone: input.isStandalone ?? false,
    first_seen_at: now,
    last_seen_at: now,
  });
  if (error) throw new Error(error.message);
  return { revoked: false };
}

/** Ngắt một thiết bị từ xa (đánh dấu thu hồi; thiết bị đó sẽ tự đăng xuất). */
export async function revokeMyDeviceSession(
  supabase: DB,
  userId: string,
  sessionId: string,
  currentKey: string | null,
): Promise<DeviceSessionInfo> {
  const { data, error } = await supabase
    .from("user_device_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data, currentKey);
}
