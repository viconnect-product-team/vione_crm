// BC-Mobile — "Lĩnh vực kinh doanh" + "Khách hàng & Dấu ấn" của CHỦ SỞ HỮU.
//
// Chỉ đọc dữ liệu canonical thuộc về actor (owner_user_id = auth.uid()).
// Không có dữ liệu = trả mảng rỗng, tuyệt đối không bịa dữ liệu mẫu.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["business_identity_showcase_items"]["Row"];

export type IdentityShowcaseItem = {
  id: string;
  kind: "business_area" | "client" | "metric" | "interest" | "client_metric";
  title: string;
  subtitle: string | null;
  logoUrl: string | null;
};

export type IdentityShowcasePayload = {
  businessAreas: IdentityShowcaseItem[];
  clients: IdentityShowcaseItem[];
  /** Con số nổi bật hiển thị trong "Về tôi" (title = giá trị, subtitle = nhãn). */
  metrics: IdentityShowcaseItem[];
  /** Thẻ lĩnh vực quan tâm hiển thị trong "Về tôi". */
  interests: IdentityShowcaseItem[];
  /** Con số dấu ấn hiển thị dưới danh sách khách hàng. */
  clientMetrics: IdentityShowcaseItem[];
};

const KINDS = ["business_area", "client", "metric", "interest", "client_metric"] as const;

function mapRow(row: Row): IdentityShowcaseItem {
  return {
    id: row.id,
    kind: (KINDS as readonly string[]).includes(row.kind)
      ? (row.kind as IdentityShowcaseItem["kind"])
      : "business_area",
    title: row.title,
    subtitle: row.subtitle,
    logoUrl: row.logo_url,
  };
}

export async function getMyIdentityShowcase(
  supabase: DB,
  userId: string,
): Promise<IdentityShowcasePayload> {
  const { data, error } = await supabase
    .from("business_identity_showcase_items")
    .select("id, kind, title, subtitle, logo_url")
    .eq("owner_user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(120);

  if (error) throw new Error(error.message);

  const items = (data ?? []).map((r: any) => mapRow(r as Row));
  return {
    businessAreas: items.filter((i) => i.kind === "business_area"),
    clients: items.filter((i) => i.kind === "client"),
    metrics: items.filter((i) => i.kind === "metric"),
    interests: items.filter((i) => i.kind === "interest"),
    clientMetrics: items.filter((i) => i.kind === "client_metric"),
  };
}
