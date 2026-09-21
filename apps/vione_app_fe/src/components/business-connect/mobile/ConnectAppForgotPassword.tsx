// Màn hình quên mật khẩu cho PWA Connect App — cùng ngôn ngữ thiết kế navy/vàng
// với màn đăng nhập. Thuần trình bày: trạng thái và hành động do route truyền vào.

import { Link } from "@tanstack/react-router";
import { AlertCircle, ChevronLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { useT } from "@/lib/i18n";
import authBg from "@/assets/connect-auth-bg.jpg";

const NAVY = "#0A0A0B";
const GOLD = "#f2b45a";

export type ForgotStatus = "idle" | "loading" | "sent" | "error";

type Props = {
  email: string;
  status: ForgotStatus;
  errorMessage?: string | null;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  /** Gửi lại email (bị chặn khi còn thời gian chờ). */
  onResend?: () => void;
  /** Số giây còn lại trước khi được gửi tiếp. */
  cooldownSeconds?: number;
  /** Nhãn hiển thị khi đang trong thời gian chờ / bị khoá. */
  cooldownLabel?: string | null;
  /** Gợi ý số lần gửi còn lại. */
  remainingHint?: string | null;
};

export function ConnectAppForgotPassword({
  email,
  status,
  errorMessage,
  onEmailChange,
  onSubmit,
  onRetry,
  onResend,
  cooldownSeconds = 0,
  cooldownLabel,
  remainingHint,
}: Props) {
  const t = useT();
  const busy = status === "loading";

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: NAVY, color: "#f5f7fa" }}
    >
      <img
        src={authBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 w-full object-cover opacity-40"
      />

      <div className="relative mx-auto w-full max-w-md px-6 pb-12 pt-6">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1 text-[15px]"
          style={{ color: "#8fa0b1" }}
        >
          <ChevronLeft className="h-5 w-5" />
          {t("bc.mobile.auth.reset.back")}
        </Link>

        <div className="mt-10 flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(201,163,91,0.14)",
              border: "1px solid rgba(201,163,91,0.35)",
            }}
            aria-hidden="true"
          >
            {status === "sent" ? (
              <MailCheck className="h-7 w-7" style={{ color: GOLD }} />
            ) : status === "error" ? (
              <AlertCircle className="h-7 w-7" style={{ color: "#ff9d95" }} />
            ) : (
              <Mail className="h-7 w-7" style={{ color: GOLD }} />
            )}
          </span>
          <h1 className="mt-5 text-[26px] font-semibold tracking-tight">
            {status === "sent"
              ? t("bc.mobile.auth.reset.sentTitle")
              : t("bc.mobile.auth.reset.title")}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#a9b6c4" }}>
            {status === "sent"
              ? t("bc.mobile.auth.reset.sentSubtitle")
              : t("bc.mobile.auth.reset.subtitle")}
          </p>
        </div>

        {status === "sent" ? (
          <section
            className="mt-8 rounded-2xl px-5 py-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1d2e40" }}
            aria-live="polite"
          >
            <h2 className="text-[15px] font-semibold">{t("bc.mobile.auth.reset.stepsTitle")}</h2>
            <ol className="mt-3 space-y-3 text-[14px] leading-relaxed" style={{ color: "#a9b6c4" }}>
              {[
                t("bc.mobile.auth.reset.step1"),
                t("bc.mobile.auth.reset.step2"),
                t("bc.mobile.auth.reset.step3"),
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{ background: "rgba(201,163,91,0.18)", color: GOLD }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px]" style={{ color: "#7d8d9d" }}>
              {t("bc.mobile.auth.reset.spamHint")}
            </p>
            <button
              type="button"
              onClick={cooldownSeconds > 0 ? undefined : (onResend ?? onRetry)}
              disabled={cooldownSeconds > 0}
              aria-live="polite"
              className="mt-5 w-full rounded-xl py-3 text-[15px] font-semibold disabled:opacity-60"
              style={{ border: "1px solid #2a3d51", color: "#e4e9ee" }}
            >
              {cooldownSeconds > 0 && cooldownLabel
                ? cooldownLabel
                : t("bc.mobile.auth.reset.resend")}
            </button>
            {remainingHint ? (
              <p className="mt-2 text-center text-[13px]" style={{ color: "#7d8d9d" }}>
                {remainingHint}
              </p>
            ) : null}
          </section>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {status === "error" && errorMessage ? (
              <p
                role="alert"
                className="rounded-xl px-4 py-3 text-[14px]"
                style={{ background: "rgba(239,68,68,0.14)", color: "#ffd9d4" }}
              >
                {errorMessage}
              </p>
            ) : null}

            <label className="block text-[14px]" style={{ color: "#a9b6c4" }}>
              {t("bc.mobile.auth.emailLabel")}
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                disabled={busy}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={t("bc.mobile.auth.emailPlaceholder")}
                className="mt-2 h-13 w-full rounded-xl border bg-transparent px-4 py-3 text-[15px] outline-none placeholder:opacity-60 disabled:opacity-60"
                style={{ borderColor: "#2a3d51", color: "#f5f7fa" }}
              />
            </label>

            <button
              type="submit"
              disabled={busy || email.trim().length === 0 || cooldownSeconds > 0}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl py-3 text-[16px] font-semibold disabled:opacity-60"
              style={{ background: GOLD, color: "#1a1304" }}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
              {busy
                ? t("bc.mobile.auth.reset.sending")
                : cooldownSeconds > 0 && cooldownLabel
                  ? cooldownLabel
                  : t("bc.mobile.auth.reset.send")}
            </button>
          </form>
        )}

        <Link
          to="/auth"
          className="mt-8 block text-center text-[15px] font-medium"
          style={{ color: GOLD }}
        >
          {t("bc.mobile.auth.reset.backToSignIn")}
        </Link>
      </div>
    </main>
  );
}
