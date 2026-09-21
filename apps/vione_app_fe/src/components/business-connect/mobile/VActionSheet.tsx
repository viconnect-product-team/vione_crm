// BC-Mobile-0B — V action sheet ("Business Identity" presentation).
//
// Frozen contract unchanged: the SAME five V capabilities, same order, same
// truthful availability state. Only the presentation follows the Executive
// Minimal Luxury identity-sheet design (identity card → gold hero CTA →
// outlined action rows → quick tiles → circular close).

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Contact,
  Globe,
  IdCard,
  MapPin,
  Nfc,
  NotebookPen,
  QrCode,
  ScanLine,
  ShieldCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useMyIdentity } from "@/hooks/use-my-identity";
import { useT, type TKey } from "@/lib/i18n";
import {
  getOrCreateShareLinkDirect,
  rotateShareLinkDirect,
} from "@/lib/business-connect/mobile/identity.functions";
import { registerNfcTagDirect } from "@/lib/business-connect/mobile/nfc-tags.functions";
import { webDisplay } from "@/lib/business-connect/mobile/public-actions";
import { IdentityQrSheet } from "@/components/business-connect/mobile/me/IdentityQrSheet";
import { NfcActionSheet } from "@/components/business-connect/mobile/me/NfcActionSheet";
import { NfcSheet } from "@/components/business-connect/mobile/me/NfcSheet";
import { TapToConnectSheet } from "@/components/business-connect/mobile/TapToConnectSheet";
import { MeSheet } from "@/components/business-connect/mobile/me/MeSheet";
import { Loader2 } from "lucide-react";
import type {
  BusinessIdentity,
  IdentityShareLinkInfo,
} from "@/lib/business-connect/mobile/identity.types";

export const V_ACTION_IDS = ["presentQr", "nfc", "scanQr", "scanCard", "meetingMoment"] as const;
export type VActionId = (typeof V_ACTION_IDS)[number];

/** Truthful capability state — never exposed to end users as dev terms. */
export type VActionStatus = "available" | "soon";

export type VAction = {
  id: VActionId;
  icon: LucideIcon;
  status: VActionStatus;
  /** In-shell destination when available. */
  href?: "/connect-app/moment" | "/connect-app/me/card" | "/connect-app/card-scan";
};

/**
 * Frozen V capability list. Meeting Moment available since BC-Mobile-2E,
 * Present QR since BC-Mobile-3A, Scan Business Card since BC-Mobile-4A
 * (/connect-app/card-scan). NFC + Scan QR now reuse the SAME canonical 5B/5E
 * flows already shipped on the Me surface (NfcActionSheet / NfcSheet /
 * TapToConnectSheet) — no new backend behaviour is introduced here.
 */
export const V_ACTIONS: readonly VAction[] = [
  { id: "presentQr", icon: QrCode, status: "available", href: "/connect-app/me/card" },
  { id: "nfc", icon: Nfc, status: "available" },
  { id: "scanQr", icon: ScanLine, status: "available" },
  { id: "scanCard", icon: IdCard, status: "available", href: "/connect-app/card-scan" },
  { id: "meetingMoment", icon: NotebookPen, status: "available", href: "/connect-app/moment" },
];

/** Hero CTA of the sheet — rendered with the warm-gold gradient. */
const PRIMARY_ACTION_ID: VActionId = "presentQr";

const NAME_KEY: Record<VActionId, TKey> = {
  presentQr: "bc.mobile.action.presentQr",
  nfc: "bc.mobile.action.nfc",
  scanQr: "bc.mobile.action.scanQr",
  scanCard: "bc.mobile.action.scanCard",
  meetingMoment: "bc.mobile.action.meetingMoment",
};

const DESC_KEY: Record<VActionId, TKey> = {
  presentQr: "bc.mobile.action.presentQr.desc",
  nfc: "bc.mobile.action.nfc.desc",
  scanQr: "bc.mobile.action.scanQr.desc",
  scanCard: "bc.mobile.action.scanCard.desc",
  meetingMoment: "bc.mobile.action.meetingMoment.desc",
};

