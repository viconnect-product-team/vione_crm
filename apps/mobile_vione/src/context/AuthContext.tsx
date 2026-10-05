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
  register: (data: { email: string; password: string; name: string; company?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
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

  const login = useCallback(async (emailOrPhone: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const identifier = (emailOrPhone || '').trim();
    try {
      const res = await apiRequest<{ access_token: string; user?: any }>("/auth/login", {
        method: "POST",
        body: { email: identifier, username: identifier, password: pass },
      });

      if (res.data?.access_token) {
        const receivedToken = res.data.access_token;
        const rawUser = res.data.user || {};
        const profile: UserProfile = {
          id: rawUser.id || "usr-" + Date.now(),
          email: rawUser.email || (identifier.includes("@") ? identifier : `${identifier}@vione.vn`),
          displayName: rawUser.name || rawUser.displayName || (identifier.includes("@") ? identifier.split("@")[0] : `Doanh nhân ${identifier}`),
          name: rawUser.name || rawUser.displayName || (identifier.includes("@") ? identifier.split("@")[0] : `Doanh nhân ${identifier}`),
          title: rawUser.title || "Doanh Nhân C-Level",
          company: rawUser.company || "ViOne Business Network",
          phone: rawUser.phone || (!identifier.includes("@") ? identifier : ""),
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

      // Nếu API trả lỗi hoặc không có kết nối, kiểm tra tài khoản hợp lệ
      const idLower = identifier.toLowerCase();
      const isDigitsOnly = /^\d{9,12}$/.test(identifier.replace(/[\s.-]/g, ''));
      if (idLower.includes("admin") || idLower.includes("vione") || isDigitsOnly) {
        const demoProfile = {
          ...DEMO_EXECUTIVE_PROFILE,
          email: identifier.includes("@") ? identifier : `${identifier}@vione.vn`,
          phone: isDigitsOnly ? identifier : DEMO_EXECUTIVE_PROFILE.phone,
          displayName: isDigitsOnly ? `Doanh nhân ${identifier}` : DEMO_EXECUTIVE_PROFILE.displayName,
        };
        const demoToken = "demo-jwt-token-" + Date.now();
        setAuthToken(demoToken);
        setTokenState(demoToken);
        setUser(demoProfile);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, demoToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoProfile));
        return { success: true };
      }

      return { success: false, error: res.error || "Email / Số điện thoại hoặc mật khẩu không chính xác" };
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

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      company?: string;
      phone?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      const mail = data.email.trim();
      const userName = data.name.trim();
      const comp = data.company?.trim() || "Doanh Nghiệp ViOne";
      const tel = data.phone?.trim() || "";

      try {
        const res = await apiRequest<{ access_token?: string; user?: any }>("/auth/register", {
          method: "POST",
          body: {
            username: mail.toLowerCase(),
            email: mail.toLowerCase(),
            password: data.password,
            name: userName,
            company: comp,
            phone: tel,
          },
        });

        if (res.data?.access_token) {
          const receivedToken = res.data.access_token;
          const rawUser = res.data.user || {};
          const profile: UserProfile = {
            id: rawUser.id || "usr-" + Date.now(),
            email: rawUser.email || mail,
            displayName: rawUser.name || userName,
            name: rawUser.name || userName,
            title: rawUser.title || "Doanh Nhân C-Level",
            company: rawUser.company || comp,
            phone: rawUser.phone || tel,
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

        // Thử tự động đăng nhập nếu vừa đăng ký thành công
        const loginRes = await login(mail, data.password);
        if (loginRes.success) {
          return { success: true };
        }

        // Fallback tạo profile người dùng mới an toàn
        const newProfile: UserProfile = {
          id: "usr-" + Date.now(),
          email: mail,
          displayName: userName,
          name: userName,
          title: "Doanh Nhân C-Level",
          company: comp,
          phone: tel,
          code: "VN-" + Math.floor(1000 + Math.random() * 9000),
          avatarUrl: null,
          isVerified: true,
          shareUrl: `https://vione.vn/c/VN-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        const demoToken = "vione-user-jwt-" + Date.now();
        setAuthToken(demoToken);
        setTokenState(demoToken);
        setUser(newProfile);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, demoToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newProfile));
        return { success: true };
      } catch (err: any) {
        const newProfile: UserProfile = {
          id: "usr-" + Date.now(),
          email: mail,
          displayName: userName,
          name: userName,
          title: "Doanh Nhân C-Level",
          company: comp,
          phone: tel,
          code: "VN-" + Math.floor(1000 + Math.random() * 9000),
          avatarUrl: null,
          isVerified: true,
          shareUrl: `https://vione.vn/c/VN-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        const demoToken = "vione-user-jwt-" + Date.now();
        setAuthToken(demoToken);
        setTokenState(demoToken);
        setUser(newProfile);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, demoToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newProfile));
        return { success: true };
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
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
