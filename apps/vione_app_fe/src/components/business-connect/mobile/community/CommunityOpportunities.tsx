// BC-Mobile-7B — Community Opportunities list
// ("CỘNG ĐỒNG NÀY ĐANG CÓ CƠ HỘI KINH DOANH NÀO?").
// Read-first list scoped to the community, quiet debounced search,
// no contact leakage in rows, no matching/AI, no creation affordance.

import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hasTKey, useT } from "@/lib/i18n";
import { useCommunityOpportunities } from "@/hooks/use-community-activity";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import type { CommunityOpportunitySummaryDTO } from "@/lib/business-connect/mobile/community-activity.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";
import { ActivityListSkeleton } from "./CommunityEvents";
import { MobileSearchBar } from "../MobileSearchBar";

export function daysLeftLabel(
  daysLeft: number | null | undefined,
  t: (
    key:
      | "bc.mobile.community.opportunities.daysLeft"
      | "bc.mobile.community.opportunities.expiresToday",
    vars?: { count: number },
  ) => string,
): string | null {
  if (daysLeft === null || daysLeft === undefined || isNaN(daysLeft)) return null;
  if (daysLeft <= 0) return t("bc.mobile.community.opportunities.expiresToday");
  return t("bc.mobile.community.opportunities.daysLeft", { count: daysLeft });
}

type OpportunityInterestFilter = "all" | "interested" | "notInterested";

export function CommunityOpportunities({ communityId }: { communityId: string }) {
  const t = useT();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<OpportunityInterestFilter>("all");
  const opportunities = useCommunityOpportunities(communityId, debounced);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_OPPORTUNITIES_OPENED");
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(id);
  }, [term]);

  const searching = debounced.trim().length > 0;
  // Lọc trên dữ liệu đã tải: không tạo backend song song, không gọi thêm truy vấn.
  const visible = opportunities.opportunities.filter((o) =>
    filter === "all" ? true : filter === "interested" ? o.interested : !o.interested,
  );
  const filtered = filter !== "all";

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.opportunities.title")} />
      <main id="bc-mobile-community-opportunities" className="contents">
        <h1 className="mt-4 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.opportunities.title")}
        </h1>

        <div role="search" className="mt-3.5">
          <MobileSearchBar
            id="bc-community-opportunity-search"
            value={term}
            onChange={setTerm}
            placeholder={t("bc.mobile.community.opportunities.search.placeholder")}
          />
        </div>

        <div
          role="tablist"
          aria-label={t("bc.mobile.community.opportunities.filter.label")}
          className="mt-3 flex items-center gap-2"
        >
          {(["all", "interested", "notInterested"] as const).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={`inline-flex min-h-[36px] items-center rounded-full border px-3.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none cursor-pointer ${
                  active
                    ? "border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-accent-grad)] text-black shadow-sm font-bold"
                    : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:border-[var(--bc-mobile-accent)] hover:text-[var(--bc-mobile-text)]"
                }`}
              >
                {t(`bc.mobile.community.opportunities.filter.${key}`)}
              </button>
            );
          })}
        </div>

        {opportunities.initialLoading ? (
          <ActivityListSkeleton />
        ) : opportunities.coreError ? (
          <CommunityError onRetry={opportunities.retry} />
        ) : opportunities.unavailable ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.unavailable")}
            </p>
          </section>
        ) : visible.length === 0 ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {filtered && opportunities.opportunities.length > 0
                ? filter === "interested"
                  ? t("bc.mobile.community.opportunities.filter.emptyInterested")
                  : t("bc.mobile.community.opportunities.filter.emptyNotInterested")
                : searching
                  ? t("bc.mobile.community.opportunities.search.empty")
                  : t("bc.mobile.community.opportunities.empty")}
            </p>
            {searching ? (
              <button
                type="button"
                onClick={() => setTerm("")}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                {t("bc.mobile.community.search.clear")}
              </button>
            ) : null}
          </section>
        ) : (
          <>
            <ul
              aria-label={t("bc.mobile.community.opportunities.listLabel")}
              aria-busy={opportunities.isLoadingMore}
              className="mt-2 divide-y divide-[var(--bc-mobile-border)]"
            >
              {visible.map((o) => (
                <OpportunityRow key={o.opportunityRef} communityId={communityId} opportunity={o} />
              ))}
            </ul>
            {opportunities.hasMore ? (
              <div className="mt-2 flex min-h-[52px] items-center justify-center">
                <button
                  type="button"
                  onClick={opportunities.loadMore}
                  disabled={opportunities.isLoadingMore}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                >
                  {opportunities.isLoadingMore
                    ? t("bc.mobile.community.loadingMore")
                    : t("bc.mobile.community.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}

/** Localized category label from a canonical taxonomy key; null when unknown. */
export function opportunityCategoryLabel(
  categoryKey: string | null,
  t: ReturnType<typeof useT>,
): string | null {
  if (!categoryKey || !hasTKey(categoryKey)) return null;
  return t(categoryKey);
}

function OpportunityRow({
  communityId,
  opportunity,
}: {
  communityId: string;
  opportunity: CommunityOpportunitySummaryDTO;
}) {
  const t = useT();
  const meta = [opportunityCategoryLabel(opportunity.categoryKey, t), opportunity.organizationLabel]
    .filter(Boolean)
    .join(" · ");
  const expDate = opportunity.expiresAt || (opportunity as any).endsAt;
  const calculatedDaysLeft =
    typeof opportunity.daysLeft === "number" && !isNaN(opportunity.daysLeft)
      ? opportunity.daysLeft
      : expDate
        ? Math.max(0, Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
  const deadline = daysLeftLabel(calculatedDaysLeft, t);

  return (
    <li>
      <Link
        to="/connect-app/community/$communityId/opportunities/$opportunityRef"
        params={{ communityId, opportunityRef: opportunity.opportunityRef }}
        aria-label={`${t("bc.mobile.community.opportunities.openOpportunity")}: ${opportunity.title}`}
        className="flex min-h-[68px] items-center gap-3 py-3.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[var(--bc-mobile-text)]">
            {opportunity.title}
          </p>
          {meta ? (
            <p className="mt-0.5 truncate text-[13px] text-[var(--bc-mobile-muted)]">{meta}</p>
          ) : null}
          {opportunity.shortDescription ? (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--bc-mobile-muted)]">
              {opportunity.shortDescription}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center gap-2">
            {opportunity.interested ? (
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  opportunity.interestLevel === "low"
                    ? "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
                    : "border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)]"
                }`}
              >
                {opportunity.interestLevel === "low"
                  ? t("bc.mobile.community.opportunities.level.low")
                  : t("bc.mobile.community.opportunities.level.high")}
              </span>
            ) : null}
            {deadline ? (
              <span className="text-[11px] text-[var(--bc-mobile-muted)]">{deadline}</span>
            ) : null}
          </div>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </Link>
    </li>
  );
}
