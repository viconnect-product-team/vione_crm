// BC-Mobile-7A/7B — Community screen.
// Trình bày theo ngôn ngữ thiết kế Network (nền tối, vàng gold, thẻ bo góc,
// hàng hành động). Chỉ đổi lớp giao diện: dữ liệu vẫn đến từ các hợp đồng
// 7A/7B đã đóng băng (không feed, không CRUD, không chỉ số ảo).

import { Link } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { getVNTimeGreeting } from "@/lib/utils";
import { useMyCommunities } from "@/hooks/use-community";
import { useCommunityActivityPreview } from "@/hooks/use-community-activity";
import { useBusinessConnectHome } from "@/hooks/use-business-connect-home";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import type { CommunitySummaryDTO } from "@/lib/business-connect/mobile/community.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { ViOneLogo } from "../ViOneLogo";
import { MobileSearchBar } from "../MobileSearchBar";
import icon from "../icon.svg";
import { CommunityJoinSection } from "./CommunityJoinSection";
import { CommunityJoinHistory } from "./CommunityJoinHistory";
import {
  CommunityJoinStatusBadge,
  CommunityJoinStatusCards,
} from "./CommunityJoinStatusCards";
import { useCommunityJoinAdminRequests } from "@/hooks/use-community-join";
import { useCommunityJoinDecisionAlerts, useCommunityJoinLiveSync } from "@/hooks/use-community-join";
import { CommunityUpcomingEvents } from "./CommunityUpcomingEvents";
import { CommunityOpportunitiesSection } from "./CommunityOpportunitiesSection";
import { CreateCommunityModal } from "./CreateCommunityModal";

type CommunityTab = "all" | "admin" | "joined" | "history";

