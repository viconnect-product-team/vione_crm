// Ảnh nhân vật demo (chỉ dùng khi hồ sơ chưa có ảnh đại diện thật).
// Đảm bảo 100% không dùng đường dẫn cục bộ __l5e bị 404, luôn hiển thị hình ảnh doanh nhân chuẩn nét.

const POOL = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80",
];

import { resolveMediaUrl } from "@/lib/api-client";

export function demoAvatar(seed: string): string {
  let hash = 0;
  const str = seed || "default_vione_seed";
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return POOL[hash % POOL.length] as string;
}

/** Ảnh thật nếu có (hợp lệ và không chứa URL rác __l5e / relative path bị 404), ngược lại dùng ảnh demo tất định. */
export function avatarOrDemo(url: string | null | undefined, seed: string): string {
  const resolved = resolveMediaUrl(url);
  if (
    resolved &&
    typeof resolved === "string" &&
    resolved.trim().length > 0 &&
    !resolved.includes("__l5e") &&
    !resolved.includes("undefined") &&
    !resolved.includes("null") &&
    !resolved.includes("demo-person-") &&
    (resolved.startsWith("http://") ||
      resolved.startsWith("https://") ||
      resolved.startsWith("data:") ||
      resolved.startsWith("/landing/") ||
      resolved.startsWith("/assets/") ||
      resolved.startsWith("/upload/") ||
      resolved.startsWith("/api/upload/") ||
      resolved.startsWith("/ceo1983-logo.png"))
  ) {
    return resolved;
  }
  return demoAvatar(seed);
}
