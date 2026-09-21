import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  Shield,
  User,
  X,
} from "lucide-react";
import { useT, useLang } from "@/lib/i18n";
import { LuxuryLangSwitcher } from "@/components/LuxuryLangSwitcher";

interface Props {
  identifier: string;
  password: string;
  loading?: boolean;
  errorMessage?: string | null;
  errorHint?: string | null;
  onRetry?: (() => void) | null;
  secondaryLabel?: string | null;
  onSecondary?: (() => void) | null;
  onDismissError?: () => void;
  onIdentifierChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onSubmit: () => void;
  onScanCard?: () => void;
  remember?: boolean;
  onRememberChange?: (val: boolean) => void;
}

export function AssociationAppSignIn({
  identifier,
  password,
  loading = false,
  errorMessage = null,
  errorHint = null,
  onRetry = null,
  secondaryLabel = null,
  onSecondary = null,
  onDismissError,
  onIdentifierChange,
  onPasswordChange,
  onSubmit,
  onScanCard,
  remember: rememberProp,
  onRememberChange,
}: Props) {
  const t = useT();
  const { lang } = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLocal, setRememberLocal] = useState(true);
  const remember = rememberProp ?? rememberLocal;
  const toggleRemember = () => {
    const next = !remember;
    setRememberLocal(next);
    onRememberChange?.(next);
  };

  const fieldClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-[14px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 shadow-xs";

  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto flex flex-col justify-center select-none bg-slate-50 text-slate-900">
      {/* Dynamic Ambient Background with Soft Royal Blue Lights */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-36 -left-36 h-[500px] w-[500px] rounded-full bg-[#003B95]/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-36 h-[550px] w-[550px] rounded-full bg-[#003B95]/10 blur-[140px]" />
        <div className="absolute -bottom-36 left-1/3 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[130px]" />
        {/* Subtle grid pattern for modern corporate identity */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(#003B95 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Bulletproof Autofill CSS Reset for pure white inputs */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #0f172a !important;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          box-shadow: 0 0 0px 1000px #ffffff inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
          caret-color: #003B95 !important;
        }
      `}</style>

      <div
        className="relative z-10 mx-auto flex min-h-[100dvh] md:min-h-0 w-full max-w-md flex-col justify-between md:justify-center md:gap-4 px-6 py-6 my-auto md:border md:border-amber-500/20 md:bg-white/95 md:backdrop-blur-2xl md:rounded-3xl md:p-8 md:shadow-[0_20px_60px_-15px_rgba(0,59,149,0.15),0_0_0_1px_rgba(245,158,11,0.2)]"
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Top bar: Language Switcher aligned right */}
        <div className="flex items-center justify-end shrink-0 pt-0.5">
          <LuxuryLangSwitcher variant="subtle-blue" />
        </div>

        {/* Brand Header: Only Large Logo */}
        <div className="flex flex-col items-center justify-center text-center py-4 shrink-0">
          <img
            src="/ceo1983-logo.png"
            alt="CLB Doanh Nhân CEO 1983"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_8px_25px_rgba(0,75,145,0.15)] transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="my-1 rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-800 leading-snug shrink-0 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">{errorMessage}</p>
                {errorHint && <p className="mt-0.5 text-[11px] text-red-700">{errorHint}</p>}
              </div>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  aria-label="Đóng thông báo"
                  className="-mr-1 -mt-1 flex h-5 w-5 items-center justify-center rounded-lg text-red-500 hover:bg-red-100 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            {(onRetry || (secondaryLabel && onSecondary)) && (
              <div className="mt-2 flex flex-wrap gap-2 pt-1 border-t border-red-200/60">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={loading}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 text-[11.5px] font-medium text-red-800 hover:bg-red-50 disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Thử lại
                  </button>
                )}
                {secondaryLabel && onSecondary && (
                  <button
                    type="button"
                    onClick={onSecondary}
                    className="inline-flex h-7 items-center rounded-lg px-2 text-[11.5px] font-medium text-red-800 underline underline-offset-4 hover:text-red-900 cursor-pointer"
                  >
                    {secondaryLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-3 shrink-0 my-1"
        >
          <div className="space-y-1">
            <label htmlFor="assoc-auth-id" className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wide">
              {lang === "en" ? "Email or Member Code" : "Email hoặc Mã hội viên"}
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#003B95]"
                aria-hidden="true"
              />
              <input
                id="assoc-auth-id"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => onIdentifierChange(e.target.value)}
                placeholder={lang === "en" ? "e.g. M1983-002 or email..." : "Ví dụ: M1983-002 hoặc email..."}
                className={fieldClass}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="assoc-auth-password" className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wide">
              {lang === "en" ? "Password" : "Mật khẩu"}
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#003B95]"
                aria-hidden="true"
              />
              <input
                id="assoc-auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder={lang === "en" ? "Enter password..." : "Nhập mật khẩu..."}
                className={fieldClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-[#003B95] cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={toggleRemember}
              className="flex items-center gap-2 text-[12.5px] cursor-pointer text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border transition-all ${
                  remember
                    ? "bg-[#003B95] border-[#003B95] text-white"
                    : "bg-white border-slate-300"
                }`}
                aria-hidden="true"
              >
                {remember && (
                  <svg
                    viewBox="0 0 20 20"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="font-medium">{lang === "en" ? "Remember me" : "Ghi nhớ đăng nhập"}</span>
            </button>
            <Link
              to="/forgot-password"
              className="text-[12.5px] font-semibold text-[#003B95] hover:text-[#002B70] hover:underline"
            >
              {lang === "en" ? "Forgot password?" : "Quên mật khẩu?"}
            </Link>
          </div>

          {/* Submit Button (CEO 1983 Navy) */}
          <button
            type="submit"
            disabled={loading}
            className="relative flex h-11 w-full items-center justify-center rounded-xl text-[15px] font-bold text-white transition-all shadow-lg shadow-blue-900/25 hover:shadow-blue-900/35 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer bg-[#003B95] hover:bg-[#002B70] mt-1.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" /> {lang === "en" ? "Verifying..." : "Đang xác thực..."}
              </span>
            ) : (
              lang === "en" ? "Sign in" : "Đăng nhập"
            )}
            {!loading && (
              <ArrowRight
                className="absolute right-4 h-4 w-4 text-white"
                aria-hidden="true"
              />
            )}
          </button>
        </form>

        {/* Member Activation Button -> Chuyển đến Landing Page CEO 1983 mới (/landing/ceo/v1) */}
        <div className="shrink-0 my-0.5">
          <Link
            to="/landing/ceo/v1"
            className="relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50/70 hover:bg-amber-100 text-[13.5px] font-semibold text-amber-900 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
          >
            <Shield className="h-4 w-4 text-[#003B95]" aria-hidden="true" />
            <span>{lang === "en" ? "Activate new member account" : "Kích hoạt tài khoản hội viên mới"}</span>
            <ChevronRight className="absolute right-4 h-4 w-4 text-[#003B95]" aria-hidden="true" />
          </Link>
        </div>

        {/* NFC / QR Smart Member Card Scan */}
        {onScanCard && (
          <button
            type="button"
            onClick={onScanCard}
            className="flex w-full flex-col items-center justify-center py-2.5 px-3.5 rounded-xl border border-dashed border-amber-500/50 bg-white hover:bg-amber-50/50 transition-colors text-center shrink-0 cursor-pointer active:opacity-80 shadow-2xs group"
          >
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-4.5 w-4.5 shrink-0 text-[#003B95]" aria-hidden="true" />
              <span className="text-[13px] font-bold text-[#003B95]">
                {lang === "en" ? "Tap NFC Card or Scan QR" : "Chạm thẻ NFC hoặc Quét mã QR"}
              </span>
            </div>
            <span className="block text-[11px] leading-tight text-slate-500 mt-0.5 text-center">
              {lang === "en" ? "Quick 1-tap sign in with Smart VIP Card" : "Đăng nhập nhanh 1 chạm bằng Thẻ Hội Viên Thông Minh"}
            </span>
          </button>
        )}

        {/* Minimal Footer Spacer */}
        <div className="shrink-0 py-1" />
      </div>
    </main>
  );
}
