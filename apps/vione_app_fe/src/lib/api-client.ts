export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vibe_token");
}

export function getBaseApiUrl(): string {
  if (typeof window !== "undefined") {
    // 1. Khi chạy trên trình duyệt (Web / PWA) với HTTPS hoặc qua Reverse Proxy (5443, 5444, 5445):
    // Dùng chuỗi rỗng "" để mọi lệnh fetch đều là relative URL (/api/...) trên cùng Origin HTTPS.
    // Điều này TRÁNH TRIỆT ĐỂ lỗi Mixed Content (blocked:mixed-content) và lỗi CORS!
    if (
      window.location.protocol === "https:" ||
      window.location.port === "5443" ||
      window.location.port === "5444" ||
      window.location.port === "5445" ||
      (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
    ) {
      return "";
    }
    // 2. Localhost phát triển (Vite Dev Server đã cấu hình proxy /api sang localhost:4000)
    return "";
  }
  // 3. Phía Server-Side Rendering (SSR / Nitro server function chạy trong container)
  return (
    (typeof process !== "undefined" && (process.env?.NEST_API_URL || process.env?.VITE_API_URL)) ||
    (import.meta.env?.VITE_API_URL as string) ||
    "http://127.0.0.1:4000"
  );
}

export const NEST_API_URL = getBaseApiUrl();

function mapEndpoint(endpoint: string): string {
  let mapped = endpoint;

  if (mapped === "/connect-app/briefing") {
    mapped = "/me/briefing";
  } else if (mapped === "/connect-app/me/profile" || mapped === "/profile") {
    mapped = "/me/profile";
  } else if (mapped === "/connect-app/me/identity") {
    mapped = "/me/identity";
  } else if (mapped === "/connect-app/me/identity/visibility") {
    mapped = "/me/identity/visibility";
  } else if (mapped === "/connect-app/me/identity/share-link") {
    mapped = "/me/identity/share-link";
  } else if (mapped === "/connect-app/me/identity/share-link/rotate") {
    mapped = "/me/identity/share-link/rotate";
  } else if (mapped.startsWith("/connect-app/me/showcase")) {
    mapped = mapped.replace("/connect-app/me/showcase", "/me/showcase");
  } else if (mapped === "/connect-app/abuse/report") {
    mapped = "/network/abuse/report";
  } else if (
    mapped === "/connect-app/community" ||
    mapped.startsWith("/connect-app/community/") ||
    mapped.startsWith("/connect-app/community?")
  ) {
    mapped = mapped.replace("/connect-app/community", "/communities");
  } else if (
    mapped === "/connect-app/network" ||
    mapped.startsWith("/connect-app/network/") ||
    mapped.startsWith("/connect-app/network?")
  ) {
    mapped = mapped.replace("/connect-app/network", "/network");
  } else if (mapped.startsWith("/connect-app/me/")) {
    mapped = mapped.replace("/connect-app/me/", "/me/");
  } else if (mapped.startsWith("/connect-app/dm/")) {
    mapped = mapped.replace("/connect-app/dm/", "/dm/");
  } else if (
    mapped === "/connect-app/customer" ||
    mapped.startsWith("/connect-app/customer/") ||
    mapped.startsWith("/connect-app/customer?")
  ) {
    mapped = mapped.replace("/connect-app/customer", "/customers");
  } else if (
    mapped === "/connect-app/card-scan" ||
    mapped.startsWith("/connect-app/card-scan/") ||
    mapped.startsWith("/connect-app/card-scan?")
  ) {
    mapped = mapped.replace("/connect-app/card-scan", "/card-scans");
  } else if (mapped.startsWith("/connect-app/public/identity/")) {
    mapped = mapped.replace("/connect-app/public/identity/", "/public/identity/");
  } else if (mapped.startsWith("/connect-app/notifications")) {
    mapped = mapped.replace("/connect-app/notifications", "/me/notifications");
  } else if (
    mapped === "/connect-app/moment" ||
    mapped.startsWith("/connect-app/moment/") ||
    mapped.startsWith("/connect-app/moment?")
  ) {
    mapped = mapped.replace("/connect-app/moment", "/moments");
  } else if (mapped.startsWith("/public/")) {
    // Public endpoints pass through as-is
  }

  const clean = mapped.startsWith("/") ? mapped : `/${mapped}`;
  return clean.startsWith("/api") ? clean : `/api${clean}`;
}

export function getNestApiUrl(endpoint: string): string {
  return `${NEST_API_URL}${mapEndpoint(endpoint)}`;
}

export function getPublicBackendUrl(): string {
  if (typeof window !== "undefined") {
    if (
      window.location.protocol === "https:" ||
      window.location.port === "5443" ||
      window.location.port === "5444" ||
      window.location.port === "5445" ||
      (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
    ) {
      return window.location.origin;
    }
    return "http://localhost:4000";
  }
  return (
    (typeof process !== "undefined" &&
      (process.env?.VITE_PUBLIC_API_URL || process.env?.VITE_API_URL)) ||
    ""
  );
}

export function isDeadAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const deadMarkers = ["i5o6ez", "d9ut5z", "4qjy8i", "undefined", "null"];
  return deadMarkers.some((m) => url.includes(m));
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || isDeadAvatarUrl(trimmed)) return null;

  // Tự động chuyển đổi sang Origin hiện tại để tránh lỗi Mixed Content hoặc vỡ ảnh khi mang cổng nội bộ khác
  if (typeof window !== "undefined") {
    if (
      trimmed.startsWith("http://14.225.217.232") ||
      trimmed.startsWith("https://14.225.217.232") ||
      trimmed.includes(":5001") ||
      trimmed.includes(":5002") ||
      trimmed.includes(":5003") ||
      trimmed.includes(":5004") ||
      trimmed.includes(":5005") ||
      trimmed.includes(":4000") ||
      trimmed.includes("localhost:") ||
      trimmed.includes("127.0.0.1:")
    ) {
      try {
        const parsed = new URL(trimmed.startsWith("http") ? trimmed : `http://${trimmed}`);
        if (
          parsed.pathname.startsWith("/api/upload/") ||
          parsed.pathname.startsWith("/upload/") ||
          parsed.pathname.startsWith("/api/")
        ) {
          return `${window.location.origin}${parsed.pathname}${parsed.search}`;
        }
      } catch {
        // fallback bên dưới
      }
    }
  }

  const publicBase = getPublicBackendUrl();

  // If URL contains internal Docker host backend:4000
  if (trimmed.includes("backend:4000")) {
    const after = trimmed.split("backend:4000")[1];
    return publicBase ? `${publicBase}${after}` : after;
  }

  // If remote browser receives localhost:4000 or 127.0.0.1:4000, rewrite to publicBase
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (trimmed.includes("localhost:4000")) {
      const after = trimmed.split("localhost:4000")[1];
      return `${publicBase}${after}`;
    }
    if (trimmed.includes("127.0.0.1:4000")) {
      const after = trimmed.split("127.0.0.1:4000")[1];
      return `${publicBase}${after}`;
    }
    if (trimmed.includes("minio:9000") || trimmed.includes("localhost:9000")) {
      const parts = trimmed.split("/vione-bucket/");
      if (parts[1]) {
        return publicBase
          ? `${publicBase}/api/upload/file/${parts[1]}`
          : `/api/upload/file/${parts[1]}`;
      }
    }
  }

  // 4. Nếu là đường dẫn /api/upload/...
  if (trimmed.startsWith("/api/upload/")) {
    return publicBase ? `${publicBase}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("api/upload/")) {
    return publicBase ? `${publicBase}/${trimmed}` : `/${trimmed}`;
  }

  // 5. Nếu là đường dẫn /upload/... -> Nâng cấp thành /api/upload/...
  if (trimmed.startsWith("/upload/")) {
    return publicBase ? `${publicBase}/api${trimmed}` : `/api${trimmed}`;
  }
  if (trimmed.startsWith("upload/")) {
    return publicBase ? `${publicBase}/api/${trimmed}` : `/api/${trimmed}`;
  }

  // 6. Nếu là đường dẫn /uploads/... -> Phục vụ tĩnh từ backend
  if (trimmed.startsWith("/uploads/")) {
    return publicBase ? `${publicBase}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("uploads/")) {
    return publicBase ? `${publicBase}/${trimmed}` : `/${trimmed}`;
  }

  // 7. Nếu là file trong avatars/ hoặc documents/ hoặc products/ hoặc events/
  if (
    trimmed.startsWith("avatars/") ||
    trimmed.startsWith("/avatars/") ||
    trimmed.startsWith("documents/") ||
    trimmed.startsWith("/documents/") ||
    trimmed.startsWith("products/") ||
    trimmed.startsWith("/products/") ||
    trimmed.startsWith("events/") ||
    trimmed.startsWith("/events/")
  ) {
    const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return publicBase ? `${publicBase}/api/upload/file/${cleanPath}` : `/api/upload/file/${cleanPath}`;
  }

  // 8. Nếu là bare filename (không chứa /) có đuôi file ảnh/tài liệu, hoặc UUID
  if (!trimmed.includes("/") && /\.(jpg|jpeg|png|webp|gif|svg|pdf|docx|xlsx)$/i.test(trimmed)) {
    return publicBase ? `${publicBase}/api/upload/file/avatars/${trimmed}` : `/api/upload/file/avatars/${trimmed}`;
  }
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(trimmed)) {
    return publicBase ? `${publicBase}/api/upload/file/avatars/${trimmed}` : `/api/upload/file/avatars/${trimmed}`;
  }

  return trimmed;
}

