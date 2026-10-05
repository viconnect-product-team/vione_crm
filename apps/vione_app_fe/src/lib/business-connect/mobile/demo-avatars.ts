import { resolveMediaUrl } from "@/lib/api-client";

export function demoAvatar(seed: string): string {
  const initials = (seed || "VO")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase() || "VO";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F6E1C3" />
        <stop offset="45%" stop-color="#D8B282" />
        <stop offset="70%" stop-color="#C29B69" />
        <stop offset="100%" stop-color="#8C653B" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="50" fill="url(#grad)"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="800" fill="#0B0F17" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
