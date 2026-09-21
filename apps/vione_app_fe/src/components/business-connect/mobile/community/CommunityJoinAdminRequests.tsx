// BC-Mobile-7B+ — Màn quản trị yêu cầu tham gia cộng đồng.
// Chỉ hiển thị (read-only): người gửi, thời gian, trạng thái và ghi chú kèm theo.

import { useT, useFmt } from "@/lib/i18n";
import { useCommunityJoinAdminRequests } from "@/hooks/use-community-join";
import type { CommunityJoinStatus } from "@/lib/business-connect/mobile/community-join.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError, CommunityListSkeleton } from "./CommunityHome";

const STATUS_KEYS = {
  none: "bc.mobile.community.join.status.pending",
  pending: "bc.mobile.community.join.status.pending",
  approved: "bc.mobile.community.join.status.approved",
  rejected: "bc.mobile.community.join.status.rejected",
  cancelled: "bc.mobile.community.join.status.cancelled",
} as const;

function statusTone(status: CommunityJoinStatus) {
  if (status === "approved" || status === "pending") {
    return "border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 text-[var(--bc-mobile-accent)]";
  }
  return "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]";
}

export function CommunityJoinAdminRequests() {
  const t = useT();
  const fmt = useFmt();
  const { items, initialLoading, coreError, retry } = useCommunityJoinAdminRequests();

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.join.admin.title")} />
      <main id="bc-mobile-community-join-admin" className="contents">
        <h1 className="mt-4 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.join.admin.title")}
        </h1>

        {initialLoading ? (
          <CommunityListSkeleton />
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : items.length === 0 ? (
          <p className="mt-10 max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.join.admin.empty")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3" data-testid="bc-community-join-admin-list">
            {items.map((item) => {
              const when = item.decidedAt ?? item.requestedAt;
              return (
                <li
                  key={item.requestId}
                  className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
                        {item.requesterName ??
                          t("bc.mobile.community.join.admin.unknownRequester")}
                      </p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                        {item.communityName}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
                        {when
                          ? t("bc.mobile.community.join.history.at", { time: fmt.date(when) })
                          : t("bc.mobile.community.join.history.noTime")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-medium ${statusTone(item.status)}`}
                    >
                      {t(STATUS_KEYS[item.status])}
                    </span>
                  </div>

                  <p
                    className="mt-2 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[12.5px] text-[var(--bc-mobile-muted)]"
                    data-testid="bc-community-join-admin-note"
                  >
                    <span className="font-medium text-[var(--bc-mobile-text)]">
                      {t("bc.mobile.community.join.admin.note")}:{" "}
                    </span>
                    {item.note ?? t("bc.mobile.community.join.admin.noNote")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
