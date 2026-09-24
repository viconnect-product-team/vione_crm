// BC-Mobile-2B — Network screen (Executive Minimal Luxury, ViOne).
//
// Cấu trúc theo thiết kế đã duyệt: tiêu đề + số liệu quan hệ, ô tìm kiếm luôn
// hiển thị kèm bộ lọc, dải "AI Match" (gợi ý quan hệ 6A), danh sách "Cần giữ
// kết nối", dải tròn "Gặp gần đây" và dòng "Khoảnh khắc gần đây".
// Chỉ thay lớp trình bày — mọi dữ liệu vẫn đi qua các hợp đồng 2A/6A/7E.

import { Link } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useFmt, useLang, useT } from "@/lib/i18n";
import { getVNTimeGreeting } from "@/lib/utils";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import icon from "./icon.svg";
import { MobileSearchBar } from "./MobileSearchBar";
import image from "./image.svg";
import { ViOneLogo } from "./ViOneLogo";
import {
  useBusinessConnectNetwork,
  type BcMobileNetworkPerson,
} from "@/hooks/use-business-connect-network";
import { useBusinessConnectHome } from "@/hooks/use-business-connect-home";
import { useTodayRelationshipRecommendations } from "@/hooks/use-relationship-intelligence";
import { useIncomingConnectionRequests } from "@/hooks/use-network-requests";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { toast } from "sonner";
import { useVSheet } from "@/hooks/use-v-sheet";
import { useNetworkFeed } from "@/hooks/use-network-feed";
import { useUnreadDmCount } from "@/hooks/use-bc-dm";
import { avatarOrDemo, demoAvatar } from "@/lib/business-connect/mobile/demo-avatars";
import { BusinessConnectTopBar } from "./BusinessConnectTopBar";
import { NetworkFeedCard } from "./NetworkFeedCard";
import { NetworkPersonRow } from "./NetworkPersonRow";
import { AiMatchConnectAction, AiMatchDetailSheet } from "./AiMatchDetailSheet";
import { CustomersPanel } from "./customers/CustomersPanel";
import { HomeNotificationsMenu } from "./HomeNotificationsMenu";
import { DynamicAiMatcherPanel } from "./ai/DynamicAiMatcherPanel";
import { NetworkStoriesStrip } from "./NetworkStoriesStrip";
import { NetworkSocialComposer } from "./NetworkSocialComposer";
import { NetworkPartnerSuggestionsStrip } from "./NetworkPartnerSuggestionsStrip";
import { PostMomentModal } from "./moments/PostMomentModal";

type NetworkSort = "recent" | "name" | "company";
type NetworkFilter = "all" | "connected" | "saved_card" | "card_scanned" | "contact_shared";

const FILTERS: NetworkFilter[] = [
  "all",
  "connected",
  "saved_card",
  "card_scanned",
  "contact_shared",
];

const FILTER_TKEY = {
  all: "bc.mobile.network.filter.all",
  connected: "bc.mobile.network.tag.connected",
  saved_card: "bc.mobile.network.tag.saved",
  card_scanned: "bc.mobile.network.tag.scanned",
  contact_shared: "bc.mobile.network.tag.shared",
} as const;

export type NetworkTabType = "network" | "customers" | "suggestions" | "requests";

