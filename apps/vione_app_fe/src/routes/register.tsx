// Đăng ký tài khoản Connect App (PWA). Sau khi tạo tài khoản, người dùng được
// đưa sang luồng kích hoạt Danh tính Doanh nghiệp (/connect-app/activate).

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { takeScannedCard } from "@/lib/business-connect/mobile/auth-scan";
import {
  ConnectAppSignUp,
  type SignUpStatus,
} from "@/components/business-connect/mobile/ConnectAppSignUp";
import { applyRememberPreference } from "@/lib/business-connect/mobile/auth-session";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tạo tài khoản — Business Connect" },
      {
        name: "description",
        content:
          "Đăng ký tài khoản Business Connect để kích hoạt danh tính doanh nghiệp và danh thiếp điện tử.",
      },
      { property: "og:title", content: "Tạo tài khoản — Business Connect" },
      {
        property: "og:description",
        content:
          "Đăng ký tài khoản Business Connect để kích hoạt danh tính doanh nghiệp và danh thiếp điện tử.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<SignUpStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scan detection
  useEffect(() => {
    const card = takeScannedCard();
    if (card) {
      const email = card.email || (card as any).ownerEmail;
      const name = card.fullName || (card as any).ownerName;
      if (email) setEmail(email);
      if (name) setFullName(name);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("vibe_token") : null;
    if (token) navigate({ to: "/connect-app/activate" });
  }, [navigate]);

  async function submit() {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (!name) {
      setStatus("error");
      setErrorMessage(t("bc.mobile.auth.signup.nameRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setStatus("error");
      setErrorMessage(t("bc.mobile.auth.signup.emailRequired"));
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setErrorMessage(t("bc.mobile.auth.signup.passwordShort"));
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage(t("bc.mobile.auth.signup.passwordMismatch"));
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    try {
      await fetchNestApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: mail, password, name }),
      });
      applyRememberPreference(true, mail);
      toast.success(t("auth.signUpSuccess"));
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : t("auth.genericError"));
    }
  }

  return (
    <ConnectAppSignUp
      fullName={fullName}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      status={status}
      errorMessage={errorMessage}
      onDismissError={() => {
        setErrorMessage(null);
        if (status === "error") setStatus("idle");
      }}
      onFullNameChange={setFullName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={submit}
    />
  );
}
