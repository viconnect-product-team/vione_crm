/**
 * ViOne Connect - Media URL Resolver
 * Đảm bảo 100% hình ảnh (avatar, ảnh bìa, logo đối tác, ảnh sản phẩm, ảnh tin tức)
 * được đồng bộ tuyệt đối giữa Web PWA và Mobile Native App.
 */

// Host origin chính thức của ViOne Connect Platform (HTTPS cổng 5445)
export const PUBLIC_MEDIA_BASE_URL = "https://14.225.217.232:5445";

/**
 * Kiểm tra các url avatar bị hỏng hoặc hash chết
 */
export function isDeadAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const deadMarkers = ["i5o6ez", "d9ut5z", "4qjy8i", "undefined", "null"];
  return deadMarkers.some((m) => url.includes(m));
}

/**
 * Chuẩn hóa và chuyển đổi mọi đường dẫn tương đối, cổng nội bộ docker,
 * hoặc url cục bộ thành HTTPS URL hợp lệ trên máy chủ ViOne.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || isDeadAvatarUrl(trimmed)) return null;

  // Base64 data image
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  // 1. Chuyển đổi các cổng nội bộ / docker / IP HTTP sang HTTPS 5445
  if (
    trimmed.startsWith("http://14.225.217.232:5001") ||
    trimmed.startsWith("http://14.225.217.232:5445") ||
    trimmed.startsWith("https://14.225.217.232:5001")
  ) {
    const afterOrigin = trimmed.replace(/^https?:\/\/14\.225\.217\.232:(?:5001|5445)/, "");
    return `${PUBLIC_MEDIA_BASE_URL}${afterOrigin.startsWith("/") ? afterOrigin : `/${afterOrigin}`}`;
  }

  // 2. Chuyển đổi tên host nội bộ docker backend:4000
  if (trimmed.includes("backend:4000")) {
    const parts = trimmed.split("backend:4000");
    const after = parts[1] || "";
    return `${PUBLIC_MEDIA_BASE_URL}${after.startsWith("/") ? after : `/${after}`}`;
  }

  // 3. Chuyển đổi localhost:4000 hoặc 127.0.0.1:4000
  if (trimmed.includes("localhost:4000") || trimmed.includes("127.0.0.1:4000")) {
    const after = trimmed.split(/(?:localhost|127\.0\.0\.1):4000/)[1] || "";
    return `${PUBLIC_MEDIA_BASE_URL}${after.startsWith("/") ? after : `/${after}`}`;
  }

  // 4. Chuyển đổi MinIO bucket url
  if (
    trimmed.includes("minio") ||
    trimmed.includes(":9000") ||
    trimmed.includes(":9060") ||
    trimmed.includes("vione-standalone-bucket") ||
    trimmed.includes("vione-bucket")
  ) {
    const parts = trimmed.split(/\/vione-(?:standalone-)?bucket\//);
    if (parts[1]) {
      return `${PUBLIC_MEDIA_BASE_URL}/api/upload/file/${parts[1]}`;
    }
  }

  // 5. Đường dẫn bắt đầu bằng /api/upload/
  if (trimmed.startsWith("/api/upload/")) {
    return `${PUBLIC_MEDIA_BASE_URL}${trimmed}`;
  }
  if (trimmed.startsWith("api/upload/")) {
    return `${PUBLIC_MEDIA_BASE_URL}/${trimmed}`;
  }

  // 6. Đường dẫn /upload/... -> Nâng cấp thành /api/upload/file/...
  if (trimmed.startsWith("/upload/")) {
    const clean = trimmed.replace(/^\/upload\/(file\/)?/, "");
    return `${PUBLIC_MEDIA_BASE_URL}/api/upload/file/${clean}`;
  }
  if (trimmed.startsWith("upload/")) {
    const clean = trimmed.replace(/^upload\/(file\/)?/, "");
    return `${PUBLIC_MEDIA_BASE_URL}/api/upload/file/${clean}`;
  }

  // 7. Đường dẫn /uploads/... -> Nâng cấp thành /api/upload/file/...
  if (trimmed.startsWith("/uploads/")) {
    const clean = trimmed.replace(/^\/uploads\//, "");
    return `${PUBLIC_MEDIA_BASE_URL}/api/upload/file/${clean}`;
  }
  if (trimmed.startsWith("uploads/")) {
    const clean = trimmed.replace(/^uploads\//, "");
    return `${PUBLIC_MEDIA_BASE_URL}/api/upload/file/${clean}`;
  }

  // 8. Các đường dẫn tương đối khác bắt đầu bằng /
  if (trimmed.startsWith("/")) {
    return `${PUBLIC_MEDIA_BASE_URL}${trimmed}`;
  }

  // 9. Nâng cấp HTTP 14.225.217.232 bất kỳ thành HTTPS 5445
  if (trimmed.startsWith("http://14.225.217.232")) {
    const after = trimmed.replace(/^http:\/\/14\.225\.217\.232(?::\d+)?/, "");
    return `${PUBLIC_MEDIA_BASE_URL}${after.startsWith("/") ? after : `/${after}`}`;
  }

  // 10. External HTTPS URLs (Unsplash, Google, CDN...)
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }

  // 11. Fallback đường dẫn tương đối không có dấu gạch chéo
  return `${PUBLIC_MEDIA_BASE_URL}/${trimmed}`;
}
