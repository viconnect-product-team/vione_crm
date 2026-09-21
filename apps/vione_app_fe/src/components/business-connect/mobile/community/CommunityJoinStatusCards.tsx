// BC-Mobile-7B+ — Thẻ cộng đồng ở màn danh sách cho các cộng đồng viewer đã
// gửi yêu cầu tham gia: đồng bộ trạng thái (Đang chờ / Từ chối / Đã huỷ) và
// đổi nút hành động tương ứng (Huỷ yêu cầu / Gửi lại yêu cầu).

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
import { useT } from "@/lib/i18n";
import { useJoinableCommunities } from "@/hooks/use-community-join";
import type {
  CommunityJoinCandidateDTO,
  CommunityJoinStatus,
} from "@/lib/business-connect/mobile/community-join.types";

const STATUS_KEYS = {
  pending: "bc.mobile.community.join.status.pending",
  approved: "bc.mobile.community.join.status.approved",
  rejected: "bc.mobile.community.join.status.rejected",
  cancelled: "bc.mobile.community.join.status.cancelled",
} as const;

function Avatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--bc-mobile-border)] object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-surface-2)] text-[16px] font-semibold text-[var(--bc-mobile-accent)]"
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </div>
  );
}

export function CommunityJoinStatusBadge({ status }: { status: CommunityJoinStatus }) {
  const t = useT();
  if (status === "none") return null;
  const strong = status === "pending" || status === "approved";
  return (
    <span
      data-testid="bc-community-card-join-status"
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        strong
          ? "border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 text-[var(--bc-mobile-accent)]"
          : "border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
      }`}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}

/** Danh sách thẻ cộng đồng theo trạng thái yêu cầu tham gia (không gồm "none"). */
export function CommunityJoinStatusCards({ term }: { term?: string }) {
  const t = useT();
  const { candidates, initialLoading, requestJoin, cancelJoin } = useJoinableCommunities();
  const [cancelTarget, setCancelTarget] = useState<CommunityJoinCandidateDTO | null>(null);
  const [retryTarget, setRetryTarget] = useState<CommunityJoinCandidateDTO | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [note, setNote] = useState("");

  const query = (term ?? "").trim().toLowerCase();
  const items = candidates.filter(
    (c) =>
      c.status !== "none" &&
      c.status !== "approved" &&
      (!query || c.name.toLowerCase().includes(query)),
  );

  if (initialLoading || items.length === 0) return null;

  const cancelBusy = cancelJoin.isPending;
  const retryBusy = requestJoin.isPending;

  const confirmCancel = () => {
    const target = cancelTarget;
    if (!target) return;
    cancelJoin.mutate(
      { communityId: target.communityId, cancelReason },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason("");
          toast.success(t("bc.mobile.community.join.cancel.success"));
        },
        onError: () => {
          setCancelTarget(null);
          toast.error(t("bc.mobile.community.join.cancel.error"));
        },
      },
    );
  };

  const confirmRetry = () => {
    const target = retryTarget;
    if (!target) return;
    requestJoin.mutate(
      { communityId: target.communityId, note },
      {
        onSuccess: () => {
          setRetryTarget(null);
          setNote("");
          toast.success(t("bc.mobile.community.join.success"));
        },
        onError: () => {
          setRetryTarget(null);
          toast.error(t("bc.mobile.community.join.error"));
        },
      },
    );
  };

  return (
    <>
      <ul className="mt-3.5 space-y-3.5" data-testid="bc-community-join-status-cards">
        {items.map((c: any) => (
          <li
            key={c.communityId}
            className="overflow-hidden rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]"
          >
            <div className="flex items-center gap-3.5 p-3.5">
              <Avatar name={c.name} logoUrl={c.logoUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[16px] font-semibold text-[var(--bc-mobile-text)]">
                    {c.name}
                  </p>
                  <CommunityJoinStatusBadge status={c.status} />
                </div>
                {c.shortDescription ? (
                  <p className="mt-1 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                    {c.shortDescription}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="border-t border-[var(--bc-mobile-border)]">
              {c.status === "pending" ? (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => {
                    setCancelReason("");
                    setCancelTarget(c);
                  }}
                  data-testid="bc-community-card-join-cancel"
                  className="flex min-h-[44px] w-full items-center justify-center text-[13px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50"
                >
                  {t("bc.mobile.community.join.cancel.action")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={retryBusy}
                  onClick={() => {
                    setNote("");
                    setRetryTarget(c);
                  }}
                  data-testid="bc-community-card-join-retry"
                  className="flex min-h-[44px] w-full items-center justify-center text-[13px] font-medium text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50"
                >
                  {retryBusy
                    ? t("bc.mobile.community.join.sending")
                    : t("bc.mobile.community.join.retry")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={retryTarget !== null}
        onOpenChange={(next) => (retryBusy ? undefined : next ? undefined : setRetryTarget(null))}
      >
        <AlertDialogContent data-testid="bc-community-card-retry-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.community.join.retry.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.community.join.retry.body", { name: retryTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="bc-community-card-retry-note"
              className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.community.join.note.label")}
            </label>
            <textarea
              id="bc-community-card-retry-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              disabled={retryBusy}
              placeholder={t("bc.mobile.community.join.note.placeholder")}
              data-testid="bc-community-card-retry-note"
              className="w-full resize-none rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[14px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus:ring-2 focus:ring-[var(--bc-mobile-navy)] disabled:opacity-50"
            />
            <p className="text-[11.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.join.note.hint", { count: String(note.trim().length) })}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={retryBusy}>
              {t("bc.mobile.community.join.confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={retryBusy}
              data-testid="bc-community-card-retry-submit"
              onClick={(e) => {
                e.preventDefault();
                confirmRetry();
              }}
            >
              {retryBusy
                ? t("bc.mobile.community.join.sending")
                : t("bc.mobile.community.join.retry")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(next) =>
          cancelBusy ? undefined : next ? undefined : setCancelTarget(null)
        }
      >
        <AlertDialogContent data-testid="bc-community-card-cancel-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.community.join.cancel.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.community.join.cancel.body", { name: cancelTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="bc-community-card-cancel-reason"
              className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.community.join.cancel.reason.label")}
            </label>
            <textarea
              id="bc-community-card-cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              disabled={cancelBusy}
              placeholder={t("bc.mobile.community.join.cancel.reason.placeholder")}
              data-testid="bc-community-card-cancel-reason"
              className="w-full resize-none rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[14px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus:ring-2 focus:ring-[var(--bc-mobile-navy)] disabled:opacity-50"
            />
            <p className="text-[11.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.join.note.hint", { count: String(cancelReason.trim().length) })}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelBusy}>
              {t("bc.mobile.community.join.cancel.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelBusy}
              onClick={(e) => {
                e.preventDefault();
                confirmCancel();
              }}
            >
              {cancelBusy
                ? t("bc.mobile.community.join.cancel.sending")
                : t("bc.mobile.community.join.cancel.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