function transformUrls(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // If it's already a media URL or upload path, resolve it cleanly
    if (
      obj.startsWith("/upload/") ||
      obj.startsWith("/uploads/") ||
      obj.startsWith("upload/") ||
      obj.startsWith("uploads/") ||
      obj.startsWith("/api/upload/") ||
      obj.startsWith("api/upload/") ||
      obj.startsWith("avatars/") ||
      obj.startsWith("/avatars/") ||
      (!obj.includes("/") && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(obj)) ||
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(obj) ||
      obj.includes("backend:4000") ||
      (typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        obj.includes("localhost:4000"))
    ) {
      return resolveMediaUrl(obj) || obj;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformUrls);
  }

  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = transformUrls(obj[key]);
    }
    return res;
  }

  return obj;
}

function cleanUrls(body: any): any {
  if (body === null || body === undefined) return body;

  if (typeof body === "string") {
    const apiPrefix = `${NEST_API_URL}/api/upload/`;
    const cleanPrefix = `${NEST_API_URL}/upload/`;
    const uploadsPrefix = `${NEST_API_URL}/uploads/`;
    if (body.startsWith(apiPrefix)) {
      return body.substring(NEST_API_URL.length + 4);
    }
    if (body.startsWith(cleanPrefix)) {
      return body.substring(NEST_API_URL.length);
    }
    if (body.startsWith(uploadsPrefix)) {
      return body.substring(NEST_API_URL.length);
    }
    return body;
  }

  if (Array.isArray(body)) {
    return body.map(cleanUrls);
  }

  if (typeof body === "object") {
    const res: any = {};
    for (const key of Object.keys(body)) {
      res[key] = cleanUrls(body[key]);
    }
    return res;
  }

  return body;
}