export function VActionSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  // Nguồn danh tính dùng chung -> ảnh đại diện luôn khớp Trang chủ và màn Tôi.
  const mine = useMyIdentity({ enabled: open });
  const identity: BusinessIdentity | null = mine.data?.identity ?? null;

  const go = (href: NonNullable<VAction["href"]> | "/connect-app/me") => {
    onOpenChange(false);
    void navigate({ to: href });
  };

  // "Đưa QR" mở thẳng mã QR ngay tại chỗ (không điều hướng sang màn khác).
  // Dùng direct helpers để bypass requireSupabaseAuth middleware.
  const [nfcSheet, setNfcSheet] = useState<null | "choose" | "write" | "tap-connect">(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<IdentityShareLinkInfo | null>(null);
  const [rotating, setRotating] = useState(false);

  const openQr = async () => {
    onOpenChange(false);
    setQrOpen(true);
    setQrError(null);
    if (shareLink) return;
    setQrLoading(true);
    try {
      setShareLink(await getOrCreateShareLinkDirect());
    } catch (e) {
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setQrLoading(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      setShareLink(await rotateShareLinkDirect());
    } catch (e) {
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setRotating(false);
    }
  };

  // NFC + Quét QR: mở đúng luồng đã có (5B ghi thẻ / 5E chạm để kết nối).
  const openNfcWriter = async () => {
    setQrError(null);
    setNfcSheet("write");
    if (shareLink) return;
    setQrLoading(true);
    try {
      setShareLink(await getOrCreateShareLinkDirect());
    } catch (e) {
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setQrLoading(false);
    }
  };

  const handleAction = (action: VAction) => {
    if (action.id === "presentQr") return void openQr();
    if (action.id === "nfc") {
      onOpenChange(false);
      return setNfcSheet("choose");
    }
    if (action.id === "scanQr") {
      onOpenChange(false);
      return setNfcSheet("tap-connect");
    }
    if (action.href) go(action.href);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      {/* bc-app re-scopes the BC tokens inside the drawer portal. */}
      <DrawerContent className="bc-app mx-auto w-full max-w-[480px] rounded-t-[var(--bc-mobile-radius-sheet)] border border-[#D8B282]/25 bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl px-0 shadow-2xl">
        <DrawerTitle className="sr-only">{t("bc.mobile.sheet.title")}</DrawerTitle>
        <DrawerDescription className="sr-only">{t("bc.mobile.sheet.subtitle")}</DrawerDescription>

        <div
          className="max-h-[86dvh] overflow-y-auto px-5 pt-1"
          style={{ paddingBottom: "max(1.25rem, var(--bc-mobile-safe-bottom))" }}
        >
          {/* Header */}
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.32em] text-[var(--bc-mobile-accent)]">
            {t("bc.mobile.sheet.identityTitle")}
          </p>
          <p className="mt-2 text-center text-[14px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.sheet.identitySubtitle")}
          </p>

          {identity && <IdentityCard identity={identity} />}

          {/* Frozen five capabilities */}
          <ul aria-label={t("bc.mobile.sheet.actionsLabel")} className="mt-5 grid gap-3">
            {V_ACTIONS.map((action) => (
              <VActionRow
                key={action.id}
                action={action}
                primary={action.id === PRIMARY_ACTION_ID}
                onSelect={handleAction}
              />
            ))}
          </ul>

          <div
            aria-hidden="true"
            className="mt-6 h-px w-full bg-[var(--bc-mobile-border)] opacity-70"
          />

          {/* Quick tiles */}
          <div
            role="group"
            aria-label={t("bc.mobile.sheet.tilesLabel")}
            className="mt-5 grid grid-cols-3 gap-2"
          >
            <QuickTile
              icon={Contact}
              titleKey="bc.mobile.sheet.tile.digitalCard"
              descKey="bc.mobile.sheet.tile.digitalCard.desc"
              onClick={() => go("/connect-app/me/card")}
            />
            <QuickTile
              icon={Wallet}
              titleKey="bc.mobile.sheet.tile.wallet"
              descKey="bc.mobile.sheet.tile.wallet.desc"
              onClick={() => go("/connect-app/me")}
            />
            <QuickTile
              icon={ShieldCheck}
              titleKey="bc.mobile.sheet.tile.privacy"
              descKey="bc.mobile.sheet.tile.privacy.desc"
              onClick={() => go("/connect-app/me")}
            />
          </div>

          {/* Circular close */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              aria-label={t("bc.mobile.sheet.close")}
              onClick={() => onOpenChange(false)}
              className="grid h-12 w-12 place-items-center rounded-full border border-[color-mix(in_oklab,var(--bc-mobile-accent)_45%,transparent)] text-[var(--bc-mobile-accent)] transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--bc-mobile-accent)_12%,transparent)] motion-reduce:transition-none"
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </DrawerContent>
      </Drawer>

      {qrOpen && shareLink && !qrLoading ? (
        <IdentityQrSheet
          shareLink={shareLink}
          rotating={rotating}
          onRotate={() => void handleRotate()}
          onClose={() => setQrOpen(false)}
        />
      ) : null}

      {qrOpen && (qrLoading || !shareLink) ? (
        <MeSheet
          title={t("bc.mobile.action.presentQr")}
          subtitle={t("bc.mobile.action.presentQr.desc")}
          busy={qrLoading}
          onClose={() => setQrOpen(false)}
        >
          <div className="flex min-h-[220px] items-center justify-center px-5 pb-6 text-center">
            {qrError ? (
              <p className="text-[14px] text-[var(--bc-mobile-muted)]">{qrError}</p>
            ) : (
              <Loader2 className="size-6 animate-spin text-[var(--bc-mobile-muted)]" />
            )}
          </div>
        </MeSheet>
      ) : null}

      {nfcSheet === "choose" ? (
        <NfcActionSheet
          onConnect={() => setNfcSheet("tap-connect")}
          onShare={() => void openNfcWriter()}
          onClose={() => setNfcSheet(null)}
        />
      ) : null}

      {nfcSheet === "tap-connect" ? (
        <TapToConnectSheet onClose={() => setNfcSheet(null)} />
      ) : null}

      {nfcSheet === "write" && shareLink && !qrLoading ? (
        <NfcSheet
          shareLink={shareLink}
          onClose={() => setNfcSheet(null)}
          registerTag={() => registerNfcTagDirect(shareLink.token)}
        />
      ) : null}

      {nfcSheet === "write" && (qrLoading || !shareLink) ? (
        <MeSheet
          title={t("bc.mobile.action.nfc")}
          subtitle={t("bc.mobile.action.nfc.desc")}
          busy={qrLoading}
          onClose={() => setNfcSheet(null)}
        >
          <div className="flex min-h-[220px] items-center justify-center px-5 pb-6 text-center">
            {qrError ? (
              <p className="text-[14px] text-[var(--bc-mobile-muted)]">{qrError}</p>
            ) : (
              <Loader2 className="size-6 animate-spin text-[var(--bc-mobile-muted)]" />
            )}
          </div>
        </MeSheet>
      ) : null}
    </>
  );
}

