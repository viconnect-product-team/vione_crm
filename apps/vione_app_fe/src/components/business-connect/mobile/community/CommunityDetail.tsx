// BC-Mobile-7A — Community Detail ("CỘNG ĐỒNG NÀY LÀ GÌ?").
// BC-Mobile-7B: previews now point at the native community events /
// opportunities surfaces (max 2 rows each), backed by canonical data only.
// No CRUD, no settings, no fake social metrics, no feed.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Newspaper,
  RefreshCw,
  Users,
  UserPlus,
  CheckCircle,
  PlusCircle,
  Sparkles,
  DollarSign,
  Calendar,
  Tag,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useFmt, useT } from "@/lib/i18n";
import { useCommunityDetail, useCommunityMembers } from "@/hooks/use-community";
import { useCommunityActivityPreview } from "@/hooks/use-community-activity";
import { useCommunityNews } from "@/hooks/use-community-news";
import { useJoinableCommunities } from "@/hooks/use-community-join";
import { toast } from "sonner";
import { eventDateParts } from "@/lib/business-connect/mobile/community-activity.service";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityInviteButton } from "./CommunityInviteSheet";
import { CreateOpportunityModal } from "./CreateOpportunityModal";
import { CreateNewsModal } from "./CreateNewsModal";
import {
  CommunityAvatar,
  CommunityError,
  CommunityListSkeleton,
  getCommunityVisuals,
} from "./CommunityHome";
import { monthLabel } from "./CommunityEvents";
import { daysLeftLabel, opportunityCategoryLabel } from "./CommunityOpportunities";

type CommunityTab = "all" | "opportunities" | "news" | "events" | "members";

