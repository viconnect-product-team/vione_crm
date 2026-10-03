import AsyncStorage from "@react-native-async-storage/async-storage";

// Máy chủ chính thức của ViOne Connect Platform (cổng HTTPS 5445 và cổng phụ 5001)
export const DEFAULT_API_BASE_URL = "https://14.225.217.232:5445/api";
export const FALLBACK_API_BASE_URL = "http://14.225.217.232:5001/api";

export const STORAGE_KEYS = {
  TOKEN: "vione_access_token",
  USER: "vione_user_profile",
  REMEMBER_EMAIL: "vione_remember_email",
};

let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

export const getAuthToken = async (): Promise<string | null> => {
  if (currentToken) return currentToken;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    currentToken = saved;
    return saved;
  } catch {
    return null;
  }
};

/**
 * Chuẩn hóa endpoint đường dẫn, tương thích với cả format legacy PWA và RESTful backend
 */
function normalizeEndpoint(endpoint: string): string {
  let ep = endpoint.trim();
  // Loại bỏ tiền tố /api nếu đã có để tránh lặp /api/api
  if (ep.startsWith("/api/")) {
    ep = ep.substring(4);
  } else if (ep.startsWith("api/")) {
    ep = ep.substring(3);
  }

  // Tương thích các alias của ConnectApp sang Controller gốc nếu cần
  if (ep.startsWith("/connect-app/dm/")) {
    ep = ep.replace("/connect-app/dm/", "/dm/");
  } else if (ep.startsWith("connect-app/dm/")) {
    ep = ep.replace("connect-app/dm/", "dm/");
  } else if (ep.startsWith("/connect-app/me/")) {
    ep = ep.replace("/connect-app/me/", "/me/");
  } else if (ep.startsWith("connect-app/me/")) {
    ep = ep.replace("connect-app/me/", "me/");
  } else if (ep.startsWith("/connect-app/customers") || ep.startsWith("/connect-app/customer")) {
    ep = ep.replace(/\/connect-app\/customers?/, "/customers");
  } else if (ep.startsWith("connect-app/customers") || ep.startsWith("connect-app/customer")) {
    ep = ep.replace(/^connect-app\/customers?/, "customers");
  }

  return ep.startsWith("/") ? ep : `/${ep}`;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
  useFallbackOnFail?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<{ data: T | null; error: string | null; status?: number }> {
  const timeoutMs = options.timeoutMs || 10000;
  const cleanEndpoint = normalizeEndpoint(endpoint);
  const token = await getAuthToken();

  const makeCall = async (baseUrl: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${baseUrl}${cleanEndpoint}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };

      const config: RequestInit = {
        method: options.method || "GET",
        headers,
        signal: controller.signal,
      };

      if (options.body && options.method !== "GET") {
        config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      clearTimeout(timer);

      if (response.status === 401) {
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        currentToken = null;
        return { data: null, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", status: 401 };
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = json?.message || `Lỗi máy chủ (${response.status})`;
        return {
          data: null,
          error: Array.isArray(msg) ? msg.join(", ") : msg,
          status: response.status,
        };
      }

      return { data: json as T, error: null, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err?.name === "AbortError";
      return {
        data: null,
        error: isTimeout ? "Kết nối máy chủ bị quá thời gian (timeout)" : err?.message || "Không thể kết nối đến máy chủ",
        status: 0,
      };
    }
  };

  // Thử gọi máy chủ chính (HTTPS port 5445)
  const primaryResult = await makeCall(DEFAULT_API_BASE_URL);
  if (primaryResult.data !== null || primaryResult.status === 401 || !options.useFallbackOnFail) {
    return primaryResult;
  }

  // Thử gọi máy chủ fallback (HTTP port 5001) nếu kết nối thất bại
  return makeCall(FALLBACK_API_BASE_URL);
}

// Typed Helper shortcuts
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),
  put: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