function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "…";
  return parts
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Owner identity preview — read-only projection of the canonical identity. */
function IdentityCard({ identity }: { identity: BusinessIdentity }) {
  const t = useT();
  const location = [identity.city, identity.address].filter(Boolean)[0] ?? null;
  const web = identity.website ? webDisplay(identity.website) : null;

  return (
    <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[color-mix(in_oklab,var(--bc-mobile-accent)_32%,var(--bc-mobile-border))] bg-[linear-gradient(150deg,var(--bc-mobile-surface-2)_0%,var(--bc-mobile-surface)_60%,var(--bc-mobile-bg,var(--bc-mobile-surface))_100%)] p-4">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 right-1 select-none font-serif text-[132px] font-semibold leading-none"
        style={{
          background:
            "linear-gradient(135deg, #AB6D3C 0%, #FDE6B4 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          opacity: 0.4,
        }}
      >
        V
      </span>

      <div className="relative flex items-center gap-4">
        {identity.avatarUrl ? (
          <img
            src={identity.avatarUrl}
            alt=""
            loading="lazy"
            className="h-[76px] w-[76px] shrink-0 rounded-full object-cover ring-1 ring-[color-mix(in_oklab,var(--bc-mobile-accent)_60%,transparent)]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[22px] font-semibold text-[var(--bc-mobile-accent)] ring-1 ring-[color-mix(in_oklab,var(--bc-mobile-accent)_50%,transparent)]"
          >
            {initialsOf(identity.displayName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-semibold leading-tight text-[var(--bc-mobile-text)]">
            {identity.displayName}
          </p>
          {identity.jobTitle && (
            <p className="mt-0.5 truncate text-[14.5px] font-medium text-[var(--bc-mobile-accent)]">
              {identity.jobTitle}
            </p>
          )}
          {identity.companyName && (
            <p className="mt-0.5 truncate text-[14px] text-[var(--bc-mobile-text)]/85">
              {identity.companyName}
            </p>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--bc-mobile-accent)_55%,transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bc-mobile-accent)]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            {t("bc.mobile.sheet.memberBadge")}
          </span>
        </div>
      </div>

      {(location || web) && (
        <>
          <div
            aria-hidden="true"
            className="relative mt-3.5 h-px w-full bg-[color-mix(in_oklab,var(--bc-mobile-accent)_25%,transparent)]"
          />
          <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-[var(--bc-mobile-text)]/80">
            {location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-[var(--bc-mobile-accent)]"
                  strokeWidth={1.8}
                />
                <span className="truncate">{location}</span>
              </span>
            )}
            {location && web && (
              <span
                aria-hidden="true"
                className="h-3.5 w-px bg-[color-mix(in_oklab,var(--bc-mobile-accent)_35%,transparent)]"
              />
            )}
            {web && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Globe
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-[var(--bc-mobile-accent)]"
                  strokeWidth={1.8}
                />
                <span className="truncate">{web}</span>
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function QuickTile({
  icon: Icon,
  titleKey,
  descKey,
  onClick,
}: {
  icon: LucideIcon;
  titleKey: TKey;
  descKey: TKey;
  onClick?: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition-colors duration-150 enabled:hover:bg-[var(--bc-mobile-surface-2)] disabled:cursor-default motion-reduce:transition-none"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full border border-[color-mix(in_oklab,var(--bc-mobile-accent)_40%,transparent)] text-[var(--bc-mobile-accent)]">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <span className="text-[12.5px] font-semibold leading-tight text-[var(--bc-mobile-text)]">
        {t(titleKey)}
      </span>
      <span className="text-[10.5px] leading-tight text-[var(--bc-mobile-muted)]">
        {onClick ? t(descKey) : t("bc.mobile.action.soon")}
      </span>
    </button>
  );
}

function VActionRow({
  action,
  onSelect,
  primary = false,
}: {
  action: VAction;
  onSelect: (action: VAction) => void;
  /** Design parity: the first available action is the warm-gold hero CTA. */
  primary?: boolean;
}) {
  const t = useT();
  const Icon = action.icon;
  const available = action.status === "available";
  const gold = primary && available;
  return (
    <li>
      <button
        type="button"
        disabled={!available}
        onClick={available ? () => onSelect(action) : undefined}
        className={
          gold
            ? "bc-cta-gold flex min-h-[68px] w-full items-center gap-4 rounded-[18px] px-4 py-3 text-left"
            : "flex min-h-[68px] w-full items-center gap-4 rounded-[18px] border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 py-3 text-left transition-colors duration-150 enabled:hover:border-[color-mix(in_oklab,var(--bc-mobile-accent)_45%,transparent)] disabled:cursor-default motion-reduce:transition-none"
        }
      >
        <span
          className={
            gold
              ? "shrink-0 text-[var(--bc-mobile-accent-on)]"
              : "shrink-0 text-[var(--bc-mobile-accent)]"
          }
        >
          <Icon className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={
              gold
                ? "block truncate text-[16.5px] font-semibold text-[var(--bc-mobile-accent-on)]"
                : "block truncate text-[16.5px] font-semibold text-[var(--bc-mobile-text)]"
            }
          >
            {t(NAME_KEY[action.id])}
          </span>
          <span
            className={
              gold
                ? "block truncate text-[13px] text-[color-mix(in_oklab,var(--bc-mobile-accent-on)_72%,transparent)]"
                : "block truncate text-[13px] text-[var(--bc-mobile-muted)]"
            }
          >
            {t(DESC_KEY[action.id])}
          </span>
        </span>
        {available ? (
          <ChevronRight
            aria-hidden="true"
            className={
              gold
                ? "h-5 w-5 shrink-0 text-[var(--bc-mobile-accent-on)]"
                : "h-5 w-5 shrink-0 text-[var(--bc-mobile-muted)]"
            }
            strokeWidth={2}
          />
        ) : (
          <span className="shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.action.soon")}
          </span>
        )}
      </button>
    </li>
  );
}
