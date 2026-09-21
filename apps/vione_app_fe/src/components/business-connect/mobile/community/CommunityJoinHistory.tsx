// BC-Mobile-7B+ — Hộp "Lịch sử yêu cầu tham gia": thời gian, trạng thái,
// lý do (nếu có) và cho phép gửi lại khi bị từ chối.

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFmt, useT } from "@/lib/i18n";
import { useCommunityJoinHistory, useJoinableCommunities } from "@/hooks/use-community-join";
import type {
  CommunityJoinHistoryItemDTO,
  CommunityJoinStatus,
} from "@/lib/business-connect/mobile/community-join.types";

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

const PAGE_SIZE = 10;

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
type HistoryFilter = (typeof FILTERS)[number];


const FILTER_KEYS: Record<HistoryFilter, string> = {
  all: "bc.mobile.community.tabs.all",
  pending: "bc.mobile.community.join.status.pending",
  approved: "bc.mobile.community.join.status.approved",
  rejected: "bc.mobile.community.join.status.rejected",
};

export function CommunityJoinHistory({ panel = false }: { panel?: boolean } = {}) {
  const t = useT();
  const fmt = useFmt();
  const { items: raw, initialLoading } = useCommunityJoinHistory();
  const { requestJoin } = useJoinableCommunities();
  const [target, setTarget] = useState<CommunityJoinHistoryItemDTO | null>(null);
  const [detail, setDetail] = useState<CommunityJoinHistoryItemDTO | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [desc, setDesc] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [note, setNote] = useState("");

  const filtered = [...raw]
    .filter((item) => (filter === "all" ? true : item.status === filter))
    .sort((a, b) => {
      const av = a.decidedAt ?? a.requestedAt ?? "";
      const bv = b.decidedAt ?? b.requestedAt ?? "";
      return desc ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  const items = filtered.slice(0, limit);
  const remaining = filtered.length - items.length;
  const resetPage = () => setLimit(PAGE_SIZE);


  const controls = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("bc.mobile.community.join.history.filter.label")}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); resetPage(); }}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1 text-[12.5px] transition ${
              filter === f
                ? "border-[var(--bc-mobile-accent)]/50 bg-[var(--bc-mobile-accent)]/12 text-[var(--bc-mobile-accent)]"
                : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
            }`}
          >
            {t(FILTER_KEYS[f] as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { setDesc((v) => !v); resetPage(); }}
        className="ml-auto rounded-full border border-[var(--bc-mobile-border)] px-3 py-1 text-[12.5px] text-[var(--bc-mobile-muted)]"
      >
        {t(desc ? "bc.mobile.community.join.history.sort.newest" : "bc.mobile.community.join.history.sort.oldest")}
      </button>
    </div>
  );

  if (initialLoading) return panel ? <p className="mt-6 text-[13px] text-[var(--bc-mobile-muted)]">…</p> : null;
  if (raw.length === 0) {
    if (!panel) return null;
    return (
      <section aria-label={t("bc.mobile.community.join.history.section")} className="mt-8 flex flex-col items-start gap-2">
        <p className="text-[15px] text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.join.history.empty")}
        </p>
        <p className="max-w-[38ch] text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.join.history.emptyHint")}
        </p>
      </section>
    );
  }


  const busy = requestJoin.isPending;

  const confirm = () => {
    const item = target;
    if (!item) return;
    requestJoin.mutate({ communityId: item.communityId, note: note.trim() || null }, {
      onSuccess: () => {
        setTarget(null);
        setNote("");
        setDetail(null);
        toast.success(t("bc.mobile.community.join.success"));
      },
      onError: () => {
        toast.error(t("bc.mobile.community.join.error"));
      },
    });
  };


  return (
    <section aria-label={t("bc.mobile.community.join.history.section")} className="mt-6">
      <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.join.history.section")}
      </h2>
      {controls}
      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-[var(--bc-mobile-muted)]" role="status">
          {t("bc.mobile.community.join.history.filter.empty")}
        </p>
      ) : null}
      <ul className="mt-3 space-y-3" data-testid="bc-community-join-history">
        {items.map((item) => {

          const when = item.decidedAt ?? item.requestedAt;
          return (
            <li
              key={item.requestId}
              className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
            >
              <button
                type="button"
                onClick={() => setDetail(item)}
                data-testid="bc-community-join-history-open"
                aria-label={t("bc.mobile.community.join.history.detail.open", { name: item.name })}
                className="flex w-full items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
                    {item.name}
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
              </button>

              {item.reason ? (
                <p className="mt-2 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
                  <span className="font-medium text-[var(--bc-mobile-text)]">
                    {t("bc.mobile.community.join.history.reason")}:{" "}
                  </span>
                  {item.reason}
                </p>
              ) : null}

              {item.cancelReason ? (
                <p
                  data-testid="bc-community-join-history-cancel-reason"
                  className="mt-2 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[12.5px] text-[var(--bc-mobile-muted)]"
                >
                  <span className="font-medium text-[var(--bc-mobile-text)]">
                    {t("bc.mobile.community.join.history.cancelReason")}:{" "}
                  </span>
                  {item.cancelReason}
                </p>
              ) : null}

              {item.status === "rejected" ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setNote(""); setTarget(item); }}
                    data-testid="bc-community-join-history-resend"
                    className="min-h-[36px] rounded-full border border-[var(--bc-mobile-accent)]/50 px-3 text-[13px] font-medium text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-accent)]/10 disabled:opacity-50"
                  >
                    {t("bc.mobile.community.join.retry")}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setLimit((v) => v + PAGE_SIZE)}
          className="mt-3 w-full rounded-full border border-[var(--bc-mobile-border)] px-4 py-2 text-[13px] text-[var(--bc-mobile-muted)]"
        >
          {t("bc.timeline.loadMore")} ({remaining})
        </button>
      ) : null}

      <AlertDialog
        open={target !== null}
        onOpenChange={(next) => {
          if (busy || next) return;
          setTarget(null);
          setNote("");
        }}
      >
        <AlertDialogContent data-testid="bc-community-join-history-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.community.join.retry.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.community.join.retry.body", { name: target?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="bc-community-join-history-note"
              className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.community.join.note.label")}
            </label>
            <textarea
              id="bc-community-join-history-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              disabled={busy}
              placeholder={t("bc.mobile.community.join.note.placeholder")}
              data-testid="bc-community-join-history-note"
              className="w-full resize-none rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[14px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus:ring-2 focus:ring-[var(--bc-mobile-navy)] disabled:opacity-50"
            />
            <p className="text-[11.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.join.note.hint", { count: String(note.trim().length) })}
            </p>
          </div>

          <AlertDialogFooter>

            <AlertDialogCancel disabled={busy}>
              {t("bc.mobile.community.join.confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                confirm();
              }}
              data-testid="bc-community-join-history-confirm-submit"
            >
              {busy
                ? t("bc.mobile.community.join.sending")
                : t("bc.mobile.community.join.confirm.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CommunityJoinHistoryDetailSheet
        item={detail}
        all={items}
        onClose={() => setDetail(null)}
      />
    </section>
  );
}

/** Chi tiết một yêu cầu: mốc thời gian đầy đủ, ghi chú, lý do và các lần gửi lại. */
function CommunityJoinHistoryDetailSheet({
  item,
  all,
  onClose,
}: {
  item: CommunityJoinHistoryItemDTO | null;
  all: CommunityJoinHistoryItemDTO[];
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useFmt();
  const full = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(locale) : t("bc.mobile.community.join.history.noTime");

  const attempts = item
    ? all
        .filter((i) => i.communityId === item.communityId)
        .sort((a, b) => (a.requestedAt ?? "").localeCompare(b.requestedAt ?? ""))
    : [];

  return (
    <Sheet open={item !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent
        side="bottom"
        data-testid="bc-community-join-history-detail"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl border border-[#D8B282]/25 bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl shadow-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-[var(--bc-mobile-text)]">{item?.name ?? ""}</SheetTitle>
          <SheetDescription className="text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.join.history.detail.title")}
          </SheetDescription>
        </SheetHeader>

        {item ? (
          <div className="mt-4 space-y-4 pb-6">
            <DetailRow
              label={t("bc.mobile.community.join.history.detail.status")}
              value={t(STATUS_KEYS[item.status])}
            />
            <DetailRow
              label={t("bc.mobile.community.join.history.detail.requestedAt")}
              value={full(item.requestedAt)}
            />
            <DetailRow
              label={t("bc.mobile.community.join.history.detail.decidedAt")}
              value={full(item.decidedAt)}
            />
            {item.reason ? (
              <DetailRow
                label={t("bc.mobile.community.join.history.reason")}
                value={item.reason}
              />
            ) : null}
            {item.cancelReason ? (
              <DetailRow
                label={t("bc.mobile.community.join.history.cancelReason")}
                value={item.cancelReason}
              />
            ) : null}

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.join.history.detail.attempts", {
                  count: String(attempts.length),
                })}
              </p>
              <ol className="mt-2 space-y-2" data-testid="bc-community-join-history-attempts">
                {attempts.map((a, index) => (
                  <li
                    key={a.requestId}
                    className="flex items-start justify-between gap-3 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2"
                  >
                    <span className="min-w-0 text-[12.5px] text-[var(--bc-mobile-muted)]">
                      <span className="mr-1 font-medium text-[var(--bc-mobile-text)]">
                        {t("bc.mobile.community.join.history.detail.attempt", {
                          index: String(index + 1),
                        })}
                      </span>
                      {full(a.requestedAt)}
                    </span>
                    <span className="shrink-0 text-[12px] font-medium text-[var(--bc-mobile-text)]">
                      {t(STATUS_KEYS[a.status])}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-[var(--bc-mobile-text)]">
        {value}
      </p>
    </div>
  );
}
