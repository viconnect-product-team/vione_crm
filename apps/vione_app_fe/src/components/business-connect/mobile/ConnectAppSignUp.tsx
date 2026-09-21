// Màn hình đăng ký cho PWA Connect App — cùng ngôn ngữ thiết kế navy/vàng
// với màn đăng nhập. Thuần trình bày: mọi trạng thái/hành động do route truyền vào.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import authBg from "@/assets/connect-auth-bg.jpg";

const NAVY = "#0A0A0B";
const GOLD = "#f2b45a";

export type SignUpStatus = "idle" | "loading" | "sent" | "error";

type Props = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  status: SignUpStatus;
  errorMessage?: string | null;
  onDismissError?: () => void;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: () => void;
};

export function ConnectAppSignUp({
  fullName,
  email,
  password,
  confirmPassword,
  status,
  errorMessage = null,
  onDismissError,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: Props) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const busy = status === "loading";

  const fieldClass =
    "h-13 w-full rounded-xl border bg-transparent pl-11 pr-11 text-[15px] outline-none transition-colors placeholder:opacity-60 focus-visible:ring-1";
  const fieldStyle = { borderColor: "#22384c", color: "#f5f7fa" } as const;

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: NAVY, color: "#f5f7fa" }}
    >
      <img
        src={authBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 w-full select-none object-cover opacity-40"
      />
      <div className="relative mx-auto w-full max-w-md px-6 pb-14 pt-6">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1 text-[15px]"
          style={{ color: "#8fa0b1" }}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          {t("bc.mobile.auth.signup.back")}
        </Link>

        {status === "sent" ? (
          <section className="mt-16 flex flex-col items-center text-center" aria-live="polite">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(201,163,91,0.14)",
                border: "1px solid rgba(201,163,91,0.35)",
              }}
              aria-hidden="true"
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: GOLD }} />
            </span>
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight">
              {t("bc.mobile.auth.signup.sentTitle")}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#a9b6c4" }}>
              {t("bc.mobile.auth.signup.sentSubtitle")}
            </p>
            <p className="mt-3 text-[15px] font-medium" style={{ color: GOLD }}>
              {email}
            </p>
            <Link
              to="/auth"
              className="mt-8 flex h-14 w-full items-center justify-center rounded-xl text-[17px] font-semibold text-[#1b1206]"
              style={{ background: "linear-gradient(135deg, #AB6D3C 0%, #FDE6B4 100%)" }}
            >
              {t("bc.mobile.auth.signup.toSignIn")}
            </Link>
          </section>
        ) : (
          <>
            <h1 className="mt-8 text-[28px] font-semibold tracking-tight">
              {t("bc.mobile.auth.signup.title")}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#a9b6c4" }}>
              {t("bc.mobile.auth.signup.subtitle")}
            </p>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-[14px]"
                style={{ background: "rgba(255,107,95,0.12)", border: "1px solid #57302d" }}
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#ff9d95" }} />
                <span className="flex-1">{errorMessage}</span>
                {onDismissError ? (
                  <button
                    type="button"
                    onClick={onDismissError}
                    aria-label={t("bc.mobile.auth.dismissError")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <form
              className="mt-7 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) onSubmit();
              }}
            >
              <div>
                <label className="mb-2 block text-[15px]" htmlFor="bc-signup-name">
                  {t("bc.mobile.auth.signup.nameLabel")}
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                    style={{ color: "#7d8d9d" }}
                    aria-hidden="true"
                  />
                  <input
                    id="bc-signup-name"
                    className={fieldClass}
                    style={fieldStyle}
                    autoComplete="name"
                    value={fullName}
                    disabled={busy}
                    onChange={(e) => onFullNameChange(e.target.value)}
                    placeholder={t("bc.mobile.auth.signup.namePlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[15px]" htmlFor="bc-signup-email">
                  {t("bc.mobile.auth.signup.emailLabel")}
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                    style={{ color: "#7d8d9d" }}
                    aria-hidden="true"
                  />
                  <input
                    id="bc-signup-email"
                    className={fieldClass}
                    style={fieldStyle}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    disabled={busy}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder={t("bc.mobile.auth.emailPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[15px]" htmlFor="bc-signup-password">
                  {t("bc.mobile.auth.passwordLabel")}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                    style={{ color: "#7d8d9d" }}
                    aria-hidden="true"
                  />
                  <input
                    id="bc-signup-password"
                    className={fieldClass}
                    style={fieldStyle}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    disabled={busy}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder={t("bc.mobile.auth.signup.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? t("bc.mobile.auth.hidePassword")
                        : t("bc.mobile.auth.showPassword")
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "#7d8d9d" }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-[13px]" style={{ color: "#7d8d9d" }}>
                  {t("bc.mobile.auth.signup.passwordHint")}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[15px]" htmlFor="bc-signup-confirm">
                  {t("bc.mobile.auth.signup.confirmLabel")}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                    style={{ color: "#7d8d9d" }}
                    aria-hidden="true"
                  />
                  <input
                    id="bc-signup-confirm"
                    className={fieldClass}
                    style={fieldStyle}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    disabled={busy}
                    onChange={(e) => onConfirmPasswordChange(e.target.value)}
                    placeholder={t("bc.mobile.auth.signup.confirmPlaceholder")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="relative flex h-14 w-full items-center justify-center rounded-xl text-[18px] font-semibold text-[#1b1206] transition-opacity active:opacity-90 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #AB6D3C 0%, #FDE6B4 100%)",
                  boxShadow: "0 -1px 0 0 #f6e6c4 inset, 0 10px 24px -12px rgb(201 163 91 / 0.8)",
                }}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    {t("bc.mobile.auth.processing")}
                  </>
                ) : (
                  <>
                    {t("bc.mobile.auth.signup.submit")}
                    <ArrowRight className="absolute right-6 h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="text-center text-[13px] leading-relaxed" style={{ color: "#7d8d9d" }}>
                {t("bc.mobile.auth.signup.terms")}
              </p>
            </form>

            <div className="mt-8 text-center text-[15px]" style={{ color: "#8fa0b1" }}>
              {t("bc.mobile.auth.signup.haveAccount")}{" "}
              <Link to="/auth" className="font-semibold" style={{ color: GOLD }}>
                {t("bc.mobile.auth.signIn")}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