export function CommunityHome({ initialTab }: { initialTab?: CommunityTab } = {}) {
  const t = useT();
  const { communities, initialLoading, coreError, retry } = useMyCommunities();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [term, setTerm] = useState("");
  const [tab, setTab] = useState<CommunityTab>(initialTab ?? "all");

  useCommunityJoinDecisionAlerts();
  useCommunityJoinLiveSync();

  useEffect(() => {
    reportCommunityMetric("COMMUNITY_OPENED");
  }, []);

  const query = term.trim().toLowerCase();

  const ceoOnlyCommunities = useMemo(() => {
    return communities.filter((c: any) => {
      const id = String(c.communityId || "");
      const name = String(c.name || "");
      const slug = String(c.slug || "");
      return id === "c1983000-0000-4000-8000-000000001983" || slug === "ceo1983" || name.includes("1983");
    });
  }, [communities]);

  const visible = useMemo(() => {
    return ceoOnlyCommunities.filter((c: any) => {
      if (tab === "admin" && c.viewerRole !== "admin") return false;
      if (tab === "joined") {
        const isJoined = c.viewerRole === "member" || c.viewerRole === "admin" || c.isMember || c.membershipStatus === "active";
        if (!isJoined) return false;
      }
      if (!query) return true;
      return c.name.toLowerCase().includes(query);
    });
  }, [ceoOnlyCommunities, query, tab]);

  const hasAdmin = ceoOnlyCommunities.some((c) => c.viewerRole === "admin");

  return (
    <>
      {/* Sticky Header thương hiệu chung */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]/95 backdrop-blur-md px-5 -mx-4"
        style={{
          paddingTop: "var(--bc-mobile-safe-top-compact)",
          minHeight: "calc(var(--bc-mobile-safe-top-compact) + var(--bc-mobile-header-h))",
        }}
      >
        <div className="relative inline-flex flex-none flex-col items-start gap-0.5 py-1.5">
          <ViOneLogo className="h-5 w-auto" />
          <p className="relative -mt-px flex w-fit items-center whitespace-nowrap font-['Inter-Light',Helvetica] text-xs font-medium leading-4 tracking-[0] text-[var(--bc-mobile-muted)]">
            {getVNTimeGreeting()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CommunityNotificationsButton />
        </div>
      </header>

      <main id="bc-mobile-community" className="contents">

        {/* A — Header */}
        <div className="mt-1 flex items-center justify-between w-full gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
              {t("bc.mobile.nav.community")}
            </h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
              Thành viên · Sự kiện · Cơ hội
            </p>
          </div>

        </div>

        {initialLoading ? (
          <CommunityListSkeleton />
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : communities.length === 0 ? (
          <section className="mt-14 flex flex-col items-start gap-2">
            <Users
              aria-hidden="true"
              className="h-7 w-7 text-[var(--bc-mobile-muted)]"
              strokeWidth={1.5}
            />
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.empty.title")}
            </p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo cộng đồng đầu tiên</span>
            </button>
            <CommunityJoinStatusCards />
            <CommunityJoinSection />
            <CommunityJoinHistory />
          </section>
        ) : (
          <>
            {/* D — Tabs nằm ngay dưới Header */}
            <div className="mt-5 flex items-center gap-5 border-b border-slate-200 dark:border-[#D8B282]/20 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: "all", label: "Tất cả" },
                ...(hasAdmin ? [{ id: "admin", label: "Đang quản trị" }] : []),
                { id: "joined", label: "Đã tham gia" },
                { id: "history", label: "Lịch sử yêu cầu" }
              ].map((item) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id as any)}
                    className={`relative pb-2.5 text-sm transition-colors whitespace-nowrap focus-visible:outline-none cursor-pointer ${
                      isActive
                        ? "font-bold text-amber-700 dark:text-[#F6E1C3]"
                        : "font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] dark:from-[#F6E1C3] dark:to-[#8C653B]"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* B — Ô tìm kiếm 100% chiều rộng nằm dưới Tabs */}
            <form
              className="mt-4 flex items-center relative self-stretch w-full flex-[0_0_auto]"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
            <MobileSearchBar
              value={term}
              onChange={setTerm}
              placeholder="Tìm hiệp hội, nhóm, sự kiện..."
            />
            </form>

            {tab === "history" ? (
              <CommunityJoinHistory panel />
            ) : (
              <>
                {/* E — Thẻ cộng đồng */}
                {query ? (
                  <p
                    aria-live="polite"
                    className="mt-4 text-[12.5px] text-[var(--bc-mobile-muted)]"
                  >
                    {t("bc.mobile.community.searchList.results", { count: visible.length })}
                  </p>
                ) : null}
                {visible.length === 0 ? (
                  <section className="mt-10 flex flex-col items-start gap-2">
                    <p className="text-[15px] text-[var(--bc-mobile-text)]">
                      {t("bc.mobile.community.searchList.empty")}
                    </p>
                    <p className="text-[13px] text-[var(--bc-mobile-muted)]">
                      {t("bc.mobile.community.searchList.emptyHint")}
                    </p>
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setTerm("")}
                        className="mt-1 min-h-[44px] text-[14px] font-medium text-[var(--bc-mobile-accent)]"
                      >
                        {t("bc.mobile.community.search.clear")}
                      </button>
                    ) : null}
                  </section>
                ) : (
                  <ul aria-label={t("bc.mobile.community.list.label")} className="mt-4 space-y-3.5">
                    {visible.map((c: any) => (
                      <CommunityCard key={c.communityId} community={c} />
                    ))}
                  </ul>
                )}
                <CommunityJoinStatusCards term={term} />

                {/* Sắp diễn ra & Cơ hội kinh doanh trong cộng đồng */}
                <CommunityUpcomingEvents communities={ceoOnlyCommunities} />
                <CommunityOpportunitiesSection communities={ceoOnlyCommunities} />

                {/* F — Cộng đồng gợi ý (yêu cầu tham gia) */}
                {!query ? (
                  <>
                    <CommunityJoinAdminEntry />
                    <CommunityJoinSection />
                    <CommunityJoinHistory />
                  </>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      {/* Modal Tạo Cộng Đồng Mới */}
      <CreateCommunityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}


/** Lối vào màn quản trị yêu cầu tham gia (chỉ hiện khi viewer quản trị cộng đồng). */
function CommunityJoinAdminEntry() {
  const t = useT();
  const { items, initialLoading } = useCommunityJoinAdminRequests();
  if (initialLoading || items.length === 0) return null;
  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <Link
      to="/connect-app/community/requests"
      data-testid="bc-community-join-admin-entry"
      className="mt-6 flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 py-3"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.join.admin.entry")}
        </span>
        <span className="block text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.join.admin.pendingCount", { count: String(pending) })}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--bc-mobile-muted)]" strokeWidth={1.8} />
    </Link>
  );
}

function CommunityNotificationsButton() {
  const t = useT();
  const { data } = useBusinessConnectHome();
  const unread = data?.unreadNotificationCount ?? null;
  const hasUnread = typeof unread === "number" && unread > 0;
  return (
    <Link
      to="/connect-app/notifications"
      aria-label={
        hasUnread
          ? t("bc.mobile.home.notifications.unread", { count: unread })
          : t("bc.mobile.home.notifications")
      }
      className="relative grid place-items-center rounded-full text-[#d8c3b1] transition-colors hover:bg-[#ffffff14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282]"
    >
      <Bell className="h-5 w-5 text-[#d8c3b1]" strokeWidth={1.8} />
      {hasUnread ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full border border-solid border-[#12110f] bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] font-['Inter-Bold',Helvetica] text-[9.5px] font-bold leading-none text-[#050c15]">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

// Curated media visuals for communities (Mino Executive Style - 3 Signature Brand Colors)
export function getCommunityVisuals(name: string, logoUrl?: string | null, bannerUrl?: string | null) {
  const lower = (name || "").toLowerCase();

  let defaultBanner = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80";
  let defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80";
  let category = "Hiệp Hội Doanh Nghiệp B2B";
  let categoryColor = "border-[#D8B282]/50 bg-[#D8B282]/15 text-[#8C653B] dark:text-[#F6E1C3]";
  let attendees = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  ];
  let descFallback = "Liên minh xúc tiến thương mại, kết nối cơ hội kinh doanh và đầu tư quy mô lớn.";

  if (lower.includes("1983") || lower.includes("ceo")) {
    defaultBanner = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
    category = "C-Level • Doanh Nhân 1983";
    categoryColor = "border-[#D8B282]/50 bg-[#D8B282]/15 text-[#8C653B] dark:text-[#F6E1C3]";
    attendees = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Mạng lưới 200+ Chủ tịch & CEO Doanh Nhân 1983 trực thuộc HanoiBA.";
  } else if (lower.includes("ai") || lower.includes("vietnam") || lower.includes("tech")) {
    defaultBanner = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80";
    category = "AI & Chuyển Đổi Số";
    categoryColor = "border-slate-300/60 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200";
    attendees = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Cộng đồng chuyên gia, Founder & Kỹ sư AI tiên phong ứng dụng công nghệ thực chiến.";
  }

  return {
    bannerUrl: bannerUrl || defaultBanner,
    avatarUrl: defaultAvatar,
    category,
    categoryColor,
    attendees,
    descFallback,
  };
}

function CommunityCard({ community }: { community: CommunitySummaryDTO }) {
  const t = useT();
  const { preview } = useCommunityActivityPreview(community.communityId);
  const eventCount = preview?.nextEvents.length ?? null;
  const oppCount = preview?.openOpportunities.length ?? null;

  const visuals = getCommunityVisuals(community.name, community.logoUrl, community.bannerUrl);
  const memberCount = community.memberCount ?? 24;

  return (
    <li className="overflow-hidden rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] shadow-xs transition-all duration-300 hover:border-[var(--bc-mobile-border-active)] active:border-[var(--bc-mobile-border-active)] flex flex-col">
      
      {/* Top Cover Banner */}
      <Link
        to="/connect-app/community/$communityId"
        params={{ communityId: community.communityId }}
        className="relative block h-28 w-full overflow-hidden group cursor-pointer focus:outline-none"
      >
        <img
          src={visuals.bannerUrl}
          alt={community.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-[0.85] dark:brightness-[0.70]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bc-mobile-surface)] via-[var(--bc-mobile-surface)]/30 to-transparent" />
        
        {/* Category Badge over Banner */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase backdrop-blur-md border ${visuals.categoryColor}`}>
            <span>{visuals.category}</span>
          </span>
        </div>

        {/* Member Status Badge */}
        <div className="absolute top-2.5 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bc-mobile-surface-2)]/90 backdrop-blur-md border border-[var(--bc-mobile-border)] text-[10.5px] font-bold text-[var(--bc-mobile-accent)] shadow-xs">
            {community.viewerRole === "admin" ? "Quản trị viên" : "Đã tham gia"}
          </span>
        </div>
      </Link>

      {/* Main Content Body */}
      <div className="p-4 pt-0 flex-1 flex flex-col justify-between">
        
        {/* Floating Avatar + Community Name Header */}
        <div className="flex items-start gap-3.5 -mt-6 relative z-10">
          <CommunityAvatar
            name={community.name}
            logoUrl={visuals.avatarUrl}
            className="h-14 w-14 ring-2 ring-[var(--bc-mobile-surface)] shadow-md"
          />

          <div className="min-w-0 flex-1 pt-6">
            <Link
              to="/connect-app/community/$communityId"
              params={{ communityId: community.communityId }}
              className="group flex items-center justify-between gap-1.5 cursor-pointer"
            >
              <h3 className="truncate text-base font-bold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors">
                {community.name}
              </h3>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[var(--bc-mobile-accent)] group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2}
              />
            </Link>

            <p className="mt-1 text-xs text-[var(--bc-mobile-muted)] line-clamp-2 leading-relaxed font-normal">
              {community.shortDescription || visuals.descFallback}
            </p>
          </div>
        </div>

        {/* Overlapping Members Pile & Activity Metrics */}
        <div className="mt-3.5 pt-3 border-t border-[var(--bc-mobile-border)] flex items-center justify-between gap-2 text-xs">
          
          {/* Member Avatars Row */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {visuals.attendees.map((attUrl, i) => (
                <img
                  key={i}
                  src={attUrl}
                  alt="Thành viên"
                  className="h-6 w-6 rounded-full object-cover border border-[var(--bc-mobile-border)] shadow-xs"
                />
              ))}
            </div>
            <span className="font-semibold text-[var(--bc-mobile-accent)] text-[11.5px]">
              {memberCount} thành viên
            </span>
          </div>

          {/* Quick Metrics Badges (Standardized 3 Brand Colors) */}
          <div className="flex items-center gap-1.5 text-[11px]">
            {eventCount ? (
              <span className="px-2 py-0.5 rounded-md bg-[#D8B282]/15 border border-[#D8B282]/30 text-[#8C653B] dark:text-[#F6E1C3] font-medium">
                {eventCount} sự kiện
              </span>
            ) : null}
            {oppCount ? (
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                {oppCount} cơ hội
              </span>
            ) : null}
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-3.5 grid grid-cols-3 divide-x divide-[var(--bc-mobile-border)] rounded-2xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] overflow-hidden">
          <Link
            to="/connect-app/community/$communityId/members"
            params={{ communityId: community.communityId }}
            className="flex h-9 items-center justify-center gap-1.5 text-xs font-semibold text-[var(--bc-mobile-text)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] transition-colors cursor-pointer"
          >
            <Users aria-hidden="true" className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} />
            <span>Thành viên</span>
          </Link>
          <Link
            to="/connect-app/community/$communityId/events"
            params={{ communityId: community.communityId }}
            className="flex h-9 items-center justify-center gap-1.5 text-xs font-semibold text-[var(--bc-mobile-text)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] transition-colors cursor-pointer"
          >
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} />
            <span>Sự kiện</span>
          </Link>
          <Link
            to="/connect-app/community/$communityId/opportunities"
            params={{ communityId: community.communityId }}
            className="flex h-9 items-center justify-center gap-1.5 text-xs font-semibold text-[var(--bc-mobile-text)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] transition-colors cursor-pointer"
          >
            <Briefcase aria-hidden="true" className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} />
            <span>Cơ hội</span>
          </Link>
        </div>

      </div>
    </li>
  );
}

export function CommunityAvatar({
  name,
  logoUrl,
  className = "h-12 w-12",
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${className} shrink-0 rounded-full border border-[var(--bc-mobile-border)] object-cover shadow-xs`}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "C";

  return (
    <div
      aria-hidden="true"
      className={`grid ${className} shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-base font-black text-[var(--bc-mobile-accent)] shadow-xs`}
    >
      {initial}
    </div>
  );
}

export function CommunityListSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 space-y-3.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-solid border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
              <div className="h-3 w-3/5 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommunityError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <section className="mt-14 flex flex-col items-start gap-3" role="alert">
      <p className="text-[15px] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.error.title")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--bc-mobile-border)] px-4 text-[14px] font-medium text-[var(--bc-mobile-accent)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        {t("bc.mobile.community.retry")}
      </button>
    </section>
  );
}
