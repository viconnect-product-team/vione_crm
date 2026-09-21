// BC-Mobile-7B+ — Dải "Cộng đồng gợi ý": yêu cầu tham gia có xác nhận và
// hiển thị trạng thái hiện tại (Đang chờ / Đã tham gia / Từ chối).

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

function CommunityAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
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

const STATUS_KEYS = {
  pending: "bc.mobile.community.join.status.pending",
  approved: "bc.mobile.community.join.status.approved",
  rejected: "bc.mobile.community.join.status.rejected",
  cancelled: "bc.mobile.community.join.status.cancelled",
} as const;

export function CommunityJoinSection() {
  const t = useT();
  const { candidates, initialLoading, requestJoin, cancelJoin } = useJoinableCommunities();
  const [pendingTarget, setPendingTarget] = useState<CommunityJoinCandidateDTO | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CommunityJoinCandidateDTO | null>(null);
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Các cộng đồng đã có yêu cầu (đang chờ/từ chối/đã huỷ) hiển thị ở danh sách
  // thẻ cộng đồng phía trên; mục gợi ý chỉ giữ cộng đồng chưa gửi yêu cầu.
  const suggestions = candidates.filter((c) => c.status === "none");

  if (initialLoading || suggestions.length === 0) return null;

  const busy = requestJoin.isPending;
  const cancelBusy = cancelJoin.isPending;

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

  const confirm = () => {
    const target = pendingTarget;
    if (!target) return;
    requestJoin.mutate({ communityId: target.communityId, note }, {
      onSuccess: () => {
        setPendingTarget(null);
        setNote("");
        toast.success(t("bc.mobile.community.join.success"));
      },
      onError: () => {
        setPendingTarget(null);
        toast.error(t("bc.mobile.community.join.error"));
      },
    });
  };

  return (
    <section aria-label={t("bc.mobile.community.join.section")} className="mt-6">
      <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.join.section")}
      </h2>
      <ul className="mt-3 space-y-3">
        {suggestions.map((c: any) => (
          <li
            key={c.communityId}
            className="flex items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
          >
            <CommunityAvatar name={c.name} logoUrl={c.logoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-semibold text-[var(--bc-mobile-text)]">
                {c.name}
              </p>
              {c.shortDescription ? (
                <p className="mt-0.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                  {c.shortDescription}
                </p>
              ) : null}
            </div>
            <JoinAction
              status={c.status}
              busy={busy}
              cancelBusy={cancelBusy}
              onRequest={() => {
                setNote("");
                setPendingTarget(c);
              }}
              onCancel={() => {
                    setCancelReason("");
                    setCancelTarget(c);
                  }}
            />
          </li>
        ))}
      </ul>

      <AlertDialog
        open={pendingTarget !== null}
        onOpenChange={(next) => (busy ? undefined : next ? undefined : setPendingTarget(null))}
      >
        <AlertDialogContent data-testid="bc-community-join-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.community.join.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.community.join.confirm.body", { name: pendingTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="bc-community-join-note"
              className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.community.join.note.label")}
            </label>
            <textarea
              id="bc-community-join-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              disabled={busy}
              placeholder={t("bc.mobile.community.join.note.placeholder")}
              data-testid="bc-community-join-note"
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
              data-testid="bc-community-join-confirm-submit"
            >
              {busy
                ? t("bc.mobile.community.join.sending")
                : t("bc.mobile.community.join.confirm.submit")}
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
        <AlertDialogContent data-testid="bc-community-join-cancel-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.community.join.cancel.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.community.join.cancel.body", { name: cancelTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="bc-community-join-cancel-reason"
              className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.community.join.cancel.reason.label")}
            </label>
            <textarea
              id="bc-community-join-cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              disabled={cancelBusy}
              placeholder={t("bc.mobile.community.join.cancel.reason.placeholder")}
              data-testid="bc-community-join-cancel-reason"
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
              data-testid="bc-community-join-cancel-submit"
            >
              {cancelBusy
                ? t("bc.mobile.community.join.cancel.sending")
                : t("bc.mobile.community.join.cancel.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function JoinAction({
  status,
  busy,
  cancelBusy,
  onRequest,
  onCancel,
}: {
  status: CommunityJoinStatus;
  busy: boolean;
  cancelBusy: boolean;
  onRequest: () => void;
  onCancel: () => void;
}) {
  const t = useT();

  if (status === "pending") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <span
          data-testid="bc-community-join-status"
          className="rounded-full border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 px-2.5 py-1 text-[12px] font-medium text-[var(--bc-mobile-accent)]"
        >
          {t(STATUS_KEYS.pending)}
        </span>
        <button
          type="button"
          disabled={cancelBusy}
          onClick={onCancel}
          data-testid="bc-community-join-cancel"
          className="min-h-[36px] rounded-full border border-[var(--bc-mobile-border)] px-3 text-[13px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50"
        >
          {t("bc.mobile.community.join.cancel.action")}
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <span
        data-testid="bc-community-join-status"
        className="shrink-0 rounded-full border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 px-2.5 py-1 text-[12px] font-medium text-[var(--bc-mobile-accent)]"
      >
        {t(STATUS_KEYS[status])}
      </span>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status === "rejected" || status === "cancelled" ? (
        <span
          data-testid="bc-community-join-status"
          className="rounded-full border border-[var(--bc-mobile-border)] px-2.5 py-1 text-[12px] text-[var(--bc-mobile-muted)]"
        >
          {t(STATUS_KEYS[status])}
        </span>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={onRequest}
        className="min-h-[36px] rounded-full border border-[var(--bc-mobile-accent)]/50 px-3 text-[13px] font-medium text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-accent)]/10 disabled:opacity-50"
      >
        {status === "rejected" || status === "cancelled"
          ? t("bc.mobile.community.join.retry")
          : t("bc.mobile.community.join.action")}
      </button>
    </div>
  );
}
