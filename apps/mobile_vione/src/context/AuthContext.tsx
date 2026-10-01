import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, setAuthToken, STORAGE_KEYS } from "../api/client";
import { UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  quickDemoLogin: (role?: "admin" | "executive") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dữ liệu mẫu C-Level dự phòng khi chạy offline hoặc thử nghiệm nhanh
const DEMO_EXECUTIVE_PROFILE: UserProfile = {
  id: "exec-vione-01",
  email: "admin@vione.vn",
  displayName: "Administrator",
  name: "Administrator",
  title: "Doanh Nhân ViOne",
  company: "Tập Đoàn Công Nghệ ViOne",
  phone: "0988 123 456",
  bio: "Chuyên gia chuyển đổi số doanh nghiệp & Kết nối đầu tư B2B.",
  code: "VIONE-8888",
  memberCode: "VIONE-8888",
  industry: "Công Nghệ & Đầu Tư",
  website: "https://vione.vn",
  isVerified: true,
  shareUrl: "https://vione.vn/c/VIONE-8888",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên làm việc khi mở ứng dụng
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUserStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (savedToken && savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          setAuthToken(savedToken);
          setTokenState(savedToken);
          setUser(parsedUser);
        }
      } catch (e) {
        console.warn("Lỗi khôi phục phiên đăng nhập:", e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ access_token: string; user?: any }>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password: pass },
      });

      if (res.data?.access_token) {
        const receivedToken = res.data.access_token;
        const rawUser = res.data.user || {};
        const profile: UserProfile = {
          id: rawUser.id || "usr-" + Date.now(),
          email: rawUser.email || email.trim(),
          displayName: rawUser.name || rawUser.displayName || email.split("@")[0],
          name: rawUser.name || rawUser.displayName || email.split("@")[0],
          title: rawUser.title || "Doanh Nhân C-Level",
          company: rawUser.company || "ViOne Business Network",
          phone: rawUser.phone || "",
          code: rawUser.code || "VN-" + Math.floor(1000 + Math.random() * 9000),
          avatarUrl: rawUser.avatarUrl || null,
          isVerified: true,
          shareUrl: `https://vione.vn/c/${rawUser.code || "VIONE"}`,
        };

        setAuthToken(receivedToken);
        setTokenState(receivedToken);
        setUser(profile);

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, receivedToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));

        return { success: true };
      }

      // Nếu API trả lỗi hoặc không có kết nối, kiểm tra nếu là tài khoản demo
      if (email.toLowerCase().includes("admin") || email.toLowerCase().includes("vione")) {
        const demoProfile = { ...DEMO_EXECUTIVE_PROFILE, email };
        const demoToken = "demo-jwt-token-" + Date.now();
        setAuthToken(demoToken);
        setTokenState(demoToken);
        setUser(demoProfile);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, demoToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoProfile));
        return { success: true };
      }

      return { success: false, error: res.error || "Email hoặc mật khẩu không chính xác" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi kết nối máy chủ" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickDemoLogin = useCallback(async (role: "admin" | "executive" = "executive") => {
    setIsLoading(true);
    const demoProfile = {
      ...DEMO_EXECUTIVE_PROFILE,
      displayName: role === "admin" ? "Ban Điều Hành ViOne" : "Nguyễn Văn Hùng",
      title: role === "admin" ? "Quản Trị Viên Cấp Cao" : "Tổng Giám Đốc",
    };
    const demoToken = "demo-jwt-token-" + Date.now();
    setAuthToken(demoToken);
    setTokenState(demoToken);
    setUser(demoProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, demoToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoProfile));
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
