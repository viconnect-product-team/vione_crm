// BC-Mobile-2C — Person Detail (read-only foundation).
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2C_PERSON_DATA_CONTRACT.md
// UX freeze (spec §16): centered identity hero → contact actions →
// relationship narrative → optional secondary sections. Optional sections
// render ONLY when their data exists. No scores, tags, badges, KPIs, menus,
// sheets, or destructive actions. Exactly one h1 (the person's name). Every
// action is backed by a real, visibility-cleared field — nothing decorative.

import { Link, useNavigate } from "@tanstack/react-router";
import {
  Share2,
  Facebook,
  Globe,
  IdCard,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Music2,
  NotebookPen,
  Phone,
  RefreshCw,
  ScanLine,
  UserRound,
  Youtube,
  CircleCheck,
  Check,
  X,
  Loader2,
  UserPlus,
  UserX,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDmOpenThread } from "@/hooks/use-bc-dm";
import { toast } from "sonner";
import { useFmt, useT } from "@/lib/i18n";
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
  useBusinessConnectPerson,
  parseBcMobilePersonId,
  type BcMobilePersonDetail,
} from "@/hooks/use-business-connect-person";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import {
  buildPersonVCard,
  personVcfFilename,
  shareOrDownloadVcf,
} from "@/lib/business-connect/mobile/person-vcard";
import { reportPersonVcfMetric } from "@/lib/business-connect/mobile/person-vcf.telemetry";
import { MobilePage } from "./MobilePage";
import { BusinessConnectTopBar } from "./BusinessConnectTopBar";
import { PersonJourney } from "./PersonJourney";
import { PersonSuggestion } from "./PersonSuggestion";
import { VcfPreviewSheet } from "./VcfPreviewSheet";
import { PersonNotes } from "./PersonNotes";

// ── Avatar (same fallback language as the 2A/2B list) ───────────────────────

function initialsOf(name: string | null): string | null {
  if (!name) return null;
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || null;
}

function PersonAvatar({ person, name }: { person: BcMobilePersonDetail; name: string }) {
  const initials = initialsOf(person.displayName);
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        loading="lazy"
        className="h-22 w-22 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-22 w-22 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[24px] font-semibold text-[var(--bc-mobile-text)]"
    >
      {initials ?? name.slice(0, 1).toUpperCase()}
    </span>
  );
}

// ── Contact actions ─────────────────────────────────────────────────────────

function ActionButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-2 py-3 text-center transition-colors duration-150 motion-reduce:transition-none"
    >
      <span className="grid place-items-center text-[var(--bc-mobile-accent)]">{children}</span>
      <span className="text-[12px] leading-tight text-[var(--bc-mobile-text-2)]">{label}</span>
    </a>
  );
}

function CardActionLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link
      to="/b/$slug"
      params={{ slug }}
      aria-label={label}
      className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-2 py-3 text-center transition-colors duration-150 motion-reduce:transition-none"
    >
      <span className="grid place-items-center text-[var(--bc-mobile-accent)]">
        <IdCard aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <span className="text-[12px] leading-tight text-[var(--bc-mobile-text-2)]">{label}</span>
    </Link>
  );
}

/** BC-Mobile-8A — mở (hoặc tạo) hộp thư 1-1 với kết nối đã chấp nhận.
    Máy chủ vẫn là nơi quyết định quyền; nút chỉ chuyển màn khi hợp lệ. */
