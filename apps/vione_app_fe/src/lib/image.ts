export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("data:")) return path;

  // Xử lý chống Mixed Content khi đang chạy HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (
      path.startsWith("http://14.225.217.232") ||
      path.includes(":5001") ||
      path.includes(":5002") ||
      path.includes(":5003") ||
      path.includes(":5004") ||
      path.includes(":5005") ||
      path.includes(":4000")
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

  // VITE_API_URL là địa chỉ NestJS Backend
  const baseUrl =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.port === "5443" ||
      window.location.port === "5444" ||
      window.location.port === "5445")
      ? ""
      : import.meta.env.VITE_API_URL || "http://localhost:4000";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/upload/")) {
    cleanPath = `/api${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
}
