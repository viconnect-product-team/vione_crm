import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  IdCard,
  Contact,
  Users,
  Calendar,
  Newspaper,
  FolderOpen,
  LayoutGrid,
  Gift,
  Phone,
  Handshake,
  Package,
  Crown,
  Bookmark,
  ChevronRight,
  BadgeCheck,
  Copy,
  Clock,
  MapPin,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { SectionTitle } from "@/components/member/MemberShell";
import { QrCanvas } from "@/components/member/QrCanvas";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import heroImg from "@/assets/vba-hero.jpg";
import giftImg from "@/assets/vba-gift.png";
import eventImg from "@/assets/vba-event.jpg";
import { useServerData } from "@/hooks/use-server-data";
import {
  getMyMember,
  listMyEvents,
  getMyAssociationBrand,
  type MyMember,
  type MyEvent,
  type MyAssociationBrand,
} from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";
const appIcon = "/app-icon.png";

export const Route = createFileRoute("/m/")({
  component: Home,
});

function initials(name?: string) {
  if (!name) return "ViOne";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const quickActionDefs = [
  { key: "m.index.qaCard", icon: IdCard, to: "/m/card" },
  { key: "m.index.qaBusinessCards", icon: Contact, to: "/m/business-cards" },
  { key: "m.index.qaMembers", icon: Users, to: "/m/members" },
  { key: "m.index.qaEvents", icon: Calendar, to: "/m/events" },
  { key: "m.index.qaNews", icon: Newspaper, to: "/m/news" },
  { key: "m.index.qaLibrary", icon: FolderOpen, to: "/m/library" },
  { key: "m.index.qaPerks", icon: LayoutGrid, to: "/m/perks" },
  { key: "m.index.qaOffers", icon: Gift, to: "/m/perks" },
  { key: "m.index.qaContact", icon: Phone, to: "/m/messages" },
] as const;

function Home() {
  const t = useT();
  const fetchMember = useServerFn(getMyMember);
  const fetchEvents = useServerFn(listMyEvents);
  const fetchBrand = useServerFn(getMyAssociationBrand);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null);
  const { data: events } = useServerData<MyEvent[]>(() => fetchEvents(), []);
  const { data: brand } = useServerData<MyAssociationBrand | null>(() => fetchBrand(), null);
  const code = member?.code ?? "";
  const firstEvent = events[0];

  return (
    <div className="vba-animate">
      {/* Hero with overlaid brand header */}
      <div className="relative">
        <img
          src={heroImg}
          alt={t("m.index.heroAlt")}
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-40"
          width={1024}
          height={768}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--vba-bg)]/80 to-[var(--vba-bg)]" />

        <div className="relative z-10">
          {/* Brand header + Theme & Lang Controls */}
          <header
            className="flex items-center justify-between border-b border-[var(--vba-border-soft)]/40 bg-[var(--vba-bg)]/80 px-4 backdrop-blur-md"
            style={{
              paddingTop: "var(--bc-mobile-safe-top-compact, calc(max(env(safe-area-inset-top, 0px), 12px) + 4px))",
              minHeight: "calc(var(--bc-mobile-safe-top-compact, calc(max(env(safe-area-inset-top, 0px), 12px) + 4px)) + var(--bc-mobile-header-h, 56px))",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--vba-gold)]/40 bg-[var(--vba-surface)] p-1 shadow-md">
                <img
                  src={brand?.logoUrl || appIcon}
                  alt={brand?.name || "ViOne"}
                  className="h-full w-full object-contain"
                  width={36}
                  height={36}
                />
              </div>
              <div className="leading-tight">
                {brand?.name ? (
                  <>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
                      HIỆP HỘI DOANH NGHIỆP
                    </div>
                    <div className="max-w-[150px] truncate text-[13px] font-extrabold tracking-tight vba-gold-text sm:max-w-[200px]">
                      {brand.name}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[13px] font-extrabold tracking-tight vba-gold-text">
                      {t("m.index.brandLine1")}
                    </div>
                    <div className="text-[10px] font-semibold tracking-widest text-[var(--vba-text-muted)]">
                      {t("m.index.brandLine2")}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Controls: Notifications */}
            <div className="flex items-center gap-2">
              <Link
                to="/m/notifications"
                aria-label={t("m.index.notifAria")}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--vba-border)] bg-[var(--vba-surface)] text-[var(--vba-gold)] shadow-xs transition hover:border-[var(--vba-gold)]"
              >
                <Bell className="h-4 w-4 text-[var(--vba-gold)]" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vba-danger)] shadow-[0_0_6px_#EF4444]" />
              </Link>
            </div>
          </header>

          {/* Hero title + QR Pass Preview */}
          <div className="flex items-start justify-between gap-3 px-4 pb-20 pt-5">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 rounded-full border border-[var(--vba-gold)]/30 bg-[var(--vba-gold-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--vba-gold)]">
                <Sparkles className="h-3 w-3" /> NỀN TẢNG HỘI VIÊN SỐ
              </div>
              <h2 className="mt-2 text-[22px] font-black leading-tight tracking-tight vba-gold-text sm:text-[24px]">
                {t("m.index.heroTitle")}
              </h2>
              <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-[var(--vba-gold)] to-transparent" />
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--vba-text-muted)]">
                {(brand as any)?.tagline || t("m.index.heroSlogan")}
              </p>
            </div>

            {/* Gold metallic QR — quét để mở thẻ hội viên */}
            <Link
              to="/m/card"
              aria-label={t("m.index.qrAria")}
              className="mt-0.5 flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-[var(--vba-gold)]/40 bg-[var(--vba-surface)] p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition-transform hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white p-1 shadow-inner">
                <QrCanvas
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/card/${code || "demo"}`
                      : `/card/${code || "demo"}`
                  }
                  size={84}
                  light="#FFFFFF"
                  dark="#0A111C"
                />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--vba-gold)]">
                <QrCode className="h-3 w-3" /> {t("m.index.qrScan")}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* VIP Member card */}
      <Link
        to="/m/card"
        className="relative z-10 -mt-14 mx-4 flex items-center gap-3.5 rounded-2xl vba-card p-4 transition hover:border-[var(--vba-gold)]/60"
      >
        {member?.avatar ? (
          <img
            src={member.avatar}
            alt={member?.name ?? ""}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[var(--vba-gold)]/70 ring-offset-2 ring-offset-[var(--vba-bg)] shadow-md"
          />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full vba-gold-grad text-[17px] font-black text-[#0A111C] ring-2 ring-[var(--vba-gold)]/70 ring-offset-2 ring-offset-[var(--vba-bg)] shadow-md">
            {initials(member?.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-[var(--vba-text)]">
              {member?.name ?? "..."}
            </span>
            {member?.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--vba-gold)]" />
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[var(--vba-text-muted)]">
            {member?.title || member?.industry || "Hội viên chính thức"}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vba-gold)]">
              VIP GOLD
            </span>
            {member?.code && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--vba-border)] bg-[var(--vba-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--vba-text)]">
                {member.code}
                <Copy className="h-3 w-3 text-[var(--vba-gold)]" />
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--vba-text-dim)]" />
      </Link>

      {/* Quick actions grid (3x3 / 4 col) */}
      <div className="mx-4 mt-6">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[var(--vba-text-muted)]">
          {t("m.index.quickActions" as any) || "Tính năng nhanh"}
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {quickActionDefs.map((a: any) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.key}
                to={a.to}
                className="group flex flex-col items-center gap-1.5 transition"
              >
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] text-[var(--vba-gold)] shadow-sm backdrop-blur-md transition-all duration-200 group-hover:scale-105 group-hover:border-[var(--vba-gold)]/60 group-active:scale-95">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <span className="text-center text-[10px] font-semibold leading-tight text-[var(--vba-text)] transition-colors group-hover:text-[var(--vba-gold)]">
                  {t(a.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Promo pair: Opportunities & Marketplace */}
      <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
        <Link
          to="/m/opportunities"
          className="vba-card flex flex-col justify-between p-4 transition hover:border-[var(--vba-gold)]/50"
        >
          <div>
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
              <Handshake className="h-5 w-5" />
            </div>
            <div className="text-[13px] font-bold text-[var(--vba-text)]">
              {t("m.index.promoOppTitle")}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--vba-text-muted)]">
              {t("m.index.promoOppDesc")}
            </p>
          </div>
          <span className="mt-3.5 inline-flex self-start rounded-xl vba-gold-grad px-3 py-1 text-[10px] font-extrabold text-[#0A111C]">
            {t("m.index.exploreNow")}
          </span>
        </Link>

        <Link
          to="/m/products"
          className="vba-card flex flex-col justify-between p-4 transition hover:border-[var(--vba-gold)]/50"
        >
          <div>
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
              <Package className="h-5 w-5" />
            </div>
            <div className="text-[13px] font-bold text-[var(--vba-text)]">
              {t("m.index.promoProductTitle")}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--vba-text-muted)]">
              {t("m.index.promoProductDesc")}
            </p>
          </div>
          <span className="mt-3.5 inline-flex self-start rounded-xl vba-gold-grad px-3 py-1 text-[10px] font-extrabold text-[#0A111C]">
            {t("m.index.postNow")}
          </span>
        </Link>
      </div>

      {/* Privilege banner */}
      <div className="relative mx-4 mt-5 flex items-center gap-3 overflow-hidden rounded-2xl vba-card p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Crown className="h-4.5 w-4.5 shrink-0 text-[var(--vba-gold)]" />
            <div className="text-[13px] font-bold vba-gold-text">{t("m.index.privilegeTitle")}</div>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--vba-text-muted)]">
            {t("m.index.privilegeDesc")}
          </p>
          <Link
            to="/m/perks"
            className="mt-3 inline-block rounded-xl vba-gold-grad px-3 py-1 text-[10px] font-extrabold text-[#0A111C]"
          >
            {t("m.index.viewNow")}
          </Link>
        </div>
        <img
          src={giftImg}
          alt={t("m.index.giftAlt")}
          loading="lazy"
          width={512}
          height={512}
          className="h-20 w-20 shrink-0 object-contain drop-shadow-md"
        />
      </div>

      {/* Featured events */}
      <div className="mx-4 mt-6">
        <SectionTitle
          title={t("m.index.featuredEvents")}
          action={
            <Link
              to="/m/events"
              className="flex items-center gap-0.5 text-[12px] font-bold text-[var(--vba-gold)] transition hover:underline"
            >
              {t("m.index.viewAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        {firstEvent && (
          <Link
            to="/m/events"
            className="vba-card flex gap-3.5 p-3.5 transition hover:border-[var(--vba-gold)]/50"
          >
            <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl border border-[var(--vba-border)]">
              <img
                src={eventImg}
                alt={firstEvent.title}
                loading="lazy"
                width={512}
                height={512}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-1.5 top-1.5 flex flex-col items-center justify-center rounded-lg vba-gold-grad px-1.5 py-0.5 shadow-md">
                <span className="text-[14px] font-black leading-none text-[#0A111C]">
                  {firstEvent.day}
                </span>
                <span className="text-[8px] font-bold uppercase text-[#0A111C]">
                  {firstEvent.month}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <div className="line-clamp-2 text-[13px] font-bold text-[var(--vba-text)]">
                  {firstEvent.title}
                </div>
                {firstEvent.isToday && (
                  <span className="shrink-0 rounded-full border border-[var(--vba-gold)]/40 bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--vba-gold)] animate-pulse">
                    Hôm nay
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--vba-text-muted)]">
                <Clock className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> {firstEvent.time}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--vba-text-muted)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--vba-gold)]" /> <span className="line-clamp-1">{firstEvent.place}</span>
              </div>
              {firstEvent.communityName && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--vba-gold)]">
                  <Users className="h-3 w-3" /> {firstEvent.communityName}
                </div>
              )}
            </div>
            <Bookmark className="h-4.5 w-4.5 shrink-0 text-[var(--vba-text-dim)]" />
          </Link>
        )}
      </div>

      {/* Install hint */}
      <div className="mx-4 mt-5">
        <Link
          to="/install"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--vba-gold)]/40 bg-[var(--vba-surface)] py-3 text-[12px] font-bold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)]"
        >
          📲 {t("m.index.installHint")}
        </Link>
      </div>
    </div>
  );
}