function PersonMessageButton({ personId }: { personId: string }) {
  const t = useT();
  const navigate = useNavigate();
  const openThread = useDmOpenThread();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={openThread.isPending}
        onClick={async () => {
          setError(null);
          try {
            const res = await openThread.mutateAsync(personId);
            if (res.ok) {
              void navigate({
                to: "/connect-app/inbox/$threadId",
                params: { threadId: res.threadId },
              });
            } else {
              setError(
                res.error === "not_connected"
                  ? t("bc.mobile.inbox.error.not_connected")
                  : t("bc.mobile.inbox.error.generic"),
              );
            }
          } catch {
            setError(t("bc.mobile.inbox.error.generic"));
          }
        }}
        aria-label={t("bc.mobile.inbox.open")}
        className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] active:scale-[0.99] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <MessageSquare aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
        {t("bc.mobile.inbox.open")}
      </button>
      {error ? (
        <p role="alert" className="text-[12px] text-[var(--bc-mobile-danger,#e5484d)]">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** .vcf export as a first-class contact action — same visual language as
    ActionButton/CardActionLink, but a <button> because it opens the preview
    sheet (an action, not a navigation). */
function VcfActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-2 py-3 text-center transition-colors duration-150 motion-reduce:transition-none"
    >
      <span className="grid place-items-center text-[var(--bc-mobile-accent)]">
        <Share2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <span className="text-[12px] leading-tight text-[var(--bc-mobile-text-2)]">{label}</span>
    </button>
  );
}

const SOCIAL_META: Record<string, { label: string; icon: typeof Linkedin }> = {
  linkedin: { label: "LinkedIn", icon: Linkedin },
  facebook: { label: "Facebook", icon: Facebook },
  zalo: { label: "Zalo", icon: MessageCircle },
  youtube: { label: "YouTube", icon: Youtube },
  tiktok: { label: "TikTok", icon: Music2 },
};

// ── Loaded state ────────────────────────────────────────────────────────────

