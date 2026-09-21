// BC-Mobile-8A — Adapter máy chủ cho hộp thư nội bộ.
//
// Mọi truy vấn chạy trên client RLS của chính người gọi; danh tính người gửi
// luôn lấy từ context.userId. Hồ sơ đối phương dùng ĐÚNG projection công khai
// đã dùng ở 6A (member_business_cards: published + public) — không rò dữ liệu
// riêng tư qua hộp thư.

import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

export type CounterpartCard = {
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
};

export async function resolveCounterpartCards(
  sb: DB,
  userIds: string[],
): Promise<Map<string, CounterpartCard>> {
  const out = new Map<string, CounterpartCard>();
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) return out;
  const { data, error } = await sb
    .from("member_business_cards")
    .select(
      "owner_user_id, display_name, headline, professional_title, company_name, avatar_url, card_kind, status, public_mode",
    )
    .in("owner_user_id", ids)
    .eq("status", "published")
    .eq("public_mode", "public");
  if (error) return out;
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const uid = row.owner_user_id as string | null;
    if (!uid) continue;
    const isPrimary = row.card_kind === "primary";
    if (out.has(uid) && !isPrimary) continue;
    out.set(uid, {
      displayName: (row.display_name as string | null) ?? null,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      headline:
        (row.headline as string | null) ?? (row.professional_title as string | null) ?? null,
      companyName: (row.company_name as string | null) ?? null,
    });
  }
  return out;
}

/** Kết nối đã chấp nhận giữa hai người? Fail-closed. */
export async function isAcceptedPair(sb: DB, a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  const [low, high] = a < b ? [a, b] : [b, a];
  const { data, error } = await sb
    .from("user_connections")
    .select("id")
    .eq("pair_user_low", low)
    .eq("pair_user_high", high)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export function pairOf(a: string, b: string): { low: string; high: string } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}