export function NetworkHome({
  initialTab,
}: {
  initialTab?: NetworkTabType;
} = {}) {
  const t = useT();
  const searchId = useId();
  const { lang } = useLang();
  const { openV } = useVSheet();
  const viewerUserId = useViewerUserId();
  const incomingRequests = useIncomingConnectionRequests();

  const tabs = useMemo(() => {
    const list: Array<{ id: NetworkTabType; label: string }> = [
      { id: "network", label: "Mạng lưới" },
      { id: "customers", label: "Khách hàng" },
      { id: "suggestions", label: "Gợi ý (AI)" },
    ];
    if (incomingRequests.requests.length > 0) {
      list.push({ id: "requests", label: `Lời mời (${incomingRequests.requests.length})` });
    }
    return list;
  }, [incomingRequests.requests.length]);

  const [tab, setTab] = useState<NetworkTabType>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "customers" || p === "suggestions" || p === "requests") return p;
    }
    return "network";
  });

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    } else if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "customers" || p === "suggestions" || p === "network" || p === "requests") {
        setTab(p as any);
      }
    }
  }, [initialTab]);

  const handleTabChange = (newTab: NetworkTabType) => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newTab === "network") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", newTab);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<NetworkSort>("recent");
  const [filter, setFilter] = useState<NetworkFilter>("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const network = useBusinessConnectNetwork(term);
  const { recommendations } = useTodayRelationshipRecommendations(lang);
  const clearSearch = () => setTerm("");
  const filtering = filter !== "all";
  const narrowed = network.searching || filtering;

  const people = useMemo(() => {
    const list = network.people.filter((p) => filter === "all" || p.context?.kind === filter);
    if (sort === "name") {
      return list.sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? "", "vi"));
    }
    if (sort === "company") {
      return list.sort((a, b) => (a.companyName ?? "").localeCompare(b.companyName ?? "", "vi"));
    }
    return list.sort((a, b) => {
      const av = a.context?.at ? new Date(a.context.at).getTime() : 0;
      const bv = b.context?.at ? new Date(b.context.at).getTime() : 0;
      return bv - av;
    });
  }, [network.people, sort, filter]);

  const recent = useMemo(
    () =>
      [...network.people]
        .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())
        .slice(0, 8),
    [network.people],
  );

  // BC-Mobile-7E — dòng cuộc gặp (khoảnh khắc chính chủ) làm nội dung feed.
  const feed = useNetworkFeed();
  const peopleById = useMemo(
    () => new Map(network.people.map((p) => [p.personId, p])),
    [network.people],
  );
  const showFeed = !narrowed && feed.items.length > 0;
  // Khi tìm kiếm/lọc: hai panel gợi ý chỉ hiển thị người thuộc kết quả hiện tại.
  const allowedIds = useMemo(
    () => (narrowed ? new Set(people.map((p) => p.personId)) : null),
    [narrowed, people],
  );



  const home = useBusinessConnectHome();
  const unread = home.data?.unreadNotificationCount ?? null;
  const unreadDmCount = useUnreadDmCount();

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
          <Link
            to="/connect-app/inbox"
            aria-label="Tin nhắn"
            className="relative grid place-items-center rounded-full p-1 text-[var(--bc-mobile-muted)] transition-colors hover:bg-black/5 dark:hover:bg-[#ffffff14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282]"
          >
            <MessageSquare className="h-5 w-5 text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]" strokeWidth={1.8} />
            {unreadDmCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full border border-solid border-[var(--bc-mobile-surface)] bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] font-['Inter-Bold',Helvetica] text-[9.5px] font-bold leading-none text-[#050c15]">
                {unreadDmCount}
              </span>
            ) : null}
          </Link>
          <HomeNotificationsMenu unreadCount={unread} />
        </div>
      </header>

      <main id="bc-mobile-network" className="contents">

        <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <h1
              id="network-heading"
              className="relative flex items-center mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-bold text-[var(--bc-mobile-text,#0F172A)] text-2xl tracking-[0] leading-8"
            >
              Network
            </h1>
            <Link
              to="/connect-app/card-scan"
              aria-label={t("bc.mobile.network.addPerson")}
              className="grid h-9 w-9 place-items-center rounded-full text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors border border-solid border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] hover:border-[var(--bc-mobile-accent)]"
            >
              <UserPlus className="h-4.5 w-4.5" strokeWidth={1.8} />
            </Link>
          </div>
          <p className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto] mt-[-0.5px]">
            <span className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Light',Helvetica] font-medium text-[var(--bc-mobile-muted,#64748B)] text-xs tracking-[0] leading-4 whitespace-nowrap">
              {network.people.length} kết nối
            </span>
            <span
              className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Light',Helvetica] font-medium text-[var(--bc-mobile-muted,#64748B)] text-xs tracking-[0] leading-4 whitespace-nowrap"
              aria-hidden="true"
            >
              •
            </span>
            <span className="mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-semibold bg-[linear-gradient(135deg,#DFB876_0%,#B8860B_45%,#966A06_70%,#6E4D00_100%)] dark:bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] bg-clip-text text-transparent text-xs leading-4 relative flex items-center w-fit tracking-[0] whitespace-nowrap">
              {recommendations.length} cần chăm sóc
            </span>
          </p>
        </header>

        {/* A2 — Tab categories cuộn ngang */}
        <nav
          className="mt-4 flex items-start gap-2 px-0 py-1 relative self-stretch w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Network categories"
        >
          {tabs.map((tabItem) => {
            const isActive = tab === tabItem.id;

            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => handleTabChange(tabItem.id as any)}
                aria-pressed={isActive}
                className={`all-unset box-border inline-flex h-[34px] px-4 rounded-full border items-center justify-center relative border-solid transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[var(--bc-mobile-accent-grad)] text-black border-transparent shadow-[0_2px_10px_rgba(201,158,74,0.35)]"
                    : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:border-[var(--bc-mobile-accent)] hover:text-[var(--bc-mobile-text)]"
                }`}
              >
                <span
                  className={`[font-family:'Inter-Medium',Helvetica] text-xs text-center leading-4 relative flex items-center w-fit tracking-[0] whitespace-nowrap font-medium ${
                    isActive ? "text-black font-bold" : "text-[var(--bc-mobile-muted)]"
                  }`}
                >
                  {tabItem.label}
                </span>
              </button>
            );
          })}
        </nav>

        {tab === "customers" ? (
          <CustomersPanel />
        ) : tab === "suggestions" ? (
          <NetworkAllAiSuggestionsPanel peopleById={peopleById} initialQuery={term} />
        ) : tab === "requests" ? (
          <div className="mt-4">
            <NetworkIncomingRequestsSection full />
          </div>
        ) : (
        <>

        {/* Lời mời kết bạn đang chờ phản hồi — luôn hiển thị ngay đầu danh sách khi có lời mời */}
        {!narrowed && <NetworkIncomingRequestsSection />}

        {/* Khoảnh khắc 24h Doanh nhân (Facebook-grade Stories Carousel) */}
        {!narrowed && (
          <NetworkStoriesStrip onOpenCreateStory={() => setStoryModalOpen(true)} />
        )}

        {/* B — Ô tìm kiếm + bộ lọc */}
        <form
          className="mt-4 flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <MobileSearchBar
            id="bc-network-search"
            value={term}
            onChange={setTerm}
            placeholder={t("bc.mobile.network.search.placeholder")}
          />
          <div className="relative shrink-0">
            <button
              className="flex w-[42px] h-[42px] items-center justify-center p-2.5 relative bg-[var(--bc-mobile-surface-2)] backdrop-blur-md rounded-lg border border-solid border-[var(--bc-mobile-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bc-mobile-accent)] hover:border-[var(--bc-mobile-accent)] transition-colors"
              type="button"
              aria-label={t("bc.mobile.network.filter")}
              aria-pressed={sortOpen}
              onClick={() => setSortOpen((active) => !active)}
            >
              <SlidersHorizontal className="h-4 w-4 text-[var(--bc-mobile-muted)]" aria-hidden="true" strokeWidth={1.8} />
            </button>
            {sortOpen ? (
              <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] backdrop-blur-xl py-1 shadow-2xl">
                <p className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.network.sort.label")}
                </p>
                <ul>
                  {(["recent", "name", "company"] as const).map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => setSort(option)}
                        aria-current={sort === option}
                        className={`flex min-h-[44px] w-full items-center px-3.5 text-left text-[14px] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${
                          sort === option
                            ? "text-[var(--bc-mobile-accent)]"
                            : "text-[var(--bc-mobile-text)]"
                        }`}
                      >
                        {t(`bc.mobile.network.sort.${option}` as const)}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-[var(--bc-mobile-border)] px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.network.filter")}
                </p>
                <ul>
                  {FILTERS.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(option);
                          setSortOpen(false);
                        }}
                        aria-current={filter === option}
                        className={`flex min-h-[44px] w-full items-center px-3.5 text-left text-[14px] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${
                          filter === option
                            ? "text-[var(--bc-mobile-accent)]"
                            : "text-[var(--bc-mobile-text)]"
                        }`}
                      >
                        {t(FILTER_TKEY[option])}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </form>

        {network.initialLoading ? (
          <NetworkSkeleton />
        ) : network.coreError ? (
          <NetworkError onRetry={network.retry} />
        ) : (
          <>

            {/* AI Match và Nurture List - Chỉ hiển thị khi tab là network */}
            {tab === "network" && (
              <>
                {/* ViOne Dynamic AI Copilot Banner */}
                {!narrowed && (
                  <div className="mb-4 p-4 rounded-2xl border border-amber-300/60 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 via-amber-100/35 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xs dark:shadow-xl relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#F6E1C3] to-[#D8B282] p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-amber-900" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">ViOne AI Copilot Matcher</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 dark:border-amber-400/40">Dynamic %</span>
                          </div>
                          <p className="text-[13.5px] font-bold text-slate-900 dark:!text-white mt-0.5">Tìm kiếm đối tác theo năng lực & chức danh</p>
                          <p className="text-[11.5px] text-slate-600 dark:!text-slate-300 mt-0.5 line-clamp-1">Ví dụ: "Tôi cần tìm 1 người có khả năng gọi vốn quỹ đầu tư..."</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange("suggestions")}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-[linear-gradient(135deg,#FFF3C4_0%,#FEE180_30%,#F5C443_65%,#EDB028_100%)] text-slate-950 border border-amber-400/50 text-xs font-black uppercase tracking-wider shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Khám phá AI</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <NetworkAiMatchStrip
                  peopleById={peopleById}
                  allowedIds={allowedIds}
                  onViewAll={() => handleTabChange("suggestions")}
                />
                <NetworkNurtureList
                  allowedIds={allowedIds}
                  onViewAll={() => handleTabChange("suggestions")}
                />
              </>
            )}

            {/* Gặp gần đây và Feed cuộc gặp - Chỉ hiển thị khi tab là network */}
            {tab === "network" && (
              <>
                {!narrowed && recent.length > 0 ? (
                  <NetworkRecentStrip
                    people={recent}
                    onViewAll={() => {
                      setTab("network");
                      setFilter("all");
                    }}
                  />
                ) : null}

                {/* Facebook-grade Social Status Composer */}
                {!narrowed ? (
                  <NetworkSocialComposer />
                ) : null}

                {/* Gợi ý kết nối doanh nhân cùng ngành (Facebook-grade Partner Suggestions) */}
                {!narrowed ? (
                  <NetworkPartnerSuggestionsStrip />
                ) : null}

                {/* Khoảnh khắc mạng lưới (Feed cuộc gặp) ngay dưới thanh ghi nhanh */}
                {!narrowed ? (
                  <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="min-w-0 truncate text-[10px] font-medium tracking-[1px] uppercase text-[var(--bc-mobile-muted)]">
                        {t("bc.mobile.network.moments.title")}
                      </h2>
                      {feed.items.length > 0 && (
                        <span className="text-[11px] text-[var(--bc-mobile-muted)]">
                          {feed.items.length} khoảnh khắc
                        </span>
                      )}
                    </div>
                    {feed.items.length > 0 ? (
                      <ul
                        aria-label={t("bc.mobile.network.moments.title")}
                        aria-busy={feed.isLoadingMore}
                        className="space-y-3"
                      >
                        {feed.items.map((item) => (
                          <NetworkFeedCard
                            key={item.momentId}
                            item={item}
                            person={peopleById.get(item.personId) ?? null}
                          />
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 text-center shadow-xs">
                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-[13px] font-semibold text-[var(--bc-mobile-text)]">
                          Chưa có khoảnh khắc nào gần đây
                        </p>
                        <p className="mt-1 text-[11.5px] text-[var(--bc-mobile-muted)]">
                          Ghi lại các cuộc gặp gỡ, trao đổi và hợp tác đầu tiên của bạn để lưu giữ hành trình.
                        </p>
                        <Link
                          to="/connect-app/moment"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition hover:opacity-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ghi khoảnh khắc ngay</span>
                        </Link>
                      </div>
                    )}
                  </section>
                ) : null}

                {/* Danh sách người trong Network */}
                <section className="mt-7">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="min-w-0 truncate text-[10px] font-medium tracking-[1px] uppercase text-[var(--bc-mobile-muted)]">
                      {t("bc.mobile.network.people")}
                    </h2>
                    {narrowed ? (
                      <p
                        aria-live="polite"
                        className="shrink-0 text-[12.5px] text-[var(--bc-mobile-muted)]"
                      >
                        {t("bc.mobile.network.results", { count: people.length })}
                        {filtering ? ` · ${t(FILTER_TKEY[filter])}` : ""}
                      </p>
                    ) : null}
                  </div>

                  {people.length === 0 ? (
                    network.searching ? (
                      <NetworkSearchEmpty onClear={clearSearch} />
                    ) : filtering ? (
                      <NetworkFilterEmpty onReset={() => setFilter("all")} />
                    ) : (
                      <NetworkEmpty onOpenV={openV} />
                    )
                  ) : (
                    <ul
                      aria-label={t("bc.mobile.network.list.label")}
                      aria-busy={network.isLoadingMore}
                      className="space-y-2.5"
                    >
                      {people.map((person) => (
                        <NetworkPersonRow key={person.personId} person={person} />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            {network.hasMore ? (
              <div className="mt-2 flex min-h-[52px] items-center justify-center">
                <button
                  type="button"
                  onClick={network.loadMore}
                  disabled={network.isLoadingMore}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                >
                  {network.isLoadingMore
                    ? t("bc.mobile.network.loadingMore")
                    : t("bc.mobile.network.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        )}
        </>
        )}
      </main>

      <PostMomentModal
        open={storyModalOpen}
        onOpenChange={setStoryModalOpen}
        initialFeeling="share_opportunity"
      />
    </>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

/** Bảng hiển thị toàn bộ gợi ý AI khi người dùng chọn tab "Gợi ý (AI)". */
function NetworkAllAiSuggestionsPanel({
  peopleById,
  initialQuery = "",
}: {
  peopleById: Map<string, BcMobileNetworkPerson>;
  initialQuery?: string;
}) {
  const t = useT();
  const { lang } = useLang();
  const { recommendations, initialLoading, error: coreError, retry } = useTodayRelationshipRecommendations(lang as any);
  const [filterMode, setFilterMode] = useState<"all" | "near" | "potential" | "frequent" | "nurture">("all");
  const [aiViewMode, setAiViewMode] = useState<"dynamic" | "routine">("dynamic");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const [openId, setOpenId] = useState<string | null>(null);
  const viewerUserId = useViewerUserId();
  const [viewerCity, setViewerCity] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerUserId) return;
    let active = true;
    fetchNestApi<any>("/connect-app/me/identity")
      .then((payload) => {
        if (active) setViewerCity(payload?.identity?.city ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [viewerUserId]);

  const filtered = useMemo(() => {
    let list = recommendations;
    const vCity = (viewerCity || "").toLowerCase().replace(/^(thành phố|tp\.|tỉnh)\s*/i, "").trim();

    if (filterMode === "near") {
      list = list.filter((r) => {
        const area = (r.person.areaLabel || "").toLowerCase();
        const sugg = (r.aiSuggestion || "").toLowerCase();
        return (vCity && area.includes(vCity)) || sugg.includes("gần") || sugg.includes("khu vực");
      });
    } else if (filterMode === "potential") {
      const keywords = ["chủ tịch", "ceo", "founder", "sáng lập", "giám đốc", "director", "c-level", "leader", "tiềm năng"];
      list = list.filter((r) => {
        const text = `${r.person.headline ?? ""} ${r.person.companyName ?? ""} ${r.aiSuggestion ?? ""}`.toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      });
    } else if (filterMode === "frequent") {
      list = list.filter((r) => {
        const sugg = (r.aiSuggestion || "").toLowerCase();
        return sugg.includes("tương tác") || sugg.includes("thân thiết");
      });
    } else if (filterMode === "nurture") {
      list = list.filter((r) => r.reason.days > 0);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((r) => {
        const name = (r.person.displayName ?? "").toLowerCase();
        const comp = (r.person.companyName ?? "").toLowerCase();
        const head = (r.person.headline ?? "").toLowerCase();
        const sugg = (r.aiSuggestion ?? "").toLowerCase();
        return name.includes(q) || comp.includes(q) || head.includes(q) || sugg.includes(q);
      });
    }
    return list;
  }, [recommendations, filterMode, query, viewerCity]);

  const activeRec = recommendations.find((r) => r.id === openId) ?? null;
  const targetFor = (personId: string) => {
    const person = peopleById.get(personId);
    return {
      cardSlug: person?.cardSlug ?? null,
      alreadyConnected: person?.relationshipKind === "connection",
    };
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      {/* Segmented View Mode Picker */}
      <div className="flex items-center p-1 rounded-2xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] shadow-sm">
        <button
          type="button"
          onClick={() => setAiViewMode("dynamic")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            aiViewMode === "dynamic"
              ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[#D8B282]/50 shadow-sm font-bold"
              : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>AI Matcher Năng Lực (Dynamic %)</span>
        </button>
        <button
          type="button"
          onClick={() => setAiViewMode("routine")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            aiViewMode === "routine"
              ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[#D8B282]/50 shadow-sm font-bold"
              : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-black" />
          <span>Gợi Ý Hàng Ngày (Routine)</span>
        </button>
      </div>

      {aiViewMode === "dynamic" ? (
        <DynamicAiMatcherPanel initialQuery={query} />
      ) : initialLoading ? (
        <div className="mt-2 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4" />
          ))}
        </div>
      ) : coreError ? (
        <div className="mt-4 text-center rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6">
          <p className="text-sm text-[var(--bc-mobile-muted)]">Không thể tải danh sách gợi ý quan hệ.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-3 inline-flex h-8 items-center rounded-full px-4 text-xs font-semibold text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)]"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* Header giới thiệu */}
          <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--bc-mobile-accent)]">
              <Sparkles className="h-4.5 w-4.5 text-[var(--bc-mobile-accent)]" />
              <h2 className="text-sm font-bold text-[var(--bc-mobile-text)]">
                Gợi ý duy trì tương tác hàng ngày
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--bc-mobile-muted)] leading-relaxed">
              Hệ thống AI tự động ưu tiên gợi ý người ở gần, lãnh đạo doanh nghiệp tiềm năng và các đối tác tương tác cao để tối ưu hiệu quả kết nối.
            </p>
          </div>

      {/* Ô tìm kiếm gợi ý */}
      <div className="flex items-center gap-2">
        <MobileSearchBar
          id="bc-ai-search"
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo tên, công ty, ghi chú gợi ý..."
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          style={filterMode === "all" ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            filterMode === "all"
              ? "text-[#050c15] font-bold border-transparent"
              : "bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Tất cả ({recommendations.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("near")}
          style={filterMode === "near" ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            filterMode === "near"
              ? "text-[#050c15] font-bold border-transparent"
              : "bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          📍 Ở gần bạn
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("potential")}
          style={filterMode === "potential" ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            filterMode === "potential"
              ? "text-[#050c15] font-bold border-transparent"
              : "bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          ⭐ Tiềm năng cao
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("frequent")}
          style={filterMode === "frequent" ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            filterMode === "frequent"
              ? "text-[#050c15] font-bold border-transparent"
              : "bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          🔥 Nhiều tương tác
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("nurture")}
          style={filterMode === "nurture" ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            filterMode === "nurture"
              ? "text-[#050c15] font-bold border-transparent"
              : "bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          ⏳ Cần chăm sóc
        </button>
      </div>

      {/* Danh sách gợi ý */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--bc-mobile-muted)] opacity-50" />
          <p className="mt-3 text-sm font-semibold text-[var(--bc-mobile-text)]">
            Không tìm thấy gợi ý phù hợp
          </p>
          <p className="mt-1 text-xs text-[var(--bc-mobile-muted)]">
            Thử tìm kiếm với từ khóa khác hoặc chuyển chế độ xem
          </p>
          {(query || filterMode !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilterMode("all");
              }}
              className="mt-4 inline-flex h-8 items-center rounded-full px-4 text-xs font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)]"
            >
              Xem lại tất cả
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((rec) => {
            const name = rec.person.displayName ?? t("bc.mobile.network.unknownPerson");
            const roleLine = [rec.person.headline, rec.person.companyName].filter(Boolean).join(" · ");
            const daysText = rec.reason.days > 0 ? `${rec.reason.days} ngày chưa liên hệ` : "Gợi ý kết nối";
            const target = targetFor(rec.person.personId);
            const isNearBadge = (rec.aiSuggestion || "").includes("Gần bạn") || (rec.aiSuggestion || "").includes("khu vực");
            const isPotentialBadge = (rec.aiSuggestion || "").includes("Tiềm năng") || (rec.aiSuggestion || "").includes("lãnh đạo");
            const isFrequentBadge = (rec.aiSuggestion || "").includes("tương tác") || (rec.aiSuggestion || "").includes("thân thiết");

            return (
              <article
                key={rec.id}
                className="flex flex-col rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4 transition-all hover:border-[var(--bc-mobile-border-active)] active:border-[var(--bc-mobile-border-active)] shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={avatarOrDemo(rec.person.avatarUrl, rec.person.personId)}
                    alt={name}
                    loading="lazy"
                    className="h-12 w-12 rounded-full object-cover border border-[var(--bc-mobile-border)] shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-[var(--bc-mobile-text)]">
                        {name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {isNearBadge && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Gần bạn
                          </span>
                        )}
                        {isPotentialBadge && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Tiềm năng
                          </span>
                        )}
                        <span className="rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--bc-mobile-accent)]">
                          {daysText}
                        </span>
                      </div>
                    </div>
                    {roleLine && (
                      <p className="mt-0.5 truncate text-xs text-[var(--bc-mobile-muted)]">
                        {roleLine}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--bc-mobile-muted)]">
                      {rec.person.areaLabel && (
                        <span>📍 {rec.person.areaLabel}</span>
                      )}
                      {rec.person.industryLabel && (
                        <span>• {rec.person.industryLabel}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Khối gợi ý nội dung AI */}
                <div className="mt-3 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 text-xs leading-relaxed text-[var(--bc-mobile-text)]">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--bc-mobile-accent)] mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Lý do AI đề xuất:</span>
                  </div>
                  <p className="text-[var(--bc-mobile-muted)]">
                    {rec.aiSuggestion || `Đã ${rec.reason.days > 0 ? rec.reason.days : "nhiều"} ngày từ lần tương tác gần nhất. Duy trì liên hệ định kỳ giúp củng cố mối quan hệ và tạo cơ hội hợp tác mới.`}
                  </p>
                </div>

                {/* Hàng hành động */}
                <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-[var(--bc-mobile-border)]">
                  <button
                    type="button"
                    onClick={() => setOpenId(rec.id)}
                    className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-semibold text-[var(--bc-mobile-text)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-colors cursor-pointer"
                  >
                    Xem phân tích
                  </button>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/connect-app/network/$personId"
                      params={{ personId: rec.person.personId }}
                      className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-semibold text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-colors"
                    >
                      Hồ sơ
                    </Link>
                    <AiMatchConnectAction personName={name} target={target} compact />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AiMatchDetailSheet
        open={activeRec !== null}
        onOpenChange={(next: boolean) => setOpenId(next ? openId : null)}
        rec={activeRec}
        target={activeRec ? targetFor(activeRec.person.personId) : { cardSlug: null, alreadyConnected: false }}
      />
        </>
      )}
    </section>
  );
}



/** Dải ngang gợi ý quan hệ 6A ("AI Match"). */
function NetworkAiMatchStrip({
  peopleById,
  allowedIds,
  onViewAll,
}: {
  peopleById: Map<string, BcMobileNetworkPerson>;
  allowedIds: Set<string> | null;
  onViewAll?: () => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const all = useTodayRelationshipRecommendations(lang).recommendations;
  const recommendations = allowedIds
    ? all.filter((r) => allowedIds.has(r.person.personId))
    : all;

  const [openId, setOpenId] = useState<string | null>(null);
  const active = recommendations.find((r) => r.id === openId) ?? null;

  const targetFor = (personId: string) => {
    const person = peopleById.get(personId);
    return {
      cardSlug: person?.cardSlug ?? null,
      alreadyConnected: person?.relationshipKind === "connection",
    };
  };
  if (recommendations.length === 0) return null;

  return (
    <section aria-label={t("bc.mobile.network.aimatch.title")} className="mt-5">
      <div className="flex items-center justify-between w-full gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--bc-mobile-accent,#B8860B)]">
          <Sparkles
            aria-hidden="true"
            className="h-[13px] w-[13px] shrink-0 text-[var(--bc-mobile-accent)] fill-current"
          />
          <span className="truncate leading-5 text-[var(--bc-mobile-text,#0F172A)]">{t("bc.mobile.network.aimatch.title")}</span>
        </h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-7 px-2.5 rounded-full items-center gap-1 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-all cursor-pointer shrink-0"
          >
            {t("bc.mobile.network.recent.viewAll")}
            <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--bc-mobile-accent)]" />
          </button>
        ) : null}
      </div>

      <ul className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recommendations.map((rec) => {
          const name = rec.person.displayName ?? t("bc.mobile.network.unknownPerson");
          const roleLine = [rec.person.headline, rec.person.companyName]
            .filter(Boolean)
            .join(" · ");
          const daysText = (rec.reason?.days ?? 0) > 0 
            ? `${rec.reason.days} ngày từ lần gặp...`
            : "Gặp gần đây...";

          return (
            <li key={rec.id} className="w-[169px] h-[93px] shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setOpenId(rec.id)}
                className="relative flex flex-col items-start justify-between w-[169px] h-[93px] bg-[var(--bc-mobile-surface,#FFFFFF)] dark:bg-[var(--bc-mobile-surface,#070b14)] backdrop-blur-md rounded-xl p-3 border border-solid border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] text-left transition-colors box-border shadow-xs"
              >
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={avatarOrDemo(rec.person.avatarUrl, rec.person.personId)}
                    alt={name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover border border-solid border-[var(--bc-mobile-border)] shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1 gap-0">
                    <span className="font-semibold text-sm text-[var(--bc-mobile-text,#0F172A)] leading-5 truncate">
                      {name}
                    </span>
                    <span className="font-normal text-[10px] text-[var(--bc-mobile-muted,#64748B)] leading-[15px] truncate">
                      {roleLine}
                    </span>
                  </div>
                </div>
                <div className="pt-1 w-full">
                  <span className="font-medium text-[10px] text-[var(--bc-mobile-accent)] leading-[15px] block truncate">
                    {daysText}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <AiMatchDetailSheet
        open={active !== null}
        onOpenChange={(next: boolean) => setOpenId(next ? openId : null)}
        rec={active}
        target={active ? targetFor(active.person.personId) : { cardSlug: null, alreadyConnected: false }}
      />
    </section>
  );
}


/** "Cần giữ kết nối" — danh sách quan hệ đã lâu chưa liên hệ (6A). */
function NetworkNurtureList({
  allowedIds,
  onViewAll,
}: {
  allowedIds: Set<string> | null;
  onViewAll?: () => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const all = useTodayRelationshipRecommendations(lang).recommendations;
  const recommendations = allowedIds
    ? all.filter((r) => allowedIds.has(r.person.personId))
    : all;

  // Lọc trùng theo personId để đảm bảo danh sách hiển thị đa dạng, chất lượng hơn
  const uniqueItems: typeof recommendations = [];
  const seenIds = new Set<string>();
  for (const rec of recommendations) {
    const days = rec.reason?.days ?? 0;
    if (days > 0 && rec.person?.personId && !seenIds.has(rec.person.personId)) {
      seenIds.add(rec.person.personId);
      uniqueItems.push(rec);
    }
  }
  const items = uniqueItems.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section aria-label={t("bc.mobile.network.nurture.title")} className="mt-5">
      <div className="flex items-center justify-between w-full gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--bc-mobile-text,#0F172A)]">
          <Bell aria-hidden="true" className="h-[12px] w-[10px] shrink-0 text-[var(--bc-mobile-accent)]" />
          <span className="truncate leading-5">
            {t("bc.mobile.network.nurture.title")} ({recommendations.length})
          </span>
        </h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-7 px-2.5 rounded-full items-center gap-1 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-all cursor-pointer shrink-0"
          >
            {t("bc.mobile.network.recent.viewAll")}
            <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--bc-mobile-accent)]" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col w-full bg-[var(--bc-mobile-surface)] backdrop-blur-md rounded-xl border border-solid border-[var(--bc-mobile-border)] overflow-hidden box-border shadow-xs">
        {items.map((rec, index) => {
          const name = rec.person?.displayName ?? t("bc.mobile.network.unknownPerson");
          const roleLine = [rec.person?.headline, rec.person?.companyName]
            .filter(Boolean)
            .join(" · ");
          const days = rec.reason?.days ?? 0;
          const daysText = days > 0 
            ? `${days} ngày chưa liên hệ`
            : "Chưa liên hệ...";

          return (
            <Link
              key={rec.id}
              to="/connect-app/network/$personId"
              params={{ personId: rec.person.personId }}
              aria-label={`${t("bc.mobile.network.nurture.title")}: ${name}`}
              className={`flex items-center justify-between gap-3 p-3 hover:bg-[var(--bc-mobile-surface-2)] transition-colors ${
                index !== items.length - 1 ? "border-b border-solid border-[var(--bc-mobile-border)]" : ""
              }`}
            >
              <img
                src={avatarOrDemo(rec.person.avatarUrl, rec.person.personId)}
                alt={name}
                loading="lazy"
                className="w-9 h-9 rounded-full object-cover border border-solid border-[var(--bc-mobile-border)] shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <span className="font-semibold text-sm text-[var(--bc-mobile-text,#0F172A)] truncate">
                  {name}
                </span>
                <span className="font-normal text-[11px] text-[var(--bc-mobile-muted,#64748B)] truncate">
                  {roleLine}
                </span>
                <span className="font-medium text-[10px] text-[var(--bc-mobile-accent)] mt-0.5 block truncate">
                  {daysText}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--bc-mobile-muted)] shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * "GẶP GẦN ĐÂY" — dải ngang ảnh tròn theo thứ tự thời gian gặp gần nhất.
 * Cùng nguồn dữ liệu chuẩn, không có nguồn song song, không suy đoán hiện diện.
 */
function NetworkRecentStrip({
  people,
  onViewAll,
}: {
  people: BcMobileNetworkPerson[];
  onViewAll?: () => void;
}) {
  const t = useT();
  return (
    <section aria-label={t("bc.mobile.network.recent.title")} className="mt-5">
      <div className="flex items-center justify-between w-full gap-2">
        <h2 className="text-[10px] font-medium tracking-[1px] uppercase text-[var(--bc-mobile-muted,#64748B)]">
          {t("bc.mobile.network.recent.title")}
        </h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-7 px-2.5 rounded-full items-center gap-1 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-all cursor-pointer shrink-0"
          >
            {t("bc.mobile.network.recent.viewAll")}
            <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--bc-mobile-accent)]" />
          </button>
        ) : null}
      </div>
      <ul className="mt-3 flex snap-x gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((person, index) => {
          const name = person.displayName ?? t("bc.mobile.network.unknownPerson");
          const isFirst = index === 0;

          return (
            <li key={person.personId} className="min-w-[86px] max-w-[100px] shrink-0 snap-start flex flex-col items-center">
              <Link
                to="/connect-app/network/$personId"
                params={{ personId: person.personId }}
                aria-label={`${t("bc.mobile.network.recent.title")}: ${name}`}
                className="w-full flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] rounded-xl"
              >
                <div
                  className={`w-12 h-12 rounded-full p-[2px] flex items-center justify-center box-border ${
                    isFirst
                      ? "border border-solid border-[var(--bc-mobile-accent)]"
                      : "border border-solid border-[var(--bc-mobile-border)]"
                  }`}
                >
                  <img
                    src={avatarOrDemo(person.avatarUrl, person.personId)}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = demoAvatar(person.personId);
                    }}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="font-medium text-xs text-[var(--bc-mobile-text,#0F172A)] mt-2 block truncate max-w-full text-center">
                  {name}
                </span>
                <span className="font-light text-[10px] text-[var(--bc-mobile-muted,#64748B)] block truncate max-w-full text-center">
                  {person.headline ?? person.companyName ?? ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Notifications entry — badge appears only from a real unread count. */
function NetworkNotificationsButton() {
  const t = useT();
  const { data } = useBusinessConnectHome();
  const unread = data?.unreadNotificationCount ?? null;
  const hasUnread = typeof unread === "number" && unread > 0;
  return (
    <Link
      to="/connect-app/notifications"
      aria-label={
        hasUnread
          ? t("bc.mobile.network.notif.unreadLabel", { count: String(unread) })
          : t("bc.mobile.network.notif.label")
      }
      className="relative grid place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors hover:bg-black/5 dark:hover:bg-[#ffffff14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
    >
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      {hasUnread ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full border border-solid border-[var(--bc-mobile-surface)] bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] font-['Inter-Bold',Helvetica] text-[9.5px] font-bold leading-none text-[#2c1600]">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

/** Quiet skeleton mirroring the final row layout; shell + search stay put. */
function NetworkSkeleton() {
  const t = useT();
  const bar = "animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none";
  return (
    <div
      role="status"
      aria-label={t("bc.mobile.network.loading")}
      aria-busy="true"
      className="mt-6"
    >
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex min-h-[84px] items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3.5 py-3.5"
          >
            <div className={`h-12 w-12 shrink-0 rounded-full ${bar}`} />
            <div className="flex-1">
              <div className={`h-4 w-3/5 ${bar}`} />
              <div className={`mt-1.5 h-3 w-2/5 ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="mt-16 flex flex-col items-center px-2 text-center">
      <p className="text-[15px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.network.error")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        {t("bc.mobile.network.retry")}
      </button>
    </div>
  );
}

function NetworkEmpty({ onOpenV }: { onOpenV: () => void }) {
  const t = useT();
  return (
    <div className="mt-16 flex flex-col items-center px-2 pb-4 text-center">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
      >
        <Users className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-[16px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.network.empty.title")}
      </p>
      <p className="mx-auto mt-2 max-w-[30ch] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.network.empty.body")}
      </p>
      <button
        type="button"
        onClick={onOpenV}
        className="mt-6 inline-flex min-h-[44px] items-center gap-2.5 rounded-lg px-2 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-accent)] text-[11px] font-semibold leading-none text-[var(--bc-mobile-accent)]"
        >
          V
        </span>
        {t("bc.mobile.network.empty.cta")}
      </button>
    </div>
  );
}

function NetworkSearchEmpty({ onClear }: { onClear: () => void }) {
  const t = useT();
  return (
    <div className="mt-16 flex flex-col items-center px-2 pb-4 text-center">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
      >
        <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-[15px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.network.searchEmpty")}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 inline-flex min-h-[44px] items-center rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        {t("bc.mobile.network.search.clear")}
      </button>
    </div>
  );
}

/** Bộ lọc không còn ai khớp — một trạng thái trung tính + lối thoát. */
function NetworkFilterEmpty({ onReset }: { onReset: () => void }) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 py-10 text-center">
      <p className="text-[14.5px] text-[var(--bc-mobile-text)]">
        {t("bc.mobile.network.filterEmpty")}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        {t("bc.mobile.network.filterReset")}
      </button>
    </div>
  );
}

/** Lời mời kết bạn đang chờ phản hồi trên màn hình Network */
function NetworkIncomingRequestsSection({ full = false }: { full?: boolean } = {}) {
  const t = useT();
  const { requests, accept, decline, busy } = useIncomingConnectionRequests();

  if (requests.length === 0) {
    if (full) {
      return (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--bc-mobile-muted)]">Bạn không có lời mời kết nối nào đang chờ phản hồi.</p>
        </div>
      );
    }
    return null;
  }

  const displayed = full ? requests : requests.slice(0, 3);

  return (
    <section aria-label="Lời mời kết bạn" className="mt-4">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[var(--bc-mobile-accent,#E2B755)] animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--bc-mobile-text,#0F172A)]">
            {full ? "Tất cả lời mời kết nối" : "Lời mời kết bạn"} ({requests.length})
          </h2>
        </div>
        {!full && (
          <Link
            to="/connect-app/network"
            search={{ tab: "requests" }}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--bc-mobile-accent,#B8860B)] hover:underline"
          >
            Xem tất cả ({requests.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="divide-y divide-[var(--bc-mobile-border)] rounded-2xl border border-[var(--bc-mobile-border-gold,#D8B282)]/60 bg-[var(--bc-mobile-surface)] p-3 shadow-md">
        {displayed.map((req) => {
          const name = req.counterpart?.displayName ?? "Hội viên ViOne";
          const subtitle = [req.counterpart?.headline, req.counterpart?.companyName].filter(Boolean).join(" · ");
          const userId = req.counterpart?.userId;
          const avatarUrl = resolveMediaUrl(req.counterpart?.avatarUrl);

          return (
            <div key={req.connectionId} className="py-2.5 first:pt-1 last:pb-1">
              <div className="flex items-center gap-3">
                {userId ? (
                  <Link
                    to="/connect-app/network/$personId"
                    params={{ personId: `u:${userId}` }}
                    className="shrink-0"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        className="h-11 w-11 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
                      />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[14px] font-bold text-[var(--bc-mobile-accent)]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[14px] font-bold text-[var(--bc-mobile-accent)]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {userId ? (
                    <Link
                      to="/connect-app/network/$personId"
                      params={{ personId: `u:${userId}` }}
                      className="truncate text-[14px] font-bold text-[var(--bc-mobile-text)] hover:text-[var(--bc-mobile-accent)] block"
                    >
                      {name}
                    </Link>
                  ) : (
                    <p className="truncate text-[14px] font-bold text-[var(--bc-mobile-text)]">{name}</p>
                  )}
                  {subtitle && (
                    <p className="truncate text-[12px] text-[var(--bc-mobile-muted)] mt-0.5">{subtitle}</p>
                  )}
                  <p className="text-[11px] text-[var(--bc-mobile-accent)] font-medium mt-0.5">
                    Đã gửi lời mời kết bạn
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 pl-14">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    accept.mutate(req.connectionId, {
                      onSuccess: () => toast.success(`Đã kết nối thành công với ${name}!`),
                      onError: () => toast.error("Không thể hoàn tất kết nối. Vui lòng thử lại."),
                    })
                  }
                  className="flex-1 py-1.5 px-3 rounded-full font-bold text-[12.5px] bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 shadow hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  ✓ Đồng ý
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    decline.mutate(req.connectionId, {
                      onSuccess: () => toast.info("Đã từ chối lời mời kết bạn."),
                      onError: () => toast.error("Có lỗi xảy ra."),
                    })
                  }
                  className="py-1.5 px-3 rounded-full font-semibold text-[12px] border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] hover:bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] active:scale-95 transition-all cursor-pointer"
                >
                  Từ chối
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
