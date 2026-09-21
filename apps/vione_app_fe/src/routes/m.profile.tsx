import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Settings,
  ChevronRight,
  BadgeCheck,
  User,
  Building2,
  Users,
  History,
  FileText,
  Package,
  Sparkles,
  Bell,
  Settings as Cog,
  LogOut,
  Sun,
  Moon,
  Contrast,
  Globe,
  Share2,
  PhoneCall,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getMyMember, type MyMember } from "@/lib/member-app.functions";
import { useT, useLang } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { signOutSession } from "@/lib/business-connect/mobile/auth-session";
import { toast } from "sonner";

export const Route = createFileRoute("/m/profile")({
  component: ProfileScreen,
});

function initials(name?: string) {
  if (!name) return "VIP";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ProfileScreen() {
  const t = useT();
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fetchMember = useServerFn(getMyMember);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!member?.code) return;
    navigator.clipboard.writeText(member.code);
    setCopied(true);
    toast.success("Đã sao chép mã hội viên!");
    setTimeout(() => setCopied(false), 2000);
  };

  const menu = [
    { label: "Cập nhật hồ sơ & Quyền riêng tư", icon: User, to: "/connect-app/me/edit" as const, desc: "Chỉnh sửa tên, chức danh, liên hệ & quyền riêng tư" },
    { label: t("m.profile.menu_personal_info"), icon: QrCode, to: "/m/card" as const, desc: "Danh thiếp & Thẻ số" },
    { label: t("m.profile.menu_business_info"), icon: Building2, to: "/m/business-cards" as const, desc: "Hồ sơ công ty" },
    { label: t("m.profile.menu_members"), icon: Users, to: "/m/members" as const, desc: "Danh bạ hội viên" },
    { label: t("m.profile.menu_opportunities"), icon: Sparkles, to: "/m/opportunities" as const, desc: "Cơ hội giao thương B2B" },
    { label: t("m.profile.menu_products"), icon: Package, to: "/m/products" as const, desc: "Gian hàng sản phẩm" },
    { label: t("m.profile.menu_history"), icon: History, to: "/m/history" as const, desc: "Lịch sử kết nối" },
    { label: t("m.profile.menu_notifications"), icon: Bell, to: "/m/notifications" as const, desc: "Thông báo & Lời mời" },
    { label: t("m.profile.menu_settings"), icon: Cog, to: "/connect-app/me" as const, desc: "Bảo mật & Tài khoản" },
  ];

  const themeOptions: { mode: Theme; icon: typeof Sun; label: string; desc: string }[] = [
    { mode: "light", icon: Sun, label: "Sáng", desc: "Tươi sáng, tinh tế" },
    { mode: "dark", icon: Moon, label: "Tối", desc: "Sang trọng, dịu mắt" },
    { mode: "contrast", icon: Contrast, label: "Tương phản", desc: "Độ tương phản cao" },
  ];

  async function logout() {
    await signOutSession();
    navigate({ to: "/auth" });
  }

  return (
    <div className="vba-animate pb-24">
      <MemberHeader
        title={t("m.profile.title")}
        back
        right={
          <Link to="/connect-app/me" aria-label={t("m.profile.settings_label")} className="text-[var(--vba-gold)]">
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      {/* Identity Card */}
      <div className="mx-4 mt-4 rounded-2xl vba-card p-4 border border-[var(--vba-border)] shadow-md">
        <div className="flex items-center gap-3.5">
          {member?.avatar ? (
            <img
              src={member.avatar}
              alt={member?.name ?? ""}
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-[var(--vba-gold)] ring-offset-2 ring-offset-[var(--vba-bg)] shadow-md"
            />
          ) : (
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full vba-gold-grad text-[20px] font-black text-[#0A111C] ring-2 ring-[var(--vba-gold)] ring-offset-2 ring-offset-[var(--vba-bg)] shadow-md">
              {initials(member?.name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[17px] font-bold text-[var(--vba-text)]">
                {member?.name ?? "Đang cập nhật..."}
              </span>
              {member?.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--vba-gold)]" />}
            </div>
            <div className="truncate text-[12px] font-medium text-[var(--vba-text-muted)] mt-0.5">
              {member?.title || member?.industry || "Lãnh đạo Doanh nghiệp"}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vba-gold)]">
                <ShieldCheck className="h-3 w-3" /> HỘI VIÊN CHÍNH THỨC
              </span>
              {member?.code && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--vba-border)] bg-[var(--vba-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--vba-text)] hover:border-[var(--vba-gold)] cursor-pointer"
                >
                  {member.code}
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-[var(--vba-gold)]" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 pt-3 border-t border-[var(--vba-border-soft)] grid grid-cols-3 gap-2">
          <Link
            to="/connect-app/me/edit"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--vba-gold-soft)] py-2.5 text-[11.5px] font-bold text-[var(--vba-gold)] hover:bg-[var(--vba-gold)] hover:text-slate-900 transition-colors border border-[var(--vba-border-accent)] shadow-xs"
          >
            <User className="h-3.5 w-3.5" /> Cập nhật
          </Link>
          <Link
            to="/m/card"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--vba-surface-2)] py-2.5 text-[11.5px] font-semibold text-[var(--vba-text)] hover:text-[var(--vba-gold)] transition-colors border border-[var(--vba-border-soft)]"
          >
            <QrCode className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> Thẻ VIP
          </Link>
          <Link
            to="/m/business-cards"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--vba-surface-2)] py-2.5 text-[11.5px] font-semibold text-[var(--vba-text)] hover:text-[var(--vba-gold)] transition-colors border border-[var(--vba-border-soft)]"
          >
            <Share2 className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> Chạm NFC
          </Link>
        </div>
      </div>

      {/* THEME & APPEARANCE PICKER (Chế độ hiển thị) */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
            Giao diện & Chế độ màu
          </span>
          <span className="text-[11px] font-medium text-[var(--vba-gold)]">
            {theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Tương phản cao"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setTheme(opt.mode)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all cursor-pointer border ${
                  active
                    ? "border-[var(--vba-gold)] bg-[var(--vba-gold-soft)] shadow-md scale-[1.02]"
                    : "border-[var(--vba-border-soft)] bg-[var(--vba-surface)] hover:border-[var(--vba-border)]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active
                      ? "bg-[var(--vba-gold)] text-[#0A111C] shadow-sm"
                      : "bg-[var(--vba-surface-2)] text-[var(--vba-text-muted)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[12px] font-bold text-[var(--vba-text)]">{opt.label}</div>
                <div className="text-[10px] text-[var(--vba-text-dim)]">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LANGUAGE SELECTOR */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
            Ngôn ngữ ứng dụng (8 Ngôn ngữ)
          </span>
          <span className="text-[11px] font-medium text-[var(--vba-gold)]">
            {lang === "vi" ? "Tiếng Việt" :
             lang === "en" ? "English" :
             lang === "km" ? "ភាសាខ្មែរ" :
             lang === "my" ? "မြန်မာဘာသာ" :
             lang === "lo" ? "ພາສາລາວ" :
             lang === "ja" ? "日本語" :
             lang === "ko" ? "한국어" :
             "中文"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: "vi" as const, name: "Tiếng Việt", flag: "🇻🇳" },
            { code: "en" as const, name: "English", flag: "🇬🇧" },
            { code: "km" as const, name: "ភាសាខ្មែរ", flag: "🇰🇭" },
            { code: "my" as const, name: "မြန်မာဘာသာ", flag: "🇲🇲" },
            { code: "lo" as const, name: "ພາສາລາວ", flag: "🇱🇦" },
            { code: "ja" as const, name: "日本語", flag: "🇯🇵" },
            { code: "ko" as const, name: "한국어", flag: "🇰🇷" },
            { code: "zh" as const, name: "中文", flag: "🇨🇳" },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`flex items-center justify-between rounded-xl p-3 border text-xs font-semibold transition cursor-pointer ${
                lang === l.code
                  ? "border-[var(--vba-gold)] bg-[var(--vba-gold-soft)] text-[var(--vba-gold)] shadow-xs"
                  : "border-[var(--vba-border-soft)] bg-[var(--vba-surface)] text-[var(--vba-text)] hover:border-[var(--vba-border)]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{l.flag}</span>
                <span className="truncate">{l.name}</span>
              </span>
              {lang === l.code && <Check className="h-4 w-4 shrink-0 text-[var(--vba-gold)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
          Phân hệ chức năng
        </div>
        <div className="vba-card divide-y divide-[var(--vba-border-soft)] overflow-hidden rounded-2xl border border-[var(--vba-border-soft)]">
          {menu.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                to={m.to}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--vba-surface-2)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--vba-text)]">{m.label}</div>
                  <div className="text-[10px] text-[var(--vba-text-muted)]">{m.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--vba-text-dim)]" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* SUPPORT & LOGOUT */}
      <div className="mx-4 mt-6 space-y-2.5">
        <Link
          to="/install"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface)] py-3 text-[13px] font-semibold text-[var(--vba-gold)] shadow-xs transition hover:bg-[var(--vba-gold-soft)]"
        >
          📲 Cài đặt ứng dụng lên màn hình chính
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="h-4 w-4 text-white" /> Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
}