export function CommunityDetail({ communityId }: { communityId: string }) {
  const t = useT();
  const fmt = useFmt();
  const {
    detail,
    unavailable,
    initialLoading,
    error: coreError,
    retry,
  } = useCommunityDetail(communityId);
  const activity = useCommunityActivityPreview(communityId);
  const news = useCommunityNews(communityId);
  const { requestJoin } = useJoinableCommunities();

  const [activeTab, setActiveTab] = useState<CommunityTab>("all");
  const [createOppModalOpen, setCreateOppModalOpen] = useState(false);
  const [createNewsModalOpen, setCreateNewsModalOpen] = useState(false);

  const isMember = detail?.community?.isMember ?? true;

  const handleJoin = () => {
    requestJoin.mutate(
      { communityId },
      {
        onSuccess: () => {
          toast.success("Đã tham gia cộng đồng thành công!");
          retry();
        },
        onError: () => {
          toast.error("Không thể tham gia cộng đồng. Vui lòng thử lại.");
        },
      },
    );
  };

  const visuals = detail?.community
    ? getCommunityVisuals(
        detail.community.name,
        detail.community.logoUrl,
        detail.community.bannerUrl,
      )
    : null;

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.nav.community")} />
      <main id="bc-mobile-community-detail" className="contents">
        {initialLoading ? (
          <div className="mt-4">
            <CommunityListSkeleton />
          </div>
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : unavailable || !detail || !visuals ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.unavailable")}
            </p>
          </section>
        ) : (
          <>
            {/* Top Cover Banner (Ảnh bìa cộng đồng full-bleed) */}
            <div className="relative -mx-5 mt-0 mb-3 h-44 sm:h-52 w-[calc(100%+2.5rem)] overflow-hidden border-b border-[var(--bc-mobile-border)] bg-slate-950 shadow-xs">
              <img
                src={visuals.bannerUrl}
                alt={detail.community.name}
                className="h-full w-full object-cover brightness-[0.90] dark:brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bc-mobile-surface)] via-transparent to-black/30" />

              {/* Category Pill Tag on Banner */}
              <div className="absolute bottom-3 right-4 z-10">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md bg-black/65 shadow-md border border-amber-400/40 text-amber-300"
                >
                  <span>{visuals.category}</span>
                </span>
              </div>
            </div>

            {/* Header with Overlapping Floating Avatar */}
            <section className="relative z-10 -mt-12 ml-1 flex items-start gap-3.5">
              <CommunityAvatar
                name={detail.community.name}
                logoUrl={visuals.avatarUrl}
                className="h-20 w-20 ring-4 ring-[var(--bc-mobile-surface)] shadow-xl shrink-0"
              />
              <div className="min-w-0 flex-1 pt-6">
                <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
                  {detail.community.name}
                </h1>
                {detail.community.shortDescription ? (
                  <p className="mt-1 text-[13.5px] text-[var(--bc-mobile-muted)] leading-relaxed">
                    {detail.community.shortDescription}
                  </p>
                ) : null}
              </div>
            </section>

            {/* Quick Badges */}
            <section className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-1 text-[12px] font-medium text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.yourRole")}:{" "}
                {isMember
                  ? detail.community.viewerRole === "admin"
                    ? t("bc.mobile.community.role.admin")
                    : t("bc.mobile.community.role.member")
                  : "Chưa tham gia"}
              </span>
              {detail.community.memberCount !== null ? (
                <span className="rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-1 text-[12px] font-medium text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.memberCount", { count: detail.community.memberCount })}
                </span>
              ) : null}
            </section>

            {/* Hai Nút Đăng Cơ Hội & Đăng Bài Viết Nổi Bật Chuẩn Màu Nút ViOne */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCreateOppModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl font-bold text-[13px] bg-[var(--bc-mobile-accent-grad)] text-black shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>+ Đăng cơ hội</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateNewsModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl font-bold text-[13px] bg-[var(--bc-mobile-accent-grad)] text-black shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                <Newspaper className="w-4 h-4 text-black" />
                <span>+ Đăng bài viết</span>
              </button>
            </div>

            {!isMember ? (
              <section className="mt-4 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent p-4 flex items-center justify-between gap-3 shadow-md">
                <div>
                  <p className="text-[14px] font-bold text-[var(--bc-mobile-text)]">
                    Gia nhập cộng đồng
                  </p>
                  <p className="text-[12px] text-[var(--bc-mobile-muted)]">
                    Tham gia để kết nối hội viên và cập nhật tin tức, sự kiện mới nhất.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={requestJoin.isPending}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] px-5 text-[13.5px] font-bold text-[#050811] shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  {requestJoin.isPending ? "Đang tham gia..." : "Tham gia ngay"}
                </button>
              </section>
            ) : null}

            {detail.community.description ? (
              <section className="mt-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.about")}
                </h2>
                <p className="mt-1 max-w-[58ch] text-[13.5px] leading-relaxed text-[var(--bc-mobile-text)]">
                  {detail.community.description}
                </p>
              </section>
            ) : null}

            {/* Quick Stat Tiles */}
            <section className="mt-4 grid grid-cols-3 gap-2">
              <StatTile
                value={detail.community.memberCount}
                label={t("bc.mobile.community.stat.members")}
              />
              <StatTile
                value={detail.upcomingEvents.length}
                label={t("bc.mobile.community.stat.events")}
              />
              <StatTile
                value={detail.openOpportunityCount}
                label={t("bc.mobile.community.stat.opportunities")}
              />
            </section>

            <section className="mt-4">
              <CommunityInviteButton
                communityId={communityId}
                communityName={detail.community.name}
              />
            </section>

            {/* Modern Streamlined Navigation Tabs: Tinh gọn UI theo yêu cầu */}
            <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1 border-b border-[var(--bc-mobile-border)]">
              {[
                { id: "all", label: "Tất cả" },
                {
                  id: "opportunities",
                  label: `Cơ hội (${detail.openOpportunityCount || activity.preview?.openOpportunities?.length || 0})`,
                },
                { id: "news", label: "Bài viết & Tin tức" },
                { id: "events", label: `Sự kiện (${detail.upcomingEvents.length || 0})` },
                { id: "members", label: "Hội viên" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap px-3.5 py-2 text-[12.5px] font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[#D8B282] text-[#D8B282] bg-[#D8B282]/10"
                      : "border-transparent text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents: Tinh gọn & Đầy đủ thông tin */}
            {activeTab === "all" ? (
              <>
                <StreamlinedOpportunitiesSection
                  communityId={communityId}
                  opportunities={activity.preview?.openOpportunities ?? []}
                  initialLoading={activity.initialLoading}
                  onOpenCreate={() => setCreateOppModalOpen(true)}
                />

                <StreamlinedNewsSection
                  communityId={communityId}
                  items={news.items}
                  initialLoading={news.initialLoading}
                  onOpenCreate={() => setCreateNewsModalOpen(true)}
                />

                <MembersPreview communityId={communityId} />
              </>
            ) : activeTab === "opportunities" ? (
              <StreamlinedOpportunitiesSection
                communityId={communityId}
                opportunities={activity.preview?.openOpportunities ?? []}
                initialLoading={activity.initialLoading}
                onOpenCreate={() => setCreateOppModalOpen(true)}
                showAll
              />
            ) : activeTab === "news" ? (
              <StreamlinedNewsSection
                communityId={communityId}
                items={news.items}
                initialLoading={news.initialLoading}
                onOpenCreate={() => setCreateNewsModalOpen(true)}
                showAll
              />
            ) : activeTab === "events" ? (
              <ActivityPreviews
                communityId={communityId}
                preview={activity.preview}
                initialLoading={activity.initialLoading}
                coreError={activity.coreError}
                retry={activity.retry}
              />
            ) : (
              <MembersPreview communityId={communityId} />
            )}

            {/* Modals for Create Opportunity & News */}
            <CreateOpportunityModal
              communityId={communityId}
              communityName={detail.community.name}
              isOpen={createOppModalOpen}
              onClose={() => setCreateOppModalOpen(false)}
              onSuccess={() => {
                activity.retry();
                retry();
              }}
            />

            <CreateNewsModal
              communityId={communityId}
              communityName={detail.community.name}
              isOpen={createNewsModalOpen}
              onClose={() => setCreateNewsModalOpen(false)}
              onSuccess={() => {
                news.retry();
                retry();
              }}
            />
          </>
        )}
      </main>
    </>
  );
}

