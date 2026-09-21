import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Apple, Smartphone, Share, PlusSquare, MoreVertical, Download, Check } from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
const appIcon = "/app-icon.png";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Cài đặt ứng dụng ViOne Hội viên — Hiệp hội Doanh nghiệp Việt Nam" },
      {
        name: "description",
        content:
          "Quét mã QR để cài đặt ứng dụng hội viên ViOne lên màn hình chính. Hướng dẫn chi tiết cho iOS và Android.",
      },
    ],
  }),
  component: InstallPage,
});

import { resolvePwaInstallUrl, CANONICAL_PWA_URL } from "@/lib/tenant";

const FALLBACK_URL = CANONICAL_PWA_URL;

function InstallPage() {
  const [appUrl, setAppUrl] = useState(FALLBACK_URL);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(resolvePwaInstallUrl());
    }
  }, []);

  return (
    <div className="vba-app">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={appIcon}
            alt="ViOne"
            className="h-20 w-20 rounded-2xl shadow-lg"
            width={80}
            height={80}
          />
          <h1 className="mt-4 text-2xl font-extrabold vba-gold-text">ViOne — Ứng dụng Hội viên</h1>
          <p className="mt-1 text-[13px] text-[var(--vba-text-muted)]">
            Hiệp hội Doanh nghiệp Việt Nam
          </p>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[var(--vba-text-muted)]">
            Cài đặt ứng dụng lên màn hình chính để truy cập thẻ hội viên, sự kiện, cơ hội kinh doanh
            và ưu đãi — nhanh như một ứng dụng thật, không cần qua kho ứng dụng.
          </p>
        </div>

        {/* QR card */}
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-[var(--vba-border)] bg-gradient-to-br from-primary to-primary-glow p-6">
          <div className="text-center text-[13px] font-semibold text-[var(--vba-gold)]">
            Quét mã QR bằng camera điện thoại
          </div>
          <QrCanvas value={appUrl} size={220} />
          <code className="break-all rounded-lg bg-foreground/30 px-3 py-1.5 text-center text-[11px] text-[var(--vba-text-muted)]">
            {appUrl}
          </code>
          <Link
            to="/m"
            className="flex items-center gap-2 rounded-xl vba-gold-grad px-5 py-2.5 text-[13px] font-bold text-primary-foreground"
          >
            <Download className="h-4 w-4" /> Mở ứng dụng ngay
          </Link>
        </div>

        {/* Guides */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <GuideCard
            icon={<Apple className="h-5 w-5" />}
            title="iPhone / iPad (iOS)"
            steps={[
              {
                icon: <Smartphone className="h-4 w-4" />,
                text: "Mở liên kết bằng trình duyệt Safari.",
              },
              {
                icon: <Share className="h-4 w-4" />,
                text: 'Nhấn nút "Chia sẻ" (biểu tượng mũi tên hướng lên).',
              },
              {
                icon: <PlusSquare className="h-4 w-4" />,
                text: 'Chọn "Thêm vào MH chính" (Add to Home Screen).',
              },
              {
                icon: <Check className="h-4 w-4" />,
                text: 'Nhấn "Thêm" — biểu tượng app xuất hiện trên màn hình chính.',
              },
            ]}
          />
          <GuideCard
            icon={<Smartphone className="h-5 w-5" />}
            title="Android"
            steps={[
              {
                icon: <Smartphone className="h-4 w-4" />,
                text: "Mở liên kết bằng trình duyệt Chrome.",
              },
              {
                icon: <MoreVertical className="h-4 w-4" />,
                text: "Nhấn menu (ba chấm) ở góc trên bên phải.",
              },
              {
                icon: <PlusSquare className="h-4 w-4" />,
                text: 'Chọn "Thêm vào màn hình chính" / "Cài đặt ứng dụng".',
              },
              {
                icon: <Check className="h-4 w-4" />,
                text: "Xác nhận — ứng dụng được cài như một app thật.",
              },
            ]}
          />
        </div>

        <p className="mt-8 text-center text-[11px] text-[var(--vba-text-dim)]">
          Lưu ý: trình duyệt cần kết nối internet trong lần đầu mở ứng dụng.
        </p>
      </div>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  steps: { icon: React.ReactNode; text: string }[];
}) {
  return (
    <div className="vba-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
          {icon}
        </span>
        <h2 className="text-[15px] font-bold text-[var(--vba-text)]">{title}</h2>
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--vba-border)] text-[11px] font-bold text-[var(--vba-gold)]">
              {i + 1}
            </span>
            <span className="flex items-center gap-2 text-[12.5px] leading-snug text-[var(--vba-text-muted)]">
              <span className="text-[var(--vba-gold)]">{s.icon}</span>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
