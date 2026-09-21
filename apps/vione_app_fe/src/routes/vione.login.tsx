import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { ConnectAppSignIn } from "@/components/business-connect/mobile/ConnectAppSignIn";
import { AuthCardScanSheet } from "@/components/business-connect/mobile/AuthCardScanSheet";
import { rememberScannedCard } from "@/lib/business-connect/mobile/auth-scan";
import { classifyAuthError, type AuthErrorInfo } from "@/lib/business-connect/mobile/auth-error";
import {
  applyRememberPreference,
  getRememberPreference,
  getRememberedEmail,
} from "@/lib/business-connect/mobile/auth-session";
import { resolveVionePostLoginPath } from "@/lib/business-connect/mobile/vione-auth-context";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/vione/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string; reason?: "expired" } => ({
    ...(typeof search.redirect === "string" ? { redirect: search.redirect } : {}),
    ...(search.reason === "expired" ? { reason: "expired" as const } : {}),
  }),
  head: () => ({
    meta: [{ title: "Đăng nhập — ViOne Business Connect" }],
  }),
  component: VioneMobileLoginPage,
});

function safeRedirect(target?: string): string | null {
  if (!target) return null;
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname + url.search + url.hash;
    if (path.includes("/login") || path.startsWith("/auth")) return null;
    return path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

function VioneMobileLoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { redirect: redirectTo, reason } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthPending, setOauthPending] = useState<"google" | "apple" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [lastAction, setLastAction] = useState<"password" | "google" | "apple" | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [remember, setRemember] = useState(true);
  const { user, setAuthData } = useAuth();

  async function goPostLogin() {
    const target = safeRedirect(redirectTo);
    if (target) {
      navigate({ to: target as any, replace: true });
      return;
    }
    const dest = resolveVionePostLoginPath(redirectTo ?? null, true);
    navigate({ to: (dest || "/connect-app") as any, replace: true });
  }

  useEffect(() => {
    if (reason === "expired") {
      setAuthError(t("auth.sessionExpired"));
    }
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
      setAuthError("Vui lòng nhập email hoặc tên đăng nhập");
      return;
    }
    if (!password) {
      setAuthError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthErrorInfo(null);
    setLastAction("password");

    try {
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
    } catch (e: any) {
      const info = classifyAuthError(e, { provider: "password" });
      setAuthErrorInfo(info);
      setAuthError(t(info.messageKey as Parameters<typeof t>[0]) || e?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  // Google Sign-In helper using GIS
  const loginGoogleWeb = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id";

      const initializeGis = () => {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            ux_mode: "popup",
            callback: (res: any) => {
              if (res.credential) {
                resolve(res.credential);
              } else {
                reject(new Error("No credential returned from Google"));
              }
            },
          });

          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              const btn = document.getElementById("hidden-google-btn")?.querySelector("div");
              if (btn) btn.click();
            }
          });
        } catch (err) {
          reject(err);
        }
      };

      if ((window as any).google?.accounts?.id) {
        initializeGis();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGis;
      script.onerror = () => reject(new Error("Failed to load Google GIS SDK"));
      document.head.appendChild(script);
    });
  };

  // Sign In with Apple helper
  const loginAppleWeb = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || "your-apple-client-id";

      const initializeApple = () => {
        try {
          (window as any).AppleID.auth.init({
            clientId,
            scope: "name email",
            redirectURI: window.location.origin + "/vione/login",
            usePopup: true,
          });

          (window as any).AppleID.auth
            .signIn()
            .then((res: any) => resolve(res))
            .catch((err: any) => reject(err));
        } catch (err) {
          reject(err);
        }
      };

      if ((window as any).AppleID?.auth) {
        initializeApple();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js";
      script.async = true;
      script.defer = true;
      script.onload = initializeApple;
      script.onerror = () => reject(new Error("Failed to load Apple Sign In SDK"));
      document.head.appendChild(script);
    });
  };

  async function oauth(provider: "google" | "apple") {
    setOauthPending(provider);
    setAuthError(null);
    setAuthErrorInfo(null);
    setLastAction(provider);

    try {
      if (provider === "google") {
        const idToken = await loginGoogleWeb();
        const customSession = await fetchNestApi("/auth/google", {
          method: "POST",
          body: JSON.stringify({ token: idToken }),
        });

        setAuthData(customSession);
        applyRememberPreference(remember, customSession.user.email);
        await goPostLogin();
      } else if (provider === "apple") {
        const appleResult = await loginAppleWeb();
        if (!appleResult || !appleResult.authorization?.id_token) {
          throw new Error("Apple login failed - no token received");
        }

        const customSession = await fetchNestApi("/auth/apple", {
          method: "POST",
          body: JSON.stringify({
            identityToken: appleResult.authorization.id_token,
            authorizationCode: appleResult.authorization.code,
            fullName: appleResult.user?.name,
            email: appleResult.user?.email,
          }),
        });

        setAuthData(customSession);
        applyRememberPreference(remember, customSession.user.email);
        await goPostLogin();
      }
    } catch (e: any) {
      const info = classifyAuthError(e, { provider });
      setAuthErrorInfo(info);
      setAuthError(t(info.messageKey as Parameters<typeof t>[0]) || e?.message || "Đăng nhập OAuth thất bại");
    } finally {
      setOauthPending(null);
    }
  }

  return (
    <>
      <ConnectAppSignIn
        email={email}
        password={password}
        loading={loading}
        oauthPending={oauthPending}
        errorMessage={authError}
        errorHint={authErrorInfo?.hintKey ? t(authErrorInfo.hintKey as Parameters<typeof t>[0]) : null}
        onRetry={
          authErrorInfo?.retryable && lastAction
            ? () => {
                setAuthError(null);
                setAuthErrorInfo(null);
                if (lastAction === "password") void submit();
                else void oauth(lastAction);
              }
            : null
        }
        secondaryLabel={authErrorInfo?.secondaryAction === "forgotPassword" ? t("bc.mobile.auth.forgot") : null}
        onSecondary={
          authErrorInfo?.secondaryAction === "forgotPassword"
            ? () => navigate({ to: "/forgot-password", search: { m: "1", email: email.trim() || undefined } })
            : null
        }
        onDismissError={() => {
          setAuthError(null);
          setAuthErrorInfo(null);
        }}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={() => void submit()}
        onGoogle={() => void oauth("google")}
        onApple={() => void oauth("apple")}
        remember={remember}
        onRememberChange={setRemember}
        onScanCard={() => {
          setAuthError(null);
          setScanOpen(true);
        }}
      />

      {/* Hidden container for Google Identity popup fallback */}
      <div id="hidden-google-btn" className="hidden" />

      {/* NFC / QR Card Scan Sheet */}
      <AuthCardScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={(result) => {
          setScanOpen(false);
          if (result.kind === "email") {
            setEmail(result.email);
            rememberScannedCard(result.card);
            toast.success("Đã nhận diện danh thiếp!");
            return;
          }
          navigate({ to: result.path as any });
        }}
      />
    </>
  );
}
