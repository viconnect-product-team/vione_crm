import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/lib/i18n";
import { LuxuryLangSwitcher } from "@/components/LuxuryLangSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  X,
  TrendingUp,
  Users,
  Bot,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import { classifyAuthError, type AuthErrorInfo } from "@/lib/business-connect/mobile/auth-error";
import {
  applyRememberPreference,
  getRememberPreference,
  getRememberedEmail,
} from "@/lib/business-connect/mobile/auth-session";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    redirect?: string;
    m?: "1";
    reason?: "expired";
    portal?: "connect" | "vione" | "association" | "crm" | "admin";
  } => ({
    ...(typeof search.redirect === "string" ? { redirect: search.redirect } : {}),
    ...(search.m === "1" ? { m: "1" as const } : {}),
    ...(search.reason === "expired" ? { reason: "expired" as const } : {}),
    ...(search.portal === "association" ? { portal: "association" as const } : {}),
    ...(search.portal === "connect" || search.portal === "vione" ? { portal: "connect" as const } : {}),
    ...(search.portal === "crm" || search.portal === "admin" ? { portal: "crm" as const } : {}),
  }),
  head: () => ({
    meta: [{ title: "Đăng nhập ViOne CRM — Hệ thống Quản trị Doanh nghiệp" }],
  }),
  component: CrmAdminAuthPage,
});

