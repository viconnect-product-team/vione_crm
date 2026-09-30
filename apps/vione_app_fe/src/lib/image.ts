export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("data:")) return path;

  // Xử lý chống Mixed Content khi đang chạy HTTPS hoặc rewrite port nội bộ
  if (typeof window !== "undefined") {
    if (
      path.startsWith("http://14.225.217.232") ||
      path.includes(":5001") ||
      path.includes(":5002") ||
      path.includes(":5003") ||
      path.includes(":5004") ||
      path.includes(":5005") ||
      path.includes(":4000") ||
      path.includes(":4001")
    ) {
      try {
        const u = new URL(path);
        return `${window.location.origin}${u.pathname}${u.search}`;
      } catch {
        // fallback
      }
    }
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Trên trình duyệt, dùng relative URL để Vite dev server hoặc Nginx proxy tự chuyển hướng /api và /upload
  const baseUrl =
    typeof window !== "undefined"
      ? ""
      : import.meta.env.VITE_API_URL || "http://localhost:4001";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/upload/")) {
    cleanPath = `/api${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
}
