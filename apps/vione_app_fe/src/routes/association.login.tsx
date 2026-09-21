import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import { classifyAuthError, type AuthErrorInfo } from "@/lib/business-connect/mobile/auth-error";
import { AssociationAppSignIn } from "@/components/member/AssociationAppSignIn";
import { AuthCardScanSheet } from "@/components/business-connect/mobile/AuthCardScanSheet";
import { rememberScannedCard } from "@/lib/business-connect/mobile/auth-scan";
import {
  applyRememberPreference,
  getRememberPreference,
  getRememberedEmail,
} from "@/lib/business-connect/mobile/auth-session";

export const Route = createFileRoute("/association/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): {
    redirect?: string;
    reason?: "expired";
    username?: string;
    email?: string;
    registered?: string;
    reset?: string;
  } => ({
    ...(typeof search.redirect === "string" ? { redirect: search.redirect } : {}),
    ...(search.reason === "expired" ? { reason: "expired" as const } : {}),
    ...(typeof search.username === "string" ? { username: search.username } : {}),
    ...(typeof search.email === "string" ? { email: search.email } : {}),
    ...(typeof search.registered === "string" ? { registered: search.registered } : {}),
    ...(typeof search.reset === "string" ? { reset: search.reset } : {}),
  }),
  head: () => ({
    meta: [{ title: "Đăng nhập — Hiệp hội Doanh nhân CEO 1983" }],
    links: [
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/ceo1983-favicon.png" },
      { rel: "apple-touch-icon", href: "/ceo1983-favicon.png" },
    ],
  }),
  component: AssociationLoginPage,
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

function AssociationLoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo, reason, username, email: searchEmail, registered, reset } = Route.useSearch();
  const { user, setAuthData } = useAuth();

  const [identifier, setIdentifier] = useState(""); // Email or Member Code
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (username) {
      setIdentifier(username);
    } else if (searchEmail) {
      setIdentifier(searchEmail);
    } else {
      setRemember(getRememberPreference());
      const saved = getRememberedEmail();
      if (saved) setIdentifier((v) => v || saved);
    }
  }, [username, searchEmail]);

  useEffect(() => {
    if (registered === "true") {
      toast.success("🎉 Đăng ký thành công! Quý CEO vui lòng nhập mật khẩu để đăng nhập vào App Hiệp Hội.");
    }
  }, [registered]);

  useEffect(() => {
    if (reset === "success") {
      toast.success("✓ Đổi mật khẩu thành công! Quý CEO vui lòng đăng nhập lại bằng mật khẩu mới vừa tạo.", {
        duration: 7000,
      });
    }
  }, [reset]);

  useEffect(() => {
    if (reason === "expired") {
      setAuthError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [reason]);

  useEffect(() => {
    if (user) {
      const target = safeRedirect(redirectTo) || "/association";
      navigate({ to: target as any, replace: true });
    }
  }, [user, redirectTo, navigate]);

  const handleSubmit = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setAuthError("Vui lòng nhập email / mã hội viên và mật khẩu");
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthErrorInfo(null);

    try {
      const res = await fetchNestApi<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanId,
          password,
        }),
      });

      if (res?.access_token && res?.user) {
        setAuthData(res);
        applyRememberPreference(remember, cleanId);

        if (res.mustChangePassword || res.user?.mustChangePassword) {
          toast.warning("Hội viên mới bắt buộc phải thay đổi mật khẩu khởi tạo trước khi sử dụng ứng dụng.", {
            duration: 6000,
          });
          navigate({
            to: "/association/settings" as any,
            search: { action: "change_password", required: "true" } as any,
            replace: true,
          });
          return;
        }

        toast.success(`Chào mừng hội viên ${res.user.user_metadata?.full_name || cleanId} trở lại!`);
        const target = safeRedirect(redirectTo) || "/association";
        navigate({ to: target as any, replace: true });
        return;
      }

      throw new Error("Không nhận được phiên đăng nhập hợp lệ.");
    } catch (err: any) {
      const info = classifyAuthError(err);
      setAuthErrorInfo(info);
      setAuthError(info.raw || err?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  async function handleCardScanned(result: any) {
    setScanOpen(false);
    if (result.kind === "email") {
      setIdentifier(result.email);
      rememberScannedCard(result.card);
      toast.success(`Đã nhận diện thẻ của ${result.card?.fullName || "hội viên"}`);
    }
  }

  return (
    <>
      <AssociationAppSignIn
        identifier={identifier}
        password={password}
        loading={loading}
        errorMessage={authError}
        errorHint={authErrorInfo?.hintKey}
        onDismissError={() => setAuthError(null)}
        onIdentifierChange={setIdentifier}
        onPasswordChange={setPassword}
        onSubmit={() => void handleSubmit()}
        onScanCard={() => setScanOpen(true)}
        remember={remember}
        onRememberChange={setRemember}
      />

      <AuthCardScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={handleCardScanned}
      />
    </>
  );
}