async function handleResponse(response: Response, endpoint = "") {
  if (response.status === 401) {
    const isAuthEndpoint =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/register") ||
      endpoint.includes("/auth/reset-password") ||
      endpoint.includes("/auth/forgot-password");

    let errMsg = "Unauthorized";
    try {
      const errText = await response.text();
      if (errText) {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.message || errMsg;
      }
    } catch {
      // ignore
    }

    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const isLoginPage =
        pathname === "/auth" ||
        pathname === "/association/login" ||
        pathname.startsWith("/association/login") ||
        pathname === "/vione/login" ||
        pathname.startsWith("/vione/login");

      // NẾU LỖI XẢY RA KHI ĐANG Ở TRANG ĐĂNG NHẬP HOẶC KHI GỌI ENDPOINT ĐĂNG NHẬP:
      // TUYỆT ĐỐI KHÔNG REDIRECT, để màn hình login hiển thị thông báo lỗi cho người dùng nhập lại!
      if (isAuthEndpoint || isLoginPage) {
        throw new Error(errMsg === "Unauthorized" ? "Thông tin đăng nhập hoặc mật khẩu không chính xác." : errMsg);
      }

      // Xóa phiên đăng nhập hết hạn
      localStorage.removeItem("vibe_token");
      localStorage.removeItem("vibe_refresh_token");
      document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      // Nếu token hết hạn ở App Hiệp hội -> về /association/login
      if (pathname.startsWith("/association")) {
        window.location.href = `/association/login?reason=expired&redirect=${encodeURIComponent(pathname + window.location.search)}`;
      } else if (pathname.startsWith("/connect-app")) {
        window.location.href = `/vione/login?reason=expired&redirect=${encodeURIComponent(pathname + window.location.search)}`;
      } else {
        window.location.href = `/auth?reason=expired&redirect=${encodeURIComponent(pathname + window.location.search)}`;
      }
    }
    throw new Error(errMsg);
  }
  if (!response.ok) {
    let errDetail = response.statusText;
    try {
      const errText = await response.text();
      if (errText) {
        const errJson = JSON.parse(errText);
        errDetail = errJson?.message || errDetail;
      }
    } catch {
      // ignore
    }
    throw new Error(errDetail || `API request failed: ${response.status}`);
  }
  const text = await response.text();
  if (!text || text === "null") {
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    return transformUrls(parsed);
  } catch (e) {
    return null;
  }
}

