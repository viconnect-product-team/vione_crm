// Public entry page for the Vione App (Business Connect mobile).
// Users land here after scanning the QR code on the landing page: it explains
// visually how to install, sign in and start connecting. No auth required.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Contact2,
  Download,
  Nfc,
  QrCode,
  ScanLine,
  Share2,
  Smartphone,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { LangSwitcher } from "@/components/LangSwitcher";
import { baseLang, useLang } from "@/lib/i18n";
import { BC_MANIFEST_HREF } from "@/lib/pwa-manifest";
import {
  isVioneStandaloneContext,
  rememberVioneAppContext,
} from "@/lib/business-connect/mobile/vione-auth-context";

type Bi = { vi: string; en: string };
const tr = (lang: "vi" | "en", b: Bi) => b[lang];

export const Route = createFileRoute("/vione-app")({
  head: () => ({
    meta: [
      { title: "Vione App — Kết nối kinh doanh trong tầm tay" },
      {
        name: "description",
        content:
          "Hướng dẫn trực quan để mở Vione App: cài lên màn hình chính, đăng nhập và bắt đầu kết nối bằng QR hoặc NFC.",
      },
      { property: "og:title", content: "Vione App — Kết nối kinh doanh trong tầm tay" },
      {
        property: "og:description",
        content:
          "Quét mã, cài Vione App lên màn hình chính và bắt đầu trao đổi danh thiếp số bằng QR hoặc NFC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#050C15" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "ViOne" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    // Cài lên màn hình chính từ trang này phải mở đúng Connect-app,
    // không dùng manifest gốc (start_url /m của app hội viên).
    // Href có tham số phiên bản để lần quét sau luôn tải manifest mới nhất.
    links: [{ rel: "manifest", href: BC_MANIFEST_HREF }],
  }),
  component: VioneAppPage,
});

function VioneAppPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const tx = (b: Bi) => tr(baseLang(lang), b);
  const [appUrl, setAppUrl] = useState("/connect-app");
  useEffect(() => {
    setAppUrl(`${window.location.origin}/connect-app`);
    rememberVioneAppContext();

    // Khi mở từ màn hình chính (PWA standalone) hoặc từ shortcut, trang giới
    // thiệu không còn ý nghĩa — chuyển thẳng vào Connect-app.
    const isStandalone = isVioneStandaloneContext();

    const params = new URLSearchParams(window.location.search);
    const forced = params.get("pwa") === "1" || params.get("app") === "1";

    if (isStandalone || forced) {
      void navigate({ to: "/connect-app", replace: true });
    }
  }, [navigate]);

  const steps: { icon: typeof QrCode; title: Bi; body: Bi }[] = [
    {
      icon: ScanLine,
      title: { vi: "1. Quét mã QR", en: "1. Scan the QR code" },
      body: {
        vi: "Dùng camera điện thoại quét mã trên trang giới thiệu để mở Vione App ngay trên trình duyệt.",
        en: "Use your phone camera to scan the code on the landing page and open Vione App in your browser.",
      },
    },
    {
      icon: Download,
      title: { vi: "2. Cài lên màn hình chính", en: "2. Add to home screen" },
      body: {
        vi: "iPhone: bấm nút Chia sẻ → “Thêm vào MH chính”. Android: menu ⋮ → “Cài đặt ứng dụng”.",
        en: "iPhone: tap Share → “Add to Home Screen”. Android: menu ⋮ → “Install app”.",
      },
    },
    {
      icon: UserPlus,
      title: { vi: "3. Đăng nhập tài khoản", en: "3. Sign in" },
      body: {
        vi: "Đăng nhập bằng email doanh nghiệp của bạn để đồng bộ danh thiếp, mạng lưới và cộng đồng.",
        en: "Sign in with your work email to sync your card, network and communities.",
      },
    },
    {
      icon: Contact2,
      title: { vi: "4. Bắt đầu kết nối", en: "4. Start connecting" },
      body: {
        vi: "Chạm nút V ở giữa thanh điều hướng để đưa QR, chạm NFC, quét danh thiếp giấy hoặc lưu khoảnh khắc.",
        en: "Tap the V button in the navigation bar to present QR, tap NFC, scan a paper card or save a moment.",
      },
    },
  ];

  const capabilities: { icon: typeof QrCode; label: Bi }[] = [
    { icon: QrCode, label: { vi: "Danh thiếp QR", en: "QR business card" } },
    { icon: Nfc, label: { vi: "Chạm NFC", en: "NFC tap" } },
    { icon: Sparkles, label: { vi: "Ghi nhớ bằng AI", en: "AI memory" } },
    { icon: Share2, label: { vi: "Chia sẻ liên kết", en: "Share link" } },
  ];

  return (
    <div
      className="vione-tone min-h-screen w-full bg-background text-muted-foreground antialiased"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/80 px-5 py-4 backdrop-blur-xl">
        <Link to="/landing" className="text-sm font-semibold text-foreground">
          ViOne
        </Link>
        <LangSwitcher showFullLabel />
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            <Smartphone className="h-3.5 w-3.5" />
            {tx({ vi: "Ứng dụng di động", en: "Mobile app" })}
          </span>
          <h1
            className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-5xl"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Vione App
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
            {tx({
              vi: "Quét mã, mở ứng dụng và bắt đầu kết nối kinh doanh chỉ trong vài giây.",
              en: "Scan, open the app and start building business relationships in seconds.",
            })}
          </p>

          <div className="mt-8 flex justify-center">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-lg">
              <QrCanvas
                value={appUrl}
                size={188}
                dark="#c9a227"
                light="#F5F3EE"
                frameColor="#F5F3EE"
                accent="rgba(201,162,39,0.18)"
              />
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {tx({ vi: "Quét để mở trên điện thoại", en: "Scan to open on your phone" })}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/connect-app"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              {tx({ vi: "Mở Vione App", en: "Open Vione App" })}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              search={{ m: "1" as const, redirect: "/connect-app" }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              {tx({ vi: "Đăng nhập", en: "Sign in" })}
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-center text-lg font-semibold text-foreground md:text-xl">
            {tx({ vi: "Bốn bước để bắt đầu", en: "Four steps to get started" })}
          </h2>
          <ol className="mt-6 space-y-3">
            {steps.map((s) => (
              <li
                key={s.title.en}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4 md:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{tx(s.title)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tx(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-lg font-semibold text-foreground md:text-xl">
            {tx({ vi: "Bạn có thể làm gì", en: "What you can do" })}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {capabilities.map((c: any) => (
              <div
                key={c.label.en}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-5 text-center"
              >
                <c.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{tx(c.label)}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          {tx({
            vi: "Cần hỗ trợ? Quay lại trang giới thiệu để tìm hiểu thêm về nền tảng ViOne.",
            en: "Need help? Go back to the landing page to learn more about the ViOne platform.",
          })}{" "}
          <Link to="/landing" className="font-semibold text-primary hover:underline">
            {tx({ vi: "Trang giới thiệu", en: "Landing page" })}
          </Link>
        </p>
      </main>
    </div>
  );
}
