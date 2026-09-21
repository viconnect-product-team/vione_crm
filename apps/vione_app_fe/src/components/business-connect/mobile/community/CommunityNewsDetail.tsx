// BC-Mobile-7B+ — Community news detail (read-only).

import { useT } from "@/lib/i18n";
import { useCommunityNewsDetail } from "@/hooks/use-community-news";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";
import { ActivityListSkeleton } from "./CommunityEvents";
import { NewsMeta } from "./CommunityNews";

export function CommunityNewsDetail({
  communityId,
  newsRef,
}: {
  communityId: string;
  newsRef: string;
}) {
  const t = useT();
  const { detail, unavailable, initialLoading, coreError, retry } = useCommunityNewsDetail(
    communityId,
    newsRef,
  );

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.news.title")} />
      <main id="bc-mobile-community-news-detail" className="contents">
        {initialLoading ? (
          <ActivityListSkeleton rows={3} />
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : unavailable || !detail ? (
          <section className="mt-14 flex flex-col items-center text-center px-4">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              Bài viết hiện không tồn tại hoặc đã được cập nhật.
            </p>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-6 py-2.5 text-[14px] font-bold text-[#050c15] shadow-md shadow-[#D8B282]/25 cursor-pointer"
            >
              Quay lại bảng tin
            </button>
          </section>
        ) : (
          <article className="mt-5">
            {detail.news.category ? (
              <span className="inline-flex rounded-full border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-accent)]">
                {detail.news.category}
              </span>
            ) : null}
            <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
              {detail.news.title}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--bc-mobile-muted)]">
              {detail.communityName}
            </p>
            <NewsMeta item={detail.news} />

            <div className="mt-4 border-t border-[var(--bc-mobile-border)] pt-4">
              {detail.news.excerpt ? (
                <p className="max-w-[62ch] whitespace-pre-line text-[15px] leading-relaxed text-[var(--bc-mobile-text)]">
                  {detail.news.excerpt}
                </p>
              ) : (
                <p className="text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.news.noContent")}
                </p>
              )}
            </div>
          </article>
        )}
      </main>
    </>
  );
}