/** Tinh gọn UI: Thẻ Cơ hội kinh doanh tinh gọn, đầy đủ thông tin trạng thái & nhận cơ hội */
function StreamlinedOpportunitiesSection({
  communityId,
  opportunities,
  initialLoading,
  onOpenCreate,
  showAll = false,
}: {
  communityId: string;
  opportunities: any[];
  initialLoading: boolean;
  onOpenCreate: () => void;
  showAll?: boolean;
}) {
  const t = useT();
  const list = showAll ? opportunities : opportunities.slice(0, 4);

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--bc-mobile-muted)] flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-[#D8B282]" />
          <span>Cơ hội kinh doanh B2B</span>
        </h2>
        <button
          type="button"
          onClick={onOpenCreate}
          className="text-xs font-bold text-[#D8B282] hover:underline cursor-pointer"
        >
          + Đăng cơ hội
        </button>
      </div>

      {initialLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[var(--bc-mobile-surface-2)] animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6 text-center">
          <p className="text-xs text-[var(--bc-mobile-muted)]">Chưa có cơ hội nào được đăng.</p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-2 text-xs font-bold text-[#D8B282] underline cursor-pointer"
          >
            Trở thành người đầu tiên đăng cơ hội
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {list.map((o: any) => {
            const deadline = daysLeftLabel(o.daysLeft, t);
            const isClaimed = Boolean(o.claimedBy || o.status === "claimed");

            return (
              <Link
                key={o.opportunityRef}
                to="/connect-app/community/$communityId/opportunities/$opportunityRef"
                params={{ communityId, opportunityRef: o.opportunityRef }}
                className="group p-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] hover:border-[#D8B282]/60 hover:bg-[var(--bc-mobile-surface-2)] transition-all shadow-xs block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#D8B282]/15 text-[#F6E1C3] border border-[#D8B282]/30">
                        {opportunityCategoryLabel(o.categoryKey, t) || "B2B DEAL"}
                      </span>
                      {o.budget ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30">
                          {o.budget}
                        </span>
                      ) : null}
                      {deadline ? (
                        <span className="text-[10.5px] font-medium text-[var(--bc-mobile-muted)]">
                          · {deadline}
                        </span>
                      ) : null}
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] font-bold text-[var(--bc-mobile-text)] group-hover:text-[#D8B282] transition-colors leading-snug line-clamp-2">
                      {o.title}
                    </h3>

                    {/* Organization / Poster */}
                    <div className="mt-1 text-[11.5px] text-[var(--bc-mobile-muted)] flex items-center gap-2">
                      <span>{o.organizationLabel || "Hội viên hiệp hội"}</span>
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-[#D8B282]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{o.claimedBy ? `Đã nhận bởi: ${o.claimedBy}` : "Đã nhận cơ hội"}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px] font-semibold">
                          ● Đang mở tiếp nhận
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--bc-mobile-muted)] group-hover:text-[#D8B282] group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!showAll && opportunities.length > 4 && (
        <Link
          to="/connect-app/community/$communityId/opportunities"
          params={{ communityId }}
          className="mt-2 inline-flex min-h-[38px] items-center text-xs font-bold text-[#D8B282] hover:underline"
        >
          Xem tất cả {opportunities.length} cơ hội →
        </Link>
      )}
    </section>
  );
}

/** Tinh gọn UI: Thẻ Tin tức & Bài viết cộng đồng */
function StreamlinedNewsSection({
  communityId,
  items,
  initialLoading,
  onOpenCreate,
  showAll = false,
}: {
  communityId: string;
  items: any[];
  initialLoading: boolean;
  onOpenCreate: () => void;
  showAll?: boolean;
}) {
  const list = showAll ? items : items.slice(0, 3);

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--bc-mobile-muted)] flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 text-amber-500" />
          <span>Bài viết & Bản tin cộng đồng</span>
        </h2>
        <button
          type="button"
          onClick={onOpenCreate}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
        >
          + Đăng bài viết
        </button>
      </div>

      {initialLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[var(--bc-mobile-surface-2)] animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6 text-center">
          <p className="text-xs text-[var(--bc-mobile-muted)]">Chưa có bài viết nào.</p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 underline cursor-pointer"
          >
            Đăng bài viết đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {list.map((item: any) => (
            <Link
              key={item.newsRef}
              to="/connect-app/community/$communityId/news/$newsRef"
              params={{ communityId, newsRef: item.newsRef }}
              className="group p-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] hover:border-amber-500/50 hover:bg-[var(--bc-mobile-surface-2)] transition-all shadow-xs flex items-center gap-3"
            >
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-500 uppercase">
                  <span>{item.category || "TIN TỨC"}</span>
                  {item.publishedLabel && (
                    <span className="text-[var(--bc-mobile-muted)] normal-case">
                      · {item.publishedLabel}
                    </span>
                  )}
                </div>
                <h3 className="text-[13.5px] font-bold text-[var(--bc-mobile-text)] group-hover:text-amber-400 transition-colors leading-snug line-clamp-1 mt-0.5">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-[11.5px] text-[var(--bc-mobile-muted)] line-clamp-1 mt-0.5">
                    {item.excerpt}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-[var(--bc-mobile-muted)] group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {!showAll && items.length > 3 && (
        <Link
          to="/connect-app/community/$communityId/news"
          params={{ communityId }}
          className="mt-2 inline-flex min-h-[38px] items-center text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả {items.length} bài viết →
        </Link>
      )}
    </section>
  );
}

// ── BC-Mobile-7B — bounded native previews (max 2 events + 2 opportunities).
// Sections degrade independently: a preview failure never blocks the
// identity/member sections above; each has its own quiet error + retry.

function ActivityPreviews({
  communityId,
  preview,
  initialLoading,
  coreError,
  retry,
}: {
  communityId: string;
  preview: ReturnType<typeof useCommunityActivityPreview>["preview"];
  initialLoading: boolean;
  coreError: boolean;
  retry: () => void;
}) {
  const t = useT();
  const fmt = useFmt();

  if (initialLoading) {
    return (
      <div aria-hidden="true" className="mt-7 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-9 animate-pulse rounded-xl bg-[var(--bc-mobile-surface-2)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (coreError) {
    return (
      <section className="mt-7" role="alert">
        <p className="text-[14px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.error.title")}
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-1 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-[13px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          {t("bc.mobile.community.retry")}
        </button>
      </section>
    );
  }

  const events = preview?.nextEvents ?? [];
  const opportunities = preview?.openOpportunities ?? [];

  return (
    <>
      <section className="mt-7">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.events.title")}
        </h2>
        {events.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.upcoming.empty")}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--bc-mobile-border)]">
            {events.map((e: any) => {
              const parts = eventDateParts(e.startAt);
              return (
                <li key={e.eventRef}>
                  <Link
                    to="/connect-app/community/$communityId/events/$eventRef"
                    params={{ communityId, eventRef: e.eventRef }}
                    aria-label={`${t("bc.mobile.community.events.openEvent")}: ${e.title}`}
                    className="flex min-h-[56px] items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-[52px] w-[52px] min-w-[52px] shrink-0 flex-col items-center justify-center rounded-full border border-[var(--bc-mobile-border)] bg-gradient-to-b from-[var(--bc-mobile-surface-2)] to-[rgba(216,178,130,0.08)] shadow-xs transition-transform"
                    >
                      <span className="text-[17px] font-extrabold leading-none text-[var(--bc-mobile-text)]">
                        {parts?.day ?? "--"}
                      </span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bc-mobile-muted)] whitespace-nowrap">
                        {parts ? monthLabel(fmt.locale, parts.month) : ""}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                        {e.title}
                      </span>
                      {e.locationLabel ? (
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--bc-mobile-muted)]">
                          {e.locationLabel}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                      strokeWidth={1.8}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/connect-app/community/$communityId/events"
          params={{ communityId }}
          className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-medium text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
        >
          {t("bc.mobile.community.events.viewAll")}
        </Link>
      </section>

      <section className="mt-7">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.opportunities.title")}
        </h2>
        {opportunities.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.empty")}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--bc-mobile-border)]">
            {opportunities.map((o: any) => {
              const meta = [opportunityCategoryLabel(o.categoryKey, t), o.organizationLabel]
                .filter(Boolean)
                .join(" · ");
              const deadline = daysLeftLabel(o.daysLeft, t);
              return (
                <li key={o.opportunityRef}>
                  <Link
                    to="/connect-app/community/$communityId/opportunities/$opportunityRef"
                    params={{ communityId, opportunityRef: o.opportunityRef }}
                    aria-label={`${t("bc.mobile.community.opportunities.openOpportunity")}: ${o.title}`}
                    className="flex min-h-[56px] items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                        {o.title}
                      </span>
                      {meta ? (
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--bc-mobile-muted)]">
                          {meta}
                          {deadline ? ` · ${deadline}` : ""}
                        </span>
                      ) : deadline ? (
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--bc-mobile-muted)]">
                          {deadline}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                      strokeWidth={1.8}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/connect-app/community/$communityId/opportunities"
          params={{ communityId }}
          className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-medium text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
        >
          {t("bc.mobile.community.opportunities.viewAll")}
        </Link>
      </section>
    </>
  );
}

// ── Quick stats + bounded member preview (max 4 rows, read-only).

function StatTile({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="rounded-2xl bc-translucent-card px-3 py-3 text-center">
      <div className="text-[18px] font-semibold leading-none text-[var(--bc-mobile-text)]">
        {value ?? "—"}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-[var(--bc-mobile-muted)]">{label}</div>
    </div>
  );
}

function MembersPreview({ communityId }: { communityId: string }) {
  const t = useT();
  const { members, initialLoading } = useCommunityMembers(communityId, "");
  const rows = members.slice(0, 4);

  return (
    <section className="mt-7">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.members")}
      </h2>
      {initialLoading ? (
        <div aria-hidden="true" className="mt-2 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
              <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-[14px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.members.empty")}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--bc-mobile-border)]">
          {rows.map((m) => {
            const meta = [m.jobTitle, m.companyName].filter(Boolean).join(" · ");
            return (
              <li key={m.memberRef}>
                <Link
                  to="/connect-app/community/$communityId/members/$memberRef"
                  params={{ communityId, memberRef: m.memberRef }}
                  aria-label={`${t("bc.mobile.community.openMember")}: ${m.displayName}`}
                  className="flex min-h-[56px] items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[13px] font-semibold text-[var(--bc-mobile-muted)]"
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      m.displayName.trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                      {m.displayName}
                      {m.isSelf ? ` · ${t("bc.mobile.community.thisIsYou")}` : ""}
                    </span>
                    {meta ? (
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--bc-mobile-muted)]">
                        {meta}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                    strokeWidth={1.8}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        to="/connect-app/community/$communityId/members"
        params={{ communityId }}
        className="mt-1 inline-flex min-h-[44px] items-center gap-2 text-[13px] font-medium text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
        {t("bc.mobile.community.members.viewAll")}
      </Link>
    </section>
  );
}

function NewsPreview({ communityId }: { communityId: string }) {
  const t = useT();
  const news = useCommunityNews(communityId);
  const rows = news.items.slice(0, 3);

  return (
    <section className="mt-7">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.news.title")}
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.news.subtitle")}
      </p>

      {news.initialLoading ? (
        <div aria-hidden="true" className="mt-3 space-y-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--bc-mobile-surface-2)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-[14px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.news.empty")}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--bc-mobile-border)]">
          {rows.map((item) => {
            const meta = [item.category, item.author, item.publishedLabel]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={item.newsRef}>
                <Link
                  to="/connect-app/community/$communityId/news/$newsRef"
                  params={{ communityId, newsRef: item.newsRef }}
                  aria-label={`${t("bc.mobile.community.news.open")}: ${item.title}`}
                  className="flex min-h-[56px] items-start gap-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]"
                  >
                    <Newspaper className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                      {item.title}
                    </span>
                    {item.excerpt ? (
                      <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-[var(--bc-mobile-muted)]">
                        {item.excerpt}
                      </span>
                    ) : null}
                    {meta ? (
                      <span className="mt-0.5 block truncate text-[11.5px] text-[var(--bc-mobile-muted)]">
                        {meta}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                    strokeWidth={1.8}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/connect-app/community/$communityId/news"
        params={{ communityId }}
        className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-medium text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        Xem tất cả bài viết
      </Link>
    </section>
  );
}
