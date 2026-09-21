// BC-Mobile-7B — Khu vực "Cơ hội kinh doanh" gắn ngay trong màn Cộng đồng.
// Banner tổng quan + danh sách cơ hội (lead/tài trợ) đang mở, nút Quan tâm tại chỗ.
// Dùng đúng preview + expressInterest canonical của 7B — không backend song song.

import { Link } from "@tanstack/react-router";
import { Briefcase, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import {
  useCommunityActivityPreview,
  useCommunityOpportunityInterest,
} from "@/hooks/use-community-activity";
import type { CommunityOpportunityPreviewDTO } from "@/lib/business-connect/mobile/community-activity.types";
import type { CommunitySummaryDTO } from "@/lib/business-connect/mobile/community.types";
import { daysLeftLabel, opportunityCategoryLabel } from "./CommunityOpportunities";

export function CommunityOpportunitiesSection({
  communities,
}: {
  communities: CommunitySummaryDTO[];
}) {
  const t = useT();
  const list = communities.slice(0, 4);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  if (list.length === 0 || total === 0) return null;

  return (
    <section aria-label={t("bc.mobile.community.opportunities.title")} className="mt-6">
      <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.opportunities.title")}
      </h2>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--bc-mobile-accent)]/35 bg-[var(--bc-mobile-accent)]/10 p-3.5">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-accent)]/40 text-[var(--bc-mobile-accent)]"
        >
          <Briefcase className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.community.opportunities.banner.title", { count: total })}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.banner.desc")}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {list.map((c: any) => (
          <CommunityOpportunityGroup
            key={c.communityId}
            community={c}
            onCount={(n) =>
              setCounts((prev) => (prev[c.communityId] === n ? prev : { ...prev, [c.communityId]: n }))
            }
          />
        ))}
      </div>
    </section>
  );
}

function CommunityOpportunityGroup({
  community,
  onCount,
}: {
  community: CommunitySummaryDTO;
  onCount: (count: number) => void;
}) {
  const { preview, initialLoading } = useCommunityActivityPreview(community.communityId);
  const items = preview?.openOpportunities ?? [];

  useEffect(() => {
    if (!initialLoading) onCount(items.length);
  }, [initialLoading, items.length, onCount]);

  if (initialLoading || items.length === 0) return null;

  return (
    <>
      {items.slice(0, 2).map((op: any) => (
        <OpportunityCard
          key={op.opportunityRef}
          communityId={community.communityId}
          communityName={community.name}
          opportunity={op}
        />
      ))}
    </>
  );
}

function OpportunityCard({
  communityId,
  communityName,
  opportunity,
}: {
  communityId: string;
  communityName: string;
  opportunity: CommunityOpportunityPreviewDTO;
}) {
  const t = useT();
  const interest = useCommunityOpportunityInterest(communityId, opportunity.opportunityRef);
  const interested = interest.isSuccess;
  const category = opportunityCategoryLabel(opportunity.categoryKey, t);
  const deadline = daysLeftLabel(opportunity.daysLeft, t);
  const meta = [category, opportunity.organizationLabel, communityName]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5">
      <Link
        to="/connect-app/community/$communityId/opportunities/$opportunityRef"
        params={{ communityId, opportunityRef: opportunity.opportunityRef }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <p className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--bc-mobile-text)]">
          {opportunity.title}
        </p>
      </Link>
      {meta ? (
        <p className="mt-1 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">{meta}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        {deadline ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-muted)]">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
            {deadline}
          </span>
        ) : (
          <span />
        )}

        {interested ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bc-mobile-accent)]/15 px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-accent)]">
            <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            {t("bc.mobile.community.opportunities.interested")}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => interest.mutate(undefined)}
            disabled={interest.isPending}
            className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--bc-mobile-accent)] px-4 text-[13px] font-semibold text-[var(--bc-mobile-navy)] transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
          >
            {interest.isPending
              ? t("bc.mobile.community.opportunities.sending")
              : t("bc.mobile.community.opportunities.interest")}
          </button>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {interest.isSuccess ? t("bc.mobile.community.opportunities.interestSuccess") : ""}
      </p>
      {interest.isError ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.opportunities.interestFailed")}
        </p>
      ) : null}
    </article>
  );
}