export async function fetchNestApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vibe_token") : null;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const mappedEndpoint = mapEndpoint(endpoint);
  let requestBody = options.body;
  if (
    requestBody &&
    typeof requestBody === "object" &&
    !(requestBody instanceof FormData) &&
    !(typeof Blob !== "undefined" && requestBody instanceof Blob) &&
    !(typeof ArrayBuffer !== "undefined" && requestBody instanceof ArrayBuffer)
  ) {
    requestBody = JSON.stringify(cleanUrls(requestBody));
  } else if (requestBody && typeof requestBody === "string") {
    try {
      const parsedBody = JSON.parse(requestBody);
      requestBody = JSON.stringify(cleanUrls(parsedBody));
    } catch (e) {
      // Ignore if not JSON
    }
  }

  const response = await fetch(`${NEST_API_URL}${mappedEndpoint}`, {
    ...options,
    body: requestBody,
    headers,
  });

  return handleResponse(response, endpoint);
}

export async function fetchNestApiFromServer<T = any>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const mappedEndpoint = mapEndpoint(endpoint);
  let requestBody = options.body;
  if (
    requestBody &&
    typeof requestBody === "object" &&
    !(requestBody instanceof FormData) &&
    !(typeof Blob !== "undefined" && requestBody instanceof Blob) &&
    !(typeof ArrayBuffer !== "undefined" && requestBody instanceof ArrayBuffer)
  ) {
    requestBody = JSON.stringify(cleanUrls(requestBody));
  } else if (requestBody && typeof requestBody === "string") {
    try {
      const parsedBody = JSON.parse(requestBody);
      requestBody = JSON.stringify(cleanUrls(parsedBody));
    } catch (e) {
      // Ignore if not JSON
    }
  }

  const response = await fetch(`${NEST_API_URL}${mappedEndpoint}`, {
    ...options,
    body: requestBody,
    headers,
  });

  return handleResponse(response);
}

export async function uploadFileToNest(file: File | Blob, filename: string): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vibe_token") : null;
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const formData = new FormData();
  formData.append("file", file, filename);

  const response = await fetch(`${NEST_API_URL}/api/upload/file`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const text = await response.text();
  const data = JSON.parse(text);
  const transformed = transformUrls(data);
  return transformed?.url || data.url;
}

export const uploadFile = uploadFileToNest;

