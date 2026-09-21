// BC-Mobile — Chi tiết một gợi ý "AI Match" trên màn Network.
//
// Chỉ trình bày dữ liệu chuẩn của 6A (người + lý do theo ngày + lời gợi ý đã
// kiểm duyệt). Hành động kết nối đi qua đúng hợp đồng BC-3.1D
// (ProfileConnectSDK theo card slug) — không tự tạo máy trạng thái riêng và
// không bao giờ hiển thị "đã gửi" khi máy chủ chưa xác nhận.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Check, Clock, Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useT, type TKey } from "@/lib/i18n";
import { useNetworkRowConnect } from "@/hooks/use-network-row-connect";
import { avatarOrDemo } from "@/lib/business-connect/mobile/demo-avatars";
import { ConnectConfirmDialog } from "./ConnectConfirmDialog";
import type { RelationshipRecommendation } from "@/lib/business-connect/mobile/relationship-intelligence.types";

const BTN =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none";

export type AiMatchConnectTarget = {
  cardSlug: string | null;
  /** Đã là kết nối chính thức theo dữ liệu 2A (nếu biết). */
  alreadyConnected: boolean;
};

/**
 * Khối hành động kết nối dùng chung cho thẻ AI Match và sheet chi tiết.
 * Cùng một query cache (theo card slug) nên trạng thái luôn khớp nhau.
 */
export function AiMatchConnectAction({
  personName,
  target,
  compact = false,
}: {
  personName: string | null;
  target: AiMatchConnectTarget;
  compact?: boolean;
}) {
  const t = useT();
  const eligible = !target.alreadyConnected && Boolean(target.cardSlug);
  const { state, connect, cancel, busy } = useNetworkRowConnect(target.cardSlug, eligible);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = (mutation: { mutateAsync: () => Promise<unknown> }, successKey: TKey) => {
    void mutation
      .mutateAsync()
      .then(() => toast.success(t(successKey)))
      .catch(() => toast.error(t("bc.mobile.connection.error")));
  };

  if (target.alreadyConnected || state === "connected") {
    return (
      <span
        className={`${BTN} cursor-default border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]`}
      >
        <Check aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        {t("bc.mobile.connection.connected")}
      </span>
    );
  }

  if (!eligible || state === null) return null;

  if (state === "pending_sent") {
    return (
      <>
        <span
          aria-live="polite"
          className={`${BTN} cursor-default border border-[var(--bc-mobile-accent)]/50 text-[var(--bc-mobile-accent)]`}
        >
          <Clock aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          {t("bc.mobile.network.aimatch.sent")}
        </span>
        {compact ? null : (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(cancel, "bc.mobile.connection.toast.withdrawn")}
            className={`${BTN} bc-cta-gold-soft`}
          >
            {busy ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            {t("bc.mobile.connection.withdraw")}
          </button>
        )}
      </>
    );
  }

  if (state === "pending_received") {
    return (
      <Link to="/connect-app/network/requests" className={`${BTN} bc-cta-gold`}>
        {t("bc.mobile.connection.accept")}
      </Link>
    );
  }

  if (state !== "none" && state !== "saved") return null;

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirmOpen(true)}
        className={`${BTN} bc-cta-gold`}
        data-testid="bc-aimatch-connect"
      >
        {busy ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        {t("bc.mobile.connection.connect")}
      </button>
      <ConnectConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        personLabel={personName}
        busy={busy}
        onConfirm={() => {
          run(connect, "bc.mobile.connection.toast.sent");
          setConfirmOpen(false);
        }}
      />
    </>
  );
}

export function AiMatchDetailSheet({
  open,
  onOpenChange,
  rec,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rec: RelationshipRecommendation | null;
  target: AiMatchConnectTarget;
}) {
  const t = useT();
  if (!rec) return null;

  const name = rec.person.displayName ?? t("bc.mobile.network.unknownPerson");
  const roleLine = [rec.person.headline, rec.person.companyName].filter(Boolean).join(" · ");
  const meta = [rec.person.industryLabel, rec.person.areaLabel].filter(Boolean).join(" · ");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent data-testid="bc-aimatch-detail">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("bc.mobile.network.aimatch.detail.title")}</DrawerTitle>
          <DrawerDescription>{t("bc.mobile.network.aimatch.detail.subtitle")}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <div className="flex items-center gap-3">
            <img
              src={avatarOrDemo(rec.person.avatarUrl, rec.person.personId)}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-[var(--bc-mobile-accent)]/70"
            />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-[var(--bc-mobile-text)]">
                {name}
              </p>
              {roleLine ? (
                <p className="mt-0.5 truncate text-[13px] text-[var(--bc-mobile-muted)]">
                  {roleLine}
                </p>
              ) : null}
              {meta ? (
                <p className="mt-0.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                  {meta}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.network.aimatch.detail.reasonLabel")}
            </p>
            <p className="mt-1.5 text-[14px] text-[var(--bc-mobile-accent)]">
              {rec.reason.days > 0
                ? t("bc.mobile.network.suggest.days", { count: rec.reason.days })
                : t("bc.mobile.network.suggest.recent")}
            </p>
            {rec.aiSuggestion ? (
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--bc-mobile-text)]">
                {rec.aiSuggestion}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <AiMatchConnectAction personName={rec.person.displayName} target={target} />
          </div>

          <div className="mt-2 flex gap-2">
            <Link
              to="/connect-app/network/$personId"
              params={{ personId: rec.person.personId }}
              onClick={() => onOpenChange(false)}
              className={`${BTN} border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)]`}
            >
              {t("bc.mobile.network.aimatch.detail.viewProfile")}
            </Link>
            <Link
              to="/connect-app/moment/$personId"
              params={{ personId: rec.person.personId }}
              onClick={() => onOpenChange(false)}
              className={`${BTN} border border-[var(--bc-mobile-accent)]/60 text-[var(--bc-mobile-accent)]`}
            >
              <Camera aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.network.suggest.cta")}
            </Link>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
