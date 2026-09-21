import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChevronLeft, Crown, Loader2, MailCheck, AlertCircle } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { classifyAuthError } from "@/lib/business-connect/mobile/auth-error";
import { useResendCooldown } from "@/lib/business-connect/mobile/resend-cooldown";
import { ConnectAppForgotPassword } from "@/components/business-connect/mobile/ConnectAppForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>): { m?: string; email?: string } => ({
    m: search.m === "1" ? "1" : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [{ title: "Quên mật khẩu — ViOne" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useT();
  const { m: mobile, email: emailParam } = Route.useSearch();
  const [email, setEmail] = useState(emailParam ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const cooldown = useResendCooldown("forgot", email);
  const cooldownLabel = cooldown.locked
    ? t("forgot.resend.locked").replace("{min}", String(Math.ceil(cooldown.seconds / 60)))
    : t("forgot.resend.cooldown").replace("{sec}", String(cooldown.seconds));

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit() {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t("forgot.email.empty"));
      return;
    }
    if (!cooldown.canSend) {
      toast.error(
        cooldown.locked
          ? t("forgot.resend.locked").replace("{min}", String(Math.ceil(cooldown.seconds / 60)))
          : t("forgot.resend.wait").replace("{sec}", String(cooldown.seconds)),
      );
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await fetchNestApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });
      try {
        sessionStorage.setItem("vba_reset_email", trimmed);
      } catch {
        /* ignore */
      }
      cooldown.markSent();
      setStatus("success");
    } catch (e: any) {
      const info = classifyAuthError(e, { provider: "password" });
      const msg = t(info.messageKey as TKey) || e?.message || "Không thể gửi yêu cầu";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMsg("");
  }

  if (mobile === "1") {
    return (
      <ConnectAppForgotPassword
        email={email}
        status={status === "success" ? "sent" : status}
        errorMessage={errorMsg || null}
        onEmailChange={setEmail}
        onSubmit={submit}
        onRetry={reset}
        onResend={submit}
        cooldownSeconds={cooldown.seconds}
        cooldownLabel={cooldown.seconds > 0 ? cooldownLabel : null}
        remainingHint={
          cooldown.seconds === 0 && cooldown.remainingAttempts > 0
            ? t("forgot.resend.remaining").replace("{n}", String(cooldown.remainingAttempts))
            : null
        }
      />
    );
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors";
  const inputStyle = {
    background: "var(--vba-bg-2)",
    border: "1px solid var(--vba-border-soft)",
    color: "var(--vba-text)",
  } as const;

  const statusIcon =
    status === "success" ? (
      <MailCheck className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
    ) : status === "error" ? (
      <AlertCircle className="h-7 w-7" style={{ color: "var(--vba-red, #ef4444)" }} />
    ) : (
      <Crown className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
    );

  const titleText =
    status === "success"
      ? t("forgot.success.title")
      : status === "error"
        ? t("forgot.error.title")
        : t("forgot.title");

  const subtitleText =
    status === "success"
      ? t("forgot.success.subtitle")
      : status === "error"
        ? t("forgot.error.subtitle")
        : t("forgot.subtitle");

  return (
    <div className="vba-app flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(70% 50% at 50% 8%, rgba(230,192,106,0.14), transparent 70%)",
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl p-7"
        style={{
          background: "linear-gradient(160deg, var(--vba-surface) 0%, var(--vba-surface-2) 100%)",
          border: "1px solid var(--vba-border)",
          boxShadow: "var(--vba-gold-glow)",
        }}
      >
        <Link
          to="/auth"
          className="inline-flex items-center gap-1 text-sm transition-colors"
          style={{ color: "var(--vba-text-muted)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("profile.back")}
        </Link>

        <div className="mt-6 flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--vba-gold-soft)", border: "1px solid var(--vba-border)" }}
          >
            {statusIcon}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            <span className="vba-gold-text">{titleText}</span>
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--vba-text-muted)" }}>
            {subtitleText}
          </p>
        </div>

        {status === "error" && errorMsg && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "var(--vba-red, #ef4444)",
            }}
          >
            {errorMsg}
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 space-y-3">
            <button
              onClick={submit}
              disabled={cooldown.seconds > 0}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              style={{ border: "1px solid var(--vba-border)", color: "var(--vba-text)" }}
            >
              {cooldown.seconds > 0 ? cooldownLabel : t("forgot.resend")}
            </button>
            {cooldown.seconds === 0 && cooldown.remainingAttempts > 0 && (
              <p className="text-center text-xs" style={{ color: "var(--vba-text-muted)" }}>
                {t("forgot.resend.remaining").replace("{n}", String(cooldown.remainingAttempts))}
              </p>
            )}
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="vba-gold-grad w-full rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ color: "#1a1304" }}
            >
              {t("forgot.backToLogin")}
            </button>
          </div>
        )}

        {status !== "success" && (
          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              disabled={status === "loading"}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("forgot.email.placeholder")}
              className={inputCls}
              style={inputStyle}
            />
            <button
              onClick={status === "error" ? reset : submit}
              disabled={status === "loading" || (status !== "error" && cooldown.seconds > 0)}
              className="vba-gold-grad flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              style={{ color: "#1a1304" }}
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "loading"
                ? t("forgot.sending")
                : status === "error"
                  ? t("forgot.retry")
                  : cooldown.seconds > 0
                    ? cooldownLabel
                    : t("forgot.send")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