function safeRedirect(target?: string): string | null {
  if (!target) return null;
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname + url.search + url.hash;
    if (path.startsWith("/auth") || path.includes("/login")) return null;
    return path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

function CrmAdminAuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const { redirect: redirectTo, reason, portal: searchPortal } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [remember, setRemember] = useState(true);
  const { user, setAuthData } = useAuth();

  const destPath = safeRedirect(redirectTo) ?? "";

  // Tự động phân luồng theo portal chuyên biệt
  useEffect(() => {
    if (searchPortal === "crm" || searchPortal === "admin") {
      return;
    }
    if (searchPortal === "association" || (destPath.startsWith("/association") || destPath.startsWith("/m"))) {
      navigate({
        to: "/association/login" as any,
        search: { redirect: redirectTo } as any,
        replace: true,
      });
      return;
    }
    if (searchPortal === "connect" || searchPortal === "vione") {
      navigate({
        to: "/vione/login" as any,
        search: { redirect: redirectTo } as any,
        replace: true,
      });
      return;
    }
  }, [searchPortal, destPath, redirectTo, navigate]);

  async function goPostLogin() {
    const target = safeRedirect(redirectTo);
    if (
      target &&
      !target.startsWith("/connect-app") &&
      !target.startsWith("/vione") &&
      !target.startsWith("/auth") &&
      !target.startsWith("/association/login")
    ) {
      navigate({ to: target as any, replace: true });
      return;
    }
    navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    if (reason !== "expired") return;
    setAuthErrorInfo(null);
    toast.error(t("auth.sessionExpired"));
  }, [reason, t]);

  useEffect(() => {
    setRemember(getRememberPreference());
    const saved = getRememberedEmail();
    if (saved) setEmail((v) => v || saved);
  }, []);

  useEffect(() => {
    if (user) {
      void goPostLogin();
    }
  }, [user]);

  async function submit() {
    if (!email.trim()) {
      setAuthError("Vui lòng nhập tài khoản hoặc email quản trị");
      return;
    }
    if (!password) {
      setAuthError("Vui lòng nhập mật khẩu");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setAuthError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthErrorInfo(null);

    try {
      if (mode === "signup") {
        await fetchNestApi("/auth/register", {
          method: "POST",
          body: JSON.stringify({ username: email.trim(), password }),
        });
        toast.success(t("auth.signUpSuccess") || "Đăng ký thành công! Hãy đăng nhập");
        setMode("signin");
      } else {
        const res = await fetchNestApi("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (!res?.access_token) {
          throw new Error("Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.");
        }
        setAuthData(res);
        applyRememberPreference(remember, email.trim());
        await goPostLogin();
      }
    } catch (e: any) {
      const info = classifyAuthError(e, { provider: "password" });
      setAuthErrorInfo(info);
      const msg = t(info.messageKey as Parameters<typeof t>[0]) || e?.message || "Đăng nhập thất bại";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic Keyframes for seamless floating zero-gravity animations */}
      <style>{`
        @keyframes vione-orbit-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes vione-orbit-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes vione-free-float-1 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(-10px, -18px) rotate(1.2deg); }
        }
        @keyframes vione-free-float-2 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(12px, -14px) rotate(-1.5deg); }
        }
        @keyframes vione-free-float-3 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(-12px, 16px) rotate(-1deg); }
        }
        @keyframes vione-free-float-4 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(10px, 18px) rotate(1.2deg); }
        }
        @keyframes vione-pulse-aura {
          0%, 100% { opacity: 0.35; transform: scale(0.96); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }
        @keyframes vione-particle-drift {
          0% { transform: translateY(0px) scale(0.9); opacity: 0.3; }
          50% { transform: translateY(-16px) scale(1.15); opacity: 0.85; }
          100% { transform: translateY(0px) scale(0.9); opacity: 0.3; }
        }
        .anim-orbit-cw { animation: vione-orbit-cw 42s linear infinite; }
        .anim-orbit-ccw { animation: vione-orbit-ccw 28s linear infinite; }
        .anim-float-free-1 { animation: vione-free-float-1 7s ease-in-out infinite; }
        .anim-float-free-2 { animation: vione-free-float-2 8s ease-in-out infinite 0.8s; }
        .anim-float-free-3 { animation: vione-free-float-3 7.5s ease-in-out infinite 1.5s; }
        .anim-float-free-4 { animation: vione-free-float-4 8.5s ease-in-out infinite 2.2s; }
        .anim-aura-glow { animation: vione-pulse-aura 5s ease-in-out infinite; }
        .anim-particle-1 { animation: vione-particle-drift 4.5s ease-in-out infinite 0.3s; }
        .anim-particle-2 { animation: vione-particle-drift 5.5s ease-in-out infinite 1.8s; }
        .anim-particle-3 { animation: vione-particle-drift 6s ease-in-out infinite 2.5s; }
      `}</style>

      {/* 1. Ảnh chìm nền Skyline Architecture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90 dark:opacity-40"
        style={{
          backgroundImage: "url('/skyline_perspective_light.jpg')",
        }}
      />

      {/* 2. Soft Light / Dark Overlay for Optimal Contrast */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-white/88 via-slate-50/78 to-white/92 dark:from-slate-950/92 dark:via-slate-900/85 dark:to-slate-950/94 backdrop-blur-[2px]" />

      {/* 3. Ambient Champagne Gold Glow Accents */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle at 30% 35%, rgba(223, 183, 108, 0.32) 0%, rgba(201, 158, 85, 0.1) 50%, transparent 75%)",
        }}
      />
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-amber-400/20 blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-200/25 blur-[140px]" />

      {/* Top Navbar */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-amber-400/15 backdrop-blur-md bg-white/40 dark:bg-slate-950/40">
        <a
          href="https://viconnect.vn/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 transition hover:text-amber-950 dark:hover:text-amber-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Website chính thức</span>
        </a>
        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />
          <LuxuryLangSwitcher />
        </div>
      </header>

      {/* Main Content: 2 Cột (Animation Bên Trái Lơ Lửng Tự Nhiên & Đăng Nhập Sát Bên Phải) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* CỘT BÊN TRÁI: GIAO DIỆN ANIMATION LƠ LỬNG TỰ NHIÊN (HOÀN TOÀN KHÔNG BORDER, KHÔNG BACKGROUND CARD) */}
          <div className="lg:col-span-7 w-full hidden lg:flex flex-col justify-center relative min-h-[580px]">
            
            {/* Header Text giới thiệu kiến trúc điều hành (Nhẹ nhàng, bay bổng không viền) */}
            <div className="relative z-10 mb-4 pl-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>KIẾN TRÚC ĐIỀU HÀNH DOANH NGHIỆP C-LEVEL</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Vận Hành Tự Động Hóa & <br />
                <span className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 dark:from-amber-400 dark:via-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
                  Kết Nối Khách Hàng B2B
                </span>
              </h2>
              <p className="mt-2 text-xs sm:text-[13.5px] text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Nền tảng kiểm soát dòng tiền, phê duyệt VietQR 3 cấp và tối ưu hóa phễu kinh doanh đa chi nhánh cùng Trợ lý AI Copilot.
              </p>
            </div>

            {/* Khu vực Animation: Trôi tự do trong không gian (Zero Background, Zero Border) */}
            <div className="relative w-full h-[450px] flex items-center justify-center select-none pointer-events-none">
              
              {/* Glowing Aura Particle Clusters bay lơ lửng */}
              <div className="absolute top-12 left-1/4 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_15px_#DFB76C] anim-particle-1" />
              <div className="absolute bottom-16 right-1/3 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_#DFB76C] anim-particle-2" />
              <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_#C99E55] anim-particle-3" />

              {/* Hào quang tâm điểm phát sáng dịu mắt */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 rounded-full bg-amber-400/20 dark:bg-amber-500/15 blur-[110px] anim-aura-glow" />
              </div>

              {/* 1. Các Vòng Quỹ Đạo Ánh Sáng Xoay Tự Do (Orbital Rings in Open Space) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Vòng ngoài lớn */}
                <div className="w-[380px] h-[380px] rounded-full border border-amber-400/20 anim-orbit-cw flex items-center justify-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_14px_#DFB76C]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#DFB76C]" />
                </div>
                {/* Vòng giữa nét đứt kim loại mạ vàng */}
                <div className="w-[270px] h-[270px] rounded-full border border-dashed border-amber-400/35 anim-orbit-ccw flex items-center justify-center">
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_#C99E55]" />
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_#DFB76C]" />
                </div>
                {/* Vòng trong tinh tế */}
                <div className="w-[170px] h-[170px] rounded-full border border-amber-400/15 anim-orbit-cw flex items-center justify-center" />
                
                {/* Lõi Trung Tâm Holographic Core ViOne (Bay lơ lửng) */}
                <div className="relative z-10 flex flex-col items-center justify-center anim-aura-glow">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-amber-400/35 via-white/85 to-amber-300/40 dark:from-amber-600/35 dark:via-slate-800 dark:to-amber-400/35 p-[2px] shadow-[0_0_40px_rgba(223,183,108,0.5)] backdrop-blur-xl">
                    <div className="h-full w-full rounded-full bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center p-2 text-center shadow-inner">
                      <img
                        src="/vione-gold-192.png"
                        alt="ViOne Core"
                        className="h-9 w-9 object-contain drop-shadow-md"
                      />
                      <span className="text-[9.5px] font-black text-amber-700 dark:text-amber-400 tracking-wider mt-0.5">VIONE AI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Bốn Thẻ KPI Động Lơ Lửng Độc Lập Trôi Tự Do (Floating Orbit Satellites) */}

              {/* Thẻ 1: Doanh Thu & Dòng Tiền (Góc Trên Trái) */}
              <div className="absolute top-2 left-2 xl:left-6 z-20 anim-float-free-1">
                <div className="rounded-2xl border border-amber-400/40 bg-white/90 dark:bg-slate-900/90 p-4 shadow-[0_16px_36px_rgba(216,178,130,0.22)] backdrop-blur-2xl w-58">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> +38.5%
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dòng Tiền & Doanh Thu</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Duyệt chi VietQR 3 cấp</div>
                </div>
              </div>

              {/* Thẻ 2: ViOne AI Copilot (Góc Trên Phải) */}
              <div className="absolute top-4 right-2 xl:right-6 z-20 anim-float-free-2">
                <div className="rounded-2xl border border-amber-400/40 bg-white/90 dark:bg-slate-900/90 p-4 shadow-[0_16px_36px_rgba(216,178,130,0.22)] backdrop-blur-2xl w-58">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                      Live AI 24/7
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Trợ Lý Điều Hành</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Cảnh báo & Phân tích tự động</div>
                </div>
              </div>

              {/* Thẻ 3: Mạng Lưới Khách Hàng B2B (Góc Dưới Trái) */}
              <div className="absolute bottom-6 left-2 xl:left-6 z-20 anim-float-free-3">
                <div className="rounded-2xl border border-amber-400/40 bg-white/90 dark:bg-slate-900/90 p-4 shadow-[0_16px_36px_rgba(216,178,130,0.22)] backdrop-blur-2xl w-58">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">1,280+ Đối tác</div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Doanh nghiệp B2B kết nối</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full w-[88%]" />
                  </div>
                </div>
              </div>

              {/* Thẻ 4: Vận Hành Đa Chi Nhánh (Góc Dưới Phải) */}
              <div className="absolute bottom-4 right-2 xl:right-6 z-20 anim-float-free-4">
                <div className="rounded-2xl border border-amber-400/40 bg-white/90 dark:bg-slate-900/90 p-4 shadow-[0_16px_36px_rgba(216,178,130,0.22)] backdrop-blur-2xl w-58">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-full">
                      SLA 99.98%
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đồng Bộ Hệ Thống</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Đa Chi Nhánh Thời Gian Thực</div>
                </div>
              </div>

              {/* Dải Trạng Thái Hệ Thống Bay Tự Nhiên Ở Dưới Cùng */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-amber-400/25 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-300 backdrop-blur-xl shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Hệ thống ViOne CRM sẵn sàng kết nối</span>
                <span className="text-amber-500 font-bold">• Enterprise v5.0</span>
              </div>

            </div>

          </div>

          {/* CỘT BÊN PHẢI: MÀN HÌNH ĐĂNG NHẬP SÁT BÊN PHẢI */}
          <div className="lg:col-span-5 w-full max-w-md ml-auto">
            <div className="rounded-3xl border border-amber-400/35 bg-white/95 dark:bg-slate-900/90 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_25px_60px_rgba(216,178,130,0.22),0_10px_35px_rgba(15,23,42,0.08)] text-slate-900 dark:text-slate-100 transition-all duration-200">
              
              {/* Brand Logo & Hệ Thống Text (Chỉ logo ViOne + text hệ thống) */}
              <div className="flex flex-col items-center justify-center text-center">
                <a
                  href="https://viconnect.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-transform hover:scale-[1.02]"
                >
                  <img
                    src="/vione-wordmark.png"
                    alt="ViOne Logo"
                    className="h-11 sm:h-12 w-auto object-contain drop-shadow-sm"
                  />
                </a>

                <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 border border-amber-400/30 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP CRM</span>
                </div>

                <h1 className="mt-3 text-2xl sm:text-[25px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {mode === "signin" ? "Đăng nhập Hệ thống" : "Đăng ký Quản trị viên"}
                </h1>
                <p className="mt-1 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-[20rem]">
                  ViOne Enterprise Management & AI Copilot Platform
                </p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-300 leading-relaxed shadow-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="font-semibold">{authError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* Form Đăng Nhập */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tài khoản / Email
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@connect.vn"
                    className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/80 dark:bg-slate-800/80 px-4 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mật khẩu
                    </label>
                    {mode === "signin" && (
                      <Link
                        to="/forgot-password"
                        search={{ email: email.trim() || undefined }}
                        className="text-[11.5px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:underline transition-colors"
                      >
                        {t("auth.forgotPassword")}
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/80 dark:bg-slate-800/80 px-4 pr-11 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/80 dark:bg-slate-800/80 px-4 pr-11 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Ghi nhớ đăng nhập */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-400/30 accent-amber-600"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                </div>

                {/* Nút Đăng nhập Hoàng Gia Champagne Gold */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative mt-2 flex h-12 w-full items-center justify-center rounded-xl text-[15px] sm:text-[16px] font-bold text-slate-950 transition-all hover:bg-[#d4a85a] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg bg-[#DFB76C] border border-[#f0d499]/80 shadow-amber-500/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 text-slate-950 font-bold">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-950" /> Đang xử lý...
                    </span>
                  ) : mode === "signin" ? (
                    "Đăng nhập Hệ thống CRM"
                  ) : (
                    "Đăng ký Quản trị viên"
                  )}
                  {!loading && (
                    <ArrowRight
                      className="absolute right-5 sm:right-6 h-5 w-5 text-slate-950 font-bold"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </form>

              {/* Chuyển đổi Đăng nhập / Đăng ký */}
              <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setAuthError(null);
                  }}
                  className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 transition-colors hover:text-amber-600 dark:hover:text-[#DFB76C] cursor-pointer"
                >
                  {mode === "signin" ? (
                    <span>Chưa có tài khoản quản trị? <strong className="text-amber-600 dark:text-[#DFB76C] underline underline-offset-4">Đăng ký ngay</strong></span>
                  ) : (
                    <span>Đã có tài khoản quản trị? <strong className="text-amber-600 dark:text-[#DFB76C] underline underline-offset-4">Đăng nhập</strong></span>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 w-full py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-amber-400/10 backdrop-blur-sm bg-white/30 dark:bg-slate-950/30">
        <span>© {new Date().getFullYear()} ViOne Platform • Hệ thống Quản trị & Điều hành Doanh nghiệp Toàn diện</span>
      </footer>
    </main>
  );
}