function PersonLoaded({ person }: { person: BcMobilePersonDetail }) {
  const t = useT();
  const navigate = useNavigate();
  const fmt = useFmt();
  /** Pending .vcf export awaiting human confirmation in the preview sheet. */
  const [vcfPreview, setVcfPreview] = useState<{ vcf: string; filename: string } | null>(null);
  /** True while the confirmed .vcf is being generated/delivered — keeps the
      preview sheet open with its confirm action disabled + loading. */
  const [vcfDelivering, setVcfDelivering] = useState(false);

  /** Deliver the confirmed .vcf, then confirm via toast. The sheet stays open
      in its loading state until the Share Sheet / download resolves, then
      closes. Telemetry emits allowlisted metric names + latency only — never
      the person's name, filename, or vCard content. */
  const deliverVcf = async (pending: { vcf: string; filename: string }) => {
    setVcfDelivering(true);
    const start = Date.now();
    try {
      const result = await shareOrDownloadVcf(pending.vcf, pending.filename);
      if (result === "shared") {
        reportPersonVcfMetric("PERSON_VCF_EXPORTED_SHARED", { latencyMs: Date.now() - start });
        toast.success(t("bc.mobile.person.vcf.shared"));
      } else if (result === "downloaded") {
        reportPersonVcfMetric("PERSON_VCF_EXPORTED_DOWNLOADED", { latencyMs: Date.now() - start });
        toast.success(t("bc.mobile.person.vcf.downloaded"));
      } else {
        // User dismissed the Share Sheet — an intentional choice, no toast.
        reportPersonVcfMetric("PERSON_VCF_EXPORT_CANCELLED");
      }
    } catch {
      reportPersonVcfMetric("PERSON_VCF_EXPORT_FAILED");
      toast.error(t("bc.mobile.person.vcf.error"), {
        action: {
          label: t("bc.mobile.vcf.retry"),
          // One-tap retry: reopen the preview sheet in its loading state and
          // re-deliver exactly the same reviewed file.
          onClick: () => {
            setVcfPreview(pending);
            void deliverVcf(pending);
          },
        },
      });
    } finally {
      setVcfDelivering(false);
      setVcfPreview(null);
    }
  };
  const name = person.displayName ?? t("bc.mobile.network.unknownPerson");
  const titleCompany = [person.headline, person.companyName].filter(Boolean).join(" · ");
  const rel = person.relationship;
  const relNarrative =
    rel.kind === "connected"
      ? rel.connectedAt
        ? t("bc.mobile.network.context.connected", { rel: fmt.rel(rel.connectedAt) })
        : null
      : rel.kind === "guest"
        ? rel.sharedAt
          ? t(
              // BC-Mobile-4B — a scanned paper card states provenance
              // ("Scanned"), never a fabricated "Shared".
              rel.source === "business_card_scan"
                ? "bc.mobile.network.context.scanned"
                : "bc.mobile.network.context.shared",
              { rel: fmt.rel(rel.sharedAt) },
            )
          : null
        : rel.savedAt
          ? t("bc.mobile.network.context.saved", { rel: fmt.rel(rel.savedAt) })
          : null;

  const qc = useQueryClient();
  const [actionBusy, setActionBusy] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const handleDisconnect = async () => {
    setActionBusy(true);
    try {
      const parsed = parseBcMobilePersonId(person.personId);
      let connId = (rel as any).connectionId;
      if (!connId && parsed?.id) {
        const state = await GlobalNetworkSDK.connections.getState(parsed.id);
        connId = state.connectionId;
      }
      if (connId) {
        await GlobalNetworkSDK.mutations.disconnect(connId);
      }
      void qc.invalidateQueries({ queryKey: ["bc-person", person.personId] });
      void qc.invalidateQueries({ queryKey: ["bc-mobile", "person"] });
      void qc.invalidateQueries({ queryKey: ["user-connections"] });
      void qc.invalidateQueries({ queryKey: ["network-requests"] });
      void qc.invalidateQueries({ queryKey: ["network-incoming-requests"] });
      toast.success(`Đã hủy kết nối với ${name}`);
      setDisconnectDialogOpen(false);
    } catch {
      toast.error("Không thể hủy kết nối. Vui lòng thử lại sau.");
    } finally {
      setActionBusy(false);
    }
  };

  const incomingConnectionId =
    rel.kind === "connected" &&
    rel.status === "pending" &&
    rel.direction === "incoming" &&
    rel.connectionId
      ? rel.connectionId
      : null;

  const outgoingPending =
    rel.kind === "connected" && rel.status === "pending" && rel.direction === "outgoing";

  const contact = person.contact;
  // The .vcf export only needs a display name; every other action needs a
  // real, visibility-cleared channel.
  const canExportVcf = person.displayName != null;
  const hasActions =
    canExportVcf ||
    (contact != null &&
      (contact.phoneHref != null ||
        contact.emailHref != null ||
        contact.websiteHref != null ||
        person.primaryCardSlug != null));

  return (
    <main id="bc-mobile-person">
      {/* Identity hero — avatar left, identity block right (design reference). */}
      <section className="mt-4 flex items-start gap-4">
        <span className="shrink-0 rounded-full p-[2px] ring-1 ring-[var(--bc-mobile-border-gold)]">
          <PersonAvatar person={person} name={name} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
            {name}
          </h1>
          {person.headline ? (
            <p className="mt-1 text-[15px] font-medium leading-snug text-[var(--bc-mobile-accent)]">
              {person.headline}
            </p>
          ) : null}
          {person.companyName ? (
            <p className="mt-0.5 text-[15px] leading-snug text-[var(--bc-mobile-text)]">
              {person.companyName}
            </p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {relNarrative ? (
              <span className="inline-flex items-center rounded-full border border-[var(--bc-mobile-border-gold)] px-2.5 py-1 text-[12px] text-[var(--bc-mobile-accent)]">
                {relNarrative}
              </span>
            ) : null}
            {/* Provenance chip — only for people captured by scanning a paper card. */}
            {rel.kind === "guest" && rel.source === "business_card_scan" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-mobile-text-2)]">
                <ScanLine aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t("bc.mobile.person.source.cardOcr")}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Pending Connection Request Bar */}
      {incomingConnectionId ? (
        <section className="mt-5 rounded-2xl border border-amber-200 dark:border-[#D8B282]/80 bg-white dark:bg-gradient-to-br dark:from-[#1C2333] dark:via-[#141A26] dark:to-[#0D111A] p-4.5 text-slate-900 dark:text-white shadow-sm dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(216,178,130,0.15)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#E8C986]">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 dark:bg-[#E8C986] animate-pulse" />
            <span>Lời mời kết nối đang chờ bạn phản hồi</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-[#D1D5DB]">
            <strong className="text-slate-900 dark:text-white">{name}</strong> đã gửi lời mời kết nối danh thiếp thông
            minh với bạn. Bạn có muốn đồng ý kết bạn?
          </p>
          <div className="mt-3.5 flex items-center gap-2.5">
            <button
              type="button"
              disabled={actionBusy}
              onClick={async () => {
                setActionBusy(true);
                try {
                  await GlobalNetworkSDK.mutations.accept(incomingConnectionId);
                  void qc.invalidateQueries({ queryKey: ["bc-person", person.personId] });
                  void qc.invalidateQueries({ queryKey: ["network-incoming-requests"] });
                  void qc.invalidateQueries({ queryKey: ["network-requests"] });
                  void qc.invalidateQueries({ queryKey: ["user-connections"] });
                  toast.success(`Đã kết nối thành công với ${name}!`);
                } catch {
                  toast.error("Không thể hoàn tất kết nối. Vui lòng thử lại.");
                } finally {
                  setActionBusy(false);
                }
              }}
              className="flex-1 py-3 px-4 rounded-full font-bold text-[13.5px] bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              )}
              <span>Đồng ý kết bạn</span>
            </button>

            <button
              type="button"
              disabled={actionBusy}
              onClick={async () => {
                setActionBusy(true);
                try {
                  await GlobalNetworkSDK.mutations.decline(incomingConnectionId);
                  void qc.invalidateQueries({ queryKey: ["bc-person", person.personId] });
                  void qc.invalidateQueries({ queryKey: ["network-incoming-requests"] });
                  void qc.invalidateQueries({ queryKey: ["network-requests"] });
                  toast.info("Đã từ chối lời mời kết nối.");
                } catch {
                  toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
                } finally {
                  setActionBusy(false);
                }
              }}
              className="py-3 px-4 rounded-full font-semibold text-[13px] border border-slate-200 dark:border-white/20 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-[#9CA3AF] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              Từ chối
            </button>
          </div>
        </section>
      ) : outgoingPending ? (
        <section className="mt-5 rounded-2xl border border-amber-300/40 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-3.5 text-center">
          <p className="text-xs font-semibold text-amber-800 dark:text-[#E8C986]">
            ⏳ Lời mời kết nối đã được gửi đi và đang chờ đối phương chấp nhận.
          </p>
        </section>
      ) : (rel as any).kind === "connection" ||
        (rel.kind === "connected" &&
          (rel.status === "none" || (!rel.status && !rel.connectedAt))) ? (
        <section className="mt-5 rounded-2xl border border-amber-200/80 dark:border-[#D8B282]/50 bg-white dark:bg-gradient-to-br dark:from-[#1C2333]/90 dark:via-[#141A26]/90 dark:to-[#0D111A]/90 p-4 text-slate-900 dark:text-white shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#E8C986]">
                Gợi ý kết nối đối tác
              </p>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-200">
                Kết nối để xem đầy đủ danh thiếp thông minh và giao thương cùng {name}.
              </p>
            </div>
            <button
              type="button"
              disabled={actionBusy}
              onClick={async () => {
                const parsed = parseBcMobilePersonId(person.personId);
                if (!parsed || parsed.kind !== "connection") return;
                setActionBusy(true);
                try {
                  await GlobalNetworkSDK.mutations.sendRequest({ targetUserId: parsed.id });
                  void qc.invalidateQueries({ queryKey: ["bc-person", person.personId] });
                  toast.success(`Đã gửi lời mời kết nối tới ${name}!`);
                } catch {
                  toast.error("Không thể gửi lời mời kết nối. Vui lòng thử lại sau.");
                } finally {
                  setActionBusy(false);
                }
              }}
              className="py-2.5 px-4 rounded-full font-bold text-[13px] bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] shadow-md hover:opacity-95 active:scale-98 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Kết nối ngay</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Contact actions — real, visibility-cleared channels, plus the .vcf
          export (built from the same already-cleared DTO). */}
      {hasActions ? (
        <section
          role="group"
          aria-label={t("bc.mobile.person.actions.group")}
          className="mt-6 grid grid-cols-4 gap-2"
        >
          {contact?.phone && contact.phoneHref ? (
            <ActionButton href={contact.phoneHref} label={t("bc.mobile.person.actions.call")}>
              <Phone aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
            </ActionButton>
          ) : null}
          {contact?.email && contact.emailHref ? (
            <ActionButton href={contact.emailHref} label={t("bc.mobile.person.actions.email")}>
              <Mail aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
            </ActionButton>
          ) : null}
          {contact?.websiteHref ? (
            <ActionButton href={contact.websiteHref} label={t("bc.mobile.person.actions.website")}>
              <Globe aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
            </ActionButton>
          ) : null}
          {person.primaryCardSlug ? (
            <CardActionLink
              slug={person.primaryCardSlug}
              label={t("bc.mobile.person.actions.card")}
            />
          ) : null}
          {canExportVcf ? (
            <VcfActionButton
              label={t("bc.mobile.person.actions.vcf")}
              onClick={() => {
                // Opens the preview sheet first so the user can check every
                // exported field, then delivers via the native Share Sheet on
                // iOS/Android (download fallback on desktop). Built client-side
                // from the already-loaded, visibility-cleared DTO; never
                // exposes more than the screen.
                const vcf = buildPersonVCard(person, window.location.origin);
                if (vcf) {
                  reportPersonVcfMetric("PERSON_VCF_PREVIEW_OPENED");
                  setVcfPreview({ vcf, filename: personVcfFilename(person.displayName) });
                }
              }}
            />
          ) : null}
        </section>
      ) : null}

      {/* Moment capture — BC-Mobile-2E (owner-private, explicit action).
          BC-Mobile-3A: a <button> + imperative navigate so the internal
          person id never leaks into a rendered href (privacy boundary). */}
      <section className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() =>
            navigate({ to: "/connect-app/moment/$personId", params: { personId: person.personId } })
          }
          aria-label={t("bc.mobile.person.actions.moment")}
          className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
        >
          <NotebookPen aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
          {t("bc.mobile.person.actions.moment")}
        </button>
        {/* BC-Mobile-8A — nhắn tin nội bộ, CHỈ với kết nối đã chấp nhận
            (personId dạng `u:`). Thẻ đã lưu / liên hệ khách vẫn dùng
            tel:/mailto: vì họ chưa chắc là người dùng hệ thống. */}
        {person.personId.startsWith("u:") ? (
          <PersonMessageButton personId={person.personId} />
        ) : null}
      </section>

      {/* vCard preview — confirm exports exactly what was reviewed. The sheet
          stays open in its loading state until delivery resolves. */}
      {vcfPreview ? (
        <VcfPreviewSheet
          vcf={vcfPreview.vcf}
          filename={vcfPreview.filename}
          confirming={vcfDelivering}
          onClose={() => setVcfPreview(null)}
          onConfirm={() => {
            void deliverVcf(vcfPreview);
          }}
        />
      ) : null}

      {/* BC-Mobile-6A — at most ONE calm suggestion for this person. */}
      <PersonSuggestion personId={person.personId} />

      {/* Contact details — only channels the card actually cleared. */}
      {contact &&
      (contact.email || contact.phone || contact.websiteHref || contact.social.length > 0) ? (
        <section className="mt-6 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4">
          <h2 className="text-[15px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.person.contact.title")}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {contact.email && contact.emailHref ? (
              <li>
                <a
                  href={contact.emailHref}
                  className="flex min-h-11 items-center gap-3 text-[14px] text-[var(--bc-mobile-text)]"
                >
                  <Mail
                    aria-hidden="true"
                    className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-accent)]"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">{contact.email}</span>
                </a>
              </li>
            ) : null}
            {contact.phone && contact.phoneHref ? (
              <li>
                <a
                  href={contact.phoneHref}
                  className="flex min-h-11 items-center gap-3 text-[14px] text-[var(--bc-mobile-text)]"
                >
                  <Phone
                    aria-hidden="true"
                    className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-accent)]"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">{contact.phone}</span>
                </a>
              </li>
            ) : null}
            {contact.websiteHref ? (
              <li>
                <a
                  href={contact.websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 text-[14px] text-[var(--bc-mobile-text)]"
                >
                  <Globe
                    aria-hidden="true"
                    className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-accent)]"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">
                    {contact.websiteHref.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              </li>
            ) : null}
            {contact.social.map((s) => {
              const meta = SOCIAL_META[s.type];
              const Icon = meta?.icon ?? Globe;
              const label = meta?.label ?? s.type;
              return (
                <li key={s.type}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-3 text-[14px] text-[var(--bc-mobile-text)]"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-accent)]"
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Interaction history — canonical read-only timeline. */}
      <section className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4">
        <h2 className="text-[15px] font-semibold text-[var(--bc-mobile-text)]">
          {t("bc.mobile.person.history.title")}
        </h2>
        <PersonJourney personId={person.personId} />
      </section>

      {/* Relationship memory — owner-private notes. */}
      <section className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4">
        <PersonNotes personId={person.personId} />
      </section>

      {/* Relationship narrative (dates + provenance). */}
      <section className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.person.relationship.title")}
        </h2>
        <ul className="mt-3 space-y-2">
          {rel.kind === "connected" ? (
            <>
              {rel.connectedAt ? (
                <li className="text-[14px] text-[var(--bc-mobile-text)]">
                  {t("bc.mobile.person.relationship.connectedOn", {
                    date: fmt.date(rel.connectedAt),
                  })}
                </li>
              ) : null}
              {rel.requestedByViewer != null ? (
                <li className="text-[13px] text-[var(--bc-mobile-text-2)]">
                  {rel.requestedByViewer
                    ? t("bc.mobile.person.relationship.invitedByYou")
                    : t("bc.mobile.person.relationship.invitedByThem")}
                </li>
              ) : null}
            </>
          ) : rel.kind === "guest" ? (
            rel.sharedAt ? (
              <li className="text-[14px] text-[var(--bc-mobile-text)]">
                {t(
                  rel.source === "business_card_scan"
                    ? "bc.mobile.person.relationship.scannedOn"
                    : "bc.mobile.person.relationship.sharedOn",
                  { date: fmt.date(rel.sharedAt) },
                )}
              </li>
            ) : null
          ) : (
            <>
              {rel.savedAt ? (
                <li className="text-[14px] text-[var(--bc-mobile-text)]">
                  {t("bc.mobile.person.relationship.savedOn", { date: fmt.date(rel.savedAt) })}
                </li>
              ) : null}
              {rel.favorite ? (
                <li className="text-[13px] text-[var(--bc-mobile-text-2)]">
                  {t("bc.mobile.person.relationship.favorite")}
                </li>
              ) : null}
            </>
          )}
        </ul>
      </section>

      {/* Hủy kết nối (Unfriend / Disconnect) */}
      {rel.kind === "connected" && (rel.status === "accepted" || rel.connectedAt) ? (
        <section className="mt-8 pt-4 border-t border-[var(--bc-mobile-border)] flex flex-col items-center">
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => setDisconnectDialogOpen(true)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 text-[13px] font-medium text-rose-400 hover:bg-rose-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            <span>Hủy kết nối</span>
          </button>

          <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
            <AlertDialogContent className="max-w-[360px] rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[17px] font-bold text-[var(--bc-mobile-text)]">
                  Xác nhận hủy kết nối?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] text-[var(--bc-mobile-muted)] leading-relaxed">
                  Bạn có chắc chắn muốn hủy kết nối với{" "}
                  <strong className="text-[var(--bc-mobile-text)]">{name}</strong>? Sau khi hủy,
                  người này sẽ không còn trong danh bạ kết nối trực tiếp của bạn.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 flex gap-2">
                <AlertDialogCancel
                  disabled={actionBusy}
                  className="flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[13px]"
                >
                  Giữ lại
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={actionBusy}
                  onClick={handleDisconnect}
                  className="flex-1 rounded-full bg-rose-500 text-white font-semibold text-[13px] hover:bg-rose-600 cursor-pointer"
                >
                  {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hủy kết nối"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      ) : null}
    </main>
  );
}

// ── Loading / error / unavailable ───────────────────────────────────────────

function PersonSkeleton() {
  const t = useT();
  return (
    <div aria-busy="true" className="mt-8 flex flex-col items-center">
      <span className="sr-only">{t("bc.mobile.person.loading")}</span>
      <div
        aria-hidden="true"
        className="h-22 w-22 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="mt-4 h-5 w-40 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="mt-2.5 h-3.5 w-56 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
      />
      <div aria-hidden="true" className="mt-8 h-px w-full bg-[var(--bc-mobile-border)]" />
      <div
        aria-hidden="true"
        className="mt-4 h-3.5 w-64 animate-pulse self-start rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
      />
    </div>
  );
}

function PersonError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <section className="mt-20 flex flex-col items-center px-2 text-center">
      <h1 className="text-[16px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.person.error.title")}
      </h1>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        {t("bc.mobile.network.retry")}
      </button>
    </section>
  );
}

