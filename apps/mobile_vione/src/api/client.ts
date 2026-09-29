import AsyncStorage from "@react-native-async-storage/async-storage";

// Máy chủ mặc định của ViOne Connect Platform (cổng HTTPS 5445 hoặc máy chủ trực tiếp)
export const DEFAULT_API_BASE_URL = "https://14.225.217.232:5445/api";
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

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const token = await getAuthToken();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${DEFAULT_API_BASE_URL}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const config: RequestInit = {
      method: options.method || "GET",
      headers,
    };

    if (options.body && options.method !== "GET") {
      config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token hết hạn
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      currentToken = null;
      return { data: null, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = json?.message || `Lỗi máy chủ (${response.status})`;
      return { data: null, error: Array.isArray(msg) ? msg.join(", ") : msg };
    }

    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Không thể kết nối đến máy chủ" };
  }
}
