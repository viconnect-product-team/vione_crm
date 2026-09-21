// BC-Mobile-7B+ — Community news list ("CỘNG ĐỒNG NÀY ĐANG CÓ TIN GÌ?").
// Read-only editorial list of published news for one community.
// No posting, no reactions, no comments, no ranking.

import { Link } from "@tanstack/react-router";
import { ChevronRight, Newspaper } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCommunityNews } from "@/hooks/use-community-news";
import type { CommunityNewsSummaryDTO } from "@/lib/business-connect/mobile/community-news.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";
import { ActivityListSkeleton } from "./CommunityEvents";

export function CommunityNews({ communityId }: { communityId: string }) {
  const t = useT();
  const news = useCommunityNews(communityId);

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.news.title")} />
      <main id="bc-mobile-community-news" className="contents">
        <h1 className="mt-4 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.news.title")}
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.news.subtitle")}
        </p>

        {news.initialLoading ? (
          <ActivityListSkeleton />
        ) : news.coreError ? (
          <CommunityError onRetry={news.retry} />
        ) : news.unavailable ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.unavailable")}
            </p>
          </section>
        ) : news.items.length === 0 ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.news.empty")}
            </p>
          </section>
        ) : (
          <>
            <ul
              aria-label={t("bc.mobile.community.news.listLabel")}
              aria-busy={news.isLoadingMore}
              className="mt-3 space-y-3"
            >
              {news.items.map((item) => (
                <NewsRow key={item.newsRef} communityId={communityId} item={item} />
              ))}
            </ul>
            {news.hasMore ? (
              <div className="mt-2 flex min-h-[52px] items-center justify-center">
                <button
                  type="button"
                  onClick={news.loadMore}
                  disabled={news.isLoadingMore}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                >
                  {news.isLoadingMore
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

export function NewsMeta({ item }: { item: CommunityNewsSummaryDTO }) {
  const t = useT();
  const meta = [item.author, item.publishedLabel].filter(Boolean).join(" · ");
  return (
    <p className="mt-1 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
      {meta || t("bc.mobile.community.news.noMeta")}
    </p>
  );
}

function NewsRow({
  communityId,
  item,
}: {
  communityId: string;
  item: CommunityNewsSummaryDTO;
}) {
  const t = useT();
  return (
    <li>
      <Link
        to="/connect-app/community/$communityId/news/$newsRef"
        params={{ communityId, newsRef: item.newsRef }}
        aria-label={`${t("bc.mobile.community.news.open")}: ${item.title}`}
        className="flex min-h-[72px] items-start gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]"
        >
          <Newspaper className="h-4 w-4 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          {item.category ? (
            <span className="inline-flex rounded-full border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--bc-mobile-accent)]">
              {item.category}
            </span>
          ) : null}
          <span className="mt-1 block text-[15px] font-semibold leading-snug text-[var(--bc-mobile-text)]">
            {item.title}
          </span>
          {item.excerpt ? (
            <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {item.excerpt}
            </span>
          ) : null}
          <NewsMeta item={item} />
        </span>
        <ChevronRight
          aria-hidden="true"
          className="mt-1 h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </Link>
    </li>
  );
}