function PersonUnavailable() {
  const t = useT();
  return (
    <section className="mt-20 flex flex-col items-center px-2 text-center">
      <span
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
      >
        <UserRound className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-[16px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.person.unavailable.title")}
      </h1>
      <p className="mx-auto mt-2 max-w-[32ch] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.person.unavailable.body")}
      </p>
      <Link
        to="/connect-app/network"
        className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        {t("bc.mobile.person.unavailable.back")}
      </Link>
    </section>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

/** BC-Mobile-2E — post-save confirmation (role="status", non-blocking). */
function MomentSavedBanner() {
  const t = useT();
  return (
    <div
      role="status"
      className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-accent-soft)] bg-[var(--bc-mobile-surface-2)] px-4 py-3"
    >
      <NotebookPen
        aria-hidden="true"
        className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-navy)]"
        strokeWidth={1.8}
      />
      <p className="text-[13.5px] text-[var(--bc-mobile-text)]">
        {t("bc.mobile.moment.savedBanner")}
      </p>
    </div>
  );
}

export function PersonDetail({
  personId,
  momentSaved = false,
}: {
  personId: string;
  momentSaved?: boolean;
}) {
  const navigate = useNavigate();
  const { status, person, retry } = useBusinessConnectPerson(personId);

  return (
    <MobilePage>
      <BusinessConnectTopBar back onBack={() => navigate({ to: "/connect-app/network" })} />
      {momentSaved && status === "ok" ? <MomentSavedBanner /> : null}
      {status === "loading" ? (
        <PersonSkeleton />
      ) : status === "error" ? (
        <PersonError onRetry={retry} />
      ) : status === "unavailable" || !person ? (
        <PersonUnavailable />
      ) : (
        <PersonLoaded person={person} />
      )}
    </MobilePage>
  );
}
