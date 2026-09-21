import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Crown,
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { classifyAuthError } from "@/lib/business-connect/mobile/auth-error";
import {
  clearResendState,
  markResendSent,
  readResendState,
} from "@/lib/business-connect/mobile/resend-cooldown";

const AUTO_REDIRECT_SECONDS = 5;

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { m?: string; email?: string } => ({
    m: search.m === "1" ? "1" : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [{ title: "Đặt lại mật khẩu — ViOne" }],
  }),
  component: ResetPasswordPage,
});

const RESEND_COOLDOWN = 60;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const t = useT();
  const { m: mobile, email: emailParam } = Route.useSearch();
  const [ready, setReady] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const emailRef = useRef<string>(emailParam || "");

  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<"expired" | "invalid" | "missing" | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("vba_reset_email");
      if (!emailRef.current && stored) emailRef.current = stored;
      const persisted = readResendState("forgot", emailRef.current);
      if (persisted.seconds > 0) setCooldown(persisted.seconds);
    } catch {
      /* ignore */
    }
  }, []);

  // Cooldown countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-redirect to sign-in after successful password reset.
  useEffect(() => {
    if (!success) return;
    if (redirectCountdown <= 0) {
      goToLogin();
      return;
    }
    const id = setInterval(() => setRedirectCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [success, redirectCountdown]);

  function goToLogin() {
    navigate({
      to: "/auth",
      search: mobile === "1" ? { m: "1" } : {},
      replace: true,
    });
  }

  async function resend() {
    const target = emailRef.current.trim();
    if (!target) {
      toast.error(t("reset.resend.noEmail"));
      navigate({ to: "/forgot-password", search: mobile === "1" ? { m: "1" } : {} });
      return;
    }
    setResending(true);
    try {
      const gate = readResendState("forgot", target);
      if (gate.seconds > 0) {
        toast.error(
          gate.locked
            ? t("reset.resend.locked").replace("{min}", String(Math.ceil(gate.seconds / 60)))
            : t("reset.resend.cooldown").replace("{sec}", String(gate.seconds)),
        );
        setCooldown(gate.seconds);
        setResending(false);
        return;
      }
      await fetchNestApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: target }),
      });
      toast.success(t("reset.resend.sent"));
      setCooldown(markResendSent("forgot", target).seconds || RESEND_COOLDOWN);
    } catch (e) {
      toast.error(t(classifyAuthError(e).messageKey as TKey));
    } finally {
      setResending(false);
    }
  }

  async function submit() {
    if (password.length < 6) {
      toast.error(t("reset.password.short"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("reset.password.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await fetchNestApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: emailRef.current,
          newPassword: password,
        }),
      });
      toast.success(t("reset.success"));
      try {
        sessionStorage.removeItem("vba_reset_email");
        clearResendState("forgot", emailRef.current);
      } catch {
        /* ignore */
      }
      setSuccess(true);
      setRedirectCountdown(AUTO_REDIRECT_SECONDS);
    } catch (e: any) {
      const raw = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (
        raw.includes("password") &&
        (raw.includes("weak") || raw.includes("short") || raw.includes("different"))
      ) {
        toast.error(t("reset.error.weak"));
      } else {
        toast.error(e?.message || t(classifyAuthError(e).messageKey as TKey));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors";
  const inputStyle = {
    background: "var(--vba-bg-2)",
    border: "1px solid var(--vba-border-soft)",
    color: "var(--vba-text)",
  } as const;

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
        {success ? (
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--vba-gold-soft)", border: "1px solid var(--vba-border)" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              <span className="vba-gold-text">{t("reset.successTitle")}</span>
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--vba-text-muted)" }}>
              {t("reset.successSubtitle")}
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--vba-text-muted)" }}>
              {t("reset.autoRedirect").replace("{sec}", String(redirectCountdown))}
            </p>
            <button
              onClick={goToLogin}
              className="vba-gold-grad mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ color: "#1a1304" }}
            >
              {t("reset.backToLogin")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "var(--vba-gold-soft)",
                  border: "1px solid var(--vba-border)",
                }}
              >
                {!ready && failure ? (
                  <AlertCircle className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
                ) : ready ? (
                  <ShieldCheck className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
                ) : (
                  <Crown className="h-7 w-7" style={{ color: "var(--vba-gold)" }} />
                )}
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                <span className="vba-gold-text">{t("reset.title")}</span>
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--vba-text-muted)" }}>
                {ready
                  ? t("reset.subtitle.ready")
                  : failure === "expired"
                    ? t("reset.subtitle.expired")
                    : failure === "missing"
                      ? t("reset.subtitle.missing")
                      : failure
                        ? t("reset.subtitle.invalid")
                        : t("reset.subtitle.verifying")}
              </p>
              {!ready && failure && (
                <div className="mt-5 w-full space-y-3 text-left">
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "var(--vba-bg-2)",
                      border: "1px solid var(--vba-border-soft)",
                    }}
                  >
                    <p
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "var(--vba-text)" }}
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      {t("reset.guide.title")}
                    </p>
                    <p className="mt-1.5 text-xs" style={{ color: "var(--vba-text-muted)" }}>
                      {failure === "expired"
                        ? t("reset.guide.expired")
                        : failure === "missing"
                          ? t("reset.guide.missing")
                          : t("reset.guide.invalid")}
                    </p>
                    <ol
                      className="mt-3 list-decimal space-y-1 pl-4 text-xs"
                      style={{ color: "var(--vba-text-muted)" }}
                    >
                      <li>{t("reset.guide.step1")}</li>
                      <li>{t("reset.guide.step2")}</li>
                      <li>{t("reset.guide.step3")}</li>
                    </ol>
                  </div>
                  <button
                    onClick={resend}
                    disabled={resending || cooldown > 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                    style={{
                      background: "var(--vba-bg-2)",
                      border: "1px solid var(--vba-border-soft)",
                      color: "var(--vba-text)",
                    }}
                  >
                    {resending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!resending && cooldown === 0 && <RefreshCw className="h-4 w-4" />}
                    {resending
                      ? t("reset.resend.sending")
                      : cooldown > 0
                        ? t("reset.resend.cooldown").replace("{sec}", String(cooldown))
                        : t("reset.resend")}
                  </button>
                  <button
                    onClick={() =>
                      navigate({
                        to: "/forgot-password",
                        search: mobile === "1" ? { m: "1" } : {},
                      })
                    }
                    className="vba-gold-grad w-full rounded-xl px-4 py-3 text-sm font-semibold"
                    style={{ color: "#1a1304" }}
                  >
                    {t("reset.requestNew")}
                  </button>
                </div>
              )}
            </div>

            {ready && (
              <div className="mt-6 space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("reset.password.placeholder")}
                  className={inputCls}
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={t("reset.confirm.placeholder")}
                  className={inputCls}
                  style={inputStyle}
                />
                <button
                  onClick={submit}
                  disabled={loading}
                  className="vba-gold-grad w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  style={{ color: "#1a1304" }}
                >
                  {loading ? t("reset.submitting") : t("reset.submit")}
                </button>

                <button
                  onClick={resend}
                  disabled={resending || cooldown > 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--vba-border-soft)",
                    color: "var(--vba-text-muted)",
                  }}
                >
                  {resending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!resending && cooldown === 0 && <RefreshCw className="h-4 w-4" />}
                  {resending
                    ? t("reset.resend.sending")
                    : cooldown > 0
                      ? t("reset.resend.cooldown").replace("{sec}", String(cooldown))
                      : t("reset.resend")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
