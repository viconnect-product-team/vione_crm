// BC-Mobile-7B — Community Opportunity Detail.
// Canonical fields only, plain-text description (safe render), poster
// identity via the whitelist projection (never contact), one primary action:
// Quan tâm (canonical interest). No creation, no AI matching, no contact
// leakage — contact note explains the truthful path.

import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
  NotebookPen,
  Paperclip,
  Tag,
  Trash2,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useFmt, useT } from "@/lib/i18n";
import { useCommunityOpportunityDetail } from "@/hooks/use-community-activity";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import type {
  CommunityInterestLevel,
  CommunityOpportunityFollowUpDTO,
  CommunityOpportunityFollowUpEventDTO,
  CommunityOpportunityAttachmentDTO,
} from "@/lib/business-connect/mobile/community-activity.types";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { uploadFileToNest, NEST_API_URL, fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/hooks/use-bc-notifications";
import type { NotificationDTO } from "@/lib/business-connect/notification-orchestration/types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";
import { ActivityListSkeleton } from "./CommunityEvents";
import { daysLeftLabel, opportunityCategoryLabel } from "./CommunityOpportunities";

/** Các mốc nhắc hẹn liên hệ lại (ngày kể từ hôm nay). */
const FOLLOW_UP_OPTIONS = [
  { days: 7, key: "bc.mobile.community.opportunities.followUp.in7" },
  { days: 14, key: "bc.mobile.community.opportunities.followUp.in14" },
  { days: 30, key: "bc.mobile.community.opportunities.followUp.in30" },
] as const;

/** Thẻ nhắc hẹn liên hệ lại trong luồng cập nhật tiến độ của cơ hội. */
function FollowUpCard({
  followUp,
  pending,
  onDone,
  onCancel,
  onReschedule,
  onProgress,
}: {
  followUp: CommunityOpportunityFollowUpDTO;
  pending: boolean;
  onDone: () => void;
  onCancel: () => void;
  onReschedule: (inDays: number) => void;
  onProgress: (progress: OpportunityProgress) => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const [reschedule, setReschedule] = useState(false);
  const done = followUp.status === "done";
  return (
    <section
      className={`mt-4 rounded-2xl border p-4 ${
        followUp.due && !done
          ? "border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-accent-soft)]"
          : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]"
      }`}
      aria-label={t("bc.mobile.community.opportunities.followUp.title")}
    >
      <div className="flex items-start gap-3">
        <CalendarDays
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-[var(--bc-mobile-accent)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-accent)]">
            {t("bc.mobile.community.opportunities.followUp.title")}
          </p>
          <p className="mt-1 text-[14px] text-[var(--bc-mobile-text)]">
            {done
              ? t("bc.mobile.community.opportunities.followUp.doneState")
              : `${
                  followUp.due
                    ? t("bc.mobile.community.opportunities.followUp.due")
                    : t("bc.mobile.community.opportunities.followUp.upcoming")
                }${followUp.remindAt ? ` · ${fmt.date(followUp.remindAt)}` : ""}`}
          </p>
        </div>
      </div>
      {/* Tiến độ cơ hội — lưu trên chính bản ghi theo dõi của người xem. */}
      <div
        role="group"
        aria-label={t("bc.mobile.community.opportunities.progress.title")}
        className="mt-3 flex flex-wrap gap-2"
      >
        {PROGRESS_OPTIONS.map(({ value, key }) => {
          const active = followUp.progress === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => onProgress(value)}
              className={`min-h-9 rounded-full border px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 ${
                active
                  ? "border-[var(--bc-mobile-border-gold)] text-[var(--bc-mobile-accent)]"
                  : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
              }`}
            >
              {t(key)}
            </button>
          );
        })}
      </div>
      {followUp.note ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
          <span className="font-medium">
            {t("bc.mobile.community.opportunities.progress.noteLabel")}:
          </span>{" "}
          {followUp.note}
        </p>
      ) : null}

      {!done ? (
        <>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onDone}
              className="min-h-11 flex-1 rounded-full bc-cta-gold text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
            >
              {t("bc.mobile.community.opportunities.followUp.markDone")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setReschedule((v) => !v)}
              className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
            >
              {t("bc.mobile.community.opportunities.followUp.reschedule")}
            </button>
          </div>
          {reschedule ? (
            <div
              role="group"
              aria-label={t("bc.mobile.community.opportunities.followUp.choose")}
              className="mt-2 flex gap-2"
            >
              {FOLLOW_UP_OPTIONS.map(({ days, key }) => (
                <button
                  key={days}
                  type="button"
                  disabled={pending}
                  onClick={() => onReschedule(days)}
                  className="min-h-10 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[13px] text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="mt-2 min-h-10 w-full rounded-full text-[13px] font-medium text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
          >
            {t("bc.mobile.community.opportunities.followUp.cancel")}
          </button>
        </>
      ) : null}
      <ProgressTimeline followUp={followUp} />
    </section>
  );
}

/** Timeline tiến độ — chỉ suy ra từ dữ liệu theo dõi canonical của người xem. */
function ProgressTimeline({ followUp }: { followUp: CommunityOpportunityFollowUpDTO }) {
  const t = useT();
  const messaged =
    followUp.progress === "messaged" ||
    followUp.progress === "replied" ||
    followUp.progress === "closed";
  const steps = [
    { key: "bc.mobile.community.opportunities.timeline.note", done: Boolean(followUp.note) },
    { key: "bc.mobile.community.opportunities.timeline.message", done: messaged },
    {
      key: "bc.mobile.community.opportunities.timeline.reminder",
      done: Boolean(followUp.remindAt),
    },
    {
      key: "bc.mobile.community.opportunities.timeline.closed",
      done: followUp.status === "done" || followUp.progress === "closed",
    },
  ] as const;
  return (
    <div
      className="mt-4 border-t border-[var(--bc-mobile-border)] pt-3"
      aria-label={t("bc.mobile.community.opportunities.timeline.title")}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.opportunities.timeline.title")}
      </p>
      <ol className="mt-2 space-y-2">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-start gap-3">
            <span className="relative flex flex-col items-center">
              {step.done ? (
                <CheckCircle2 aria-hidden className="size-4 text-[var(--bc-mobile-accent)]" />
              ) : (
                <Circle aria-hidden className="size-4 text-[var(--bc-mobile-muted)]" />
              )}
              {index < steps.length - 1 ? (
                <span aria-hidden className="mt-0.5 h-4 w-px bg-[var(--bc-mobile-border)]" />
              ) : null}
            </span>
            <span
              className={`text-[13px] leading-4 ${
                step.done
                  ? "font-medium text-[var(--bc-mobile-text)]"
                  : "text-[var(--bc-mobile-muted)]"
              }`}
            >
              {t(step.key)}
              <span className="sr-only">
                {" — "}
                {step.done
                  ? t("bc.mobile.community.opportunities.timeline.doneLabel")
                  : t("bc.mobile.community.opportunities.timeline.pendingLabel")}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Chip chọn mức độ quan tâm — chỉ đổi mức, không tạo bản ghi mới. */
function InterestLevelPicker({
  label,
  value,
  pending,
  onSelect,
}: {
  label: string;
  value: CommunityInterestLevel;
  pending: boolean;
  onSelect: (level: CommunityInterestLevel) => void;
}) {
  const t = useT();
  return (
    <div className="mb-3">
      <p className="text-[13px] text-[var(--bc-mobile-muted)]">{label}</p>
      <div role="group" aria-label={label} className="mt-2 flex gap-2">
        {(["high", "low"] as const).map((level) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={active}
              disabled={pending || active}
              onClick={() => onSelect(level)}
              className={`inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full border px-3 text-[13.5px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-100 motion-reduce:transition-none cursor-pointer ${
                active
                  ? "border-transparent bg-[var(--bc-mobile-accent-grad)] text-black shadow-sm"
                  : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] bg-[var(--bc-mobile-surface-2)]"
              }`}
            >
              {t(`bc.mobile.community.opportunities.level.${level}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tệp & liên kết đính kèm cho cơ hội (own-row). Tệp nằm trong kho riêng tư
 * theo thư mục của chính người dùng; xem lại qua liên kết ký tạm thời.
 */
const ATTACH_MAX_BYTES = 10 * 1024 * 1024;

function NoteAttachments({
  attachments,
  onAdd,
  onRemove,
  busy,
}: {
  attachments: CommunityOpportunityAttachmentDTO[];
  onAdd: (input: {
    kind: "link" | "file";
    title?: string;
    url?: string;
    storagePath?: string;
    mimeType?: string;
    sizeBytes?: number;
  }) => Promise<void>;
  onRemove: (id: string) => void;
  busy: boolean;
}) {
  const t = useT();
  const viewerId = useViewerUserId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = busy || uploading || attachments.length >= 10;

  async function addLink() {
    setError(null);
    const raw = link.trim();
    if (!/^https?:\/\//i.test(raw)) {
      setError(t("bc.mobile.community.opportunities.attach.invalidLink"));
      return;
    }
    try {
      await onAdd({ kind: "link", url: raw, ...(title.trim() ? { title: title.trim() } : {}) });
      setLink("");
      setTitle("");
    } catch {
      setError(t("bc.mobile.community.opportunities.attach.failed"));
    }
  }

  async function uploadFile(file: File) {
    setError(null);
    if (file.size > ATTACH_MAX_BYTES) {
      setError(t("bc.mobile.community.opportunities.attach.tooLarge"));
      return;
    }
    if (!viewerId) return;
    setUploading(true);
    try {
      const minioPath = await uploadFileToNest(file, file.name);
      await onAdd({
        kind: "file",
        storagePath: minioPath,
        title: title.trim() || file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      setTitle("");
    } catch {
      setError(t("bc.mobile.community.opportunities.attach.failed"));
    } finally {
      setUploading(false);
    }
  }

  async function openAttachment(item: CommunityOpportunityAttachmentDTO) {
    setError(null);
    if (item.kind === "link" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!item.storagePath) return;

    if (item.storagePath.startsWith('/upload/') || item.storagePath.startsWith('/uploads/')) {
      const fullUrl = `${NEST_API_URL}/api${item.storagePath}`;
      window.open(fullUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.storagePath.startsWith('http://') || item.storagePath.startsWith('https://')) {
      window.open(item.storagePath, "_blank", "noopener,noreferrer");
      return;
    }

    const fullUrl = `${NEST_API_URL}/api/upload/${item.storagePath}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3">
      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--bc-mobile-text)]">
        <Paperclip className="h-4 w-4 text-[var(--bc-mobile-accent)]" aria-hidden />
        {t("bc.mobile.community.opportunities.attach.title")}
      </h3>
      <p className="mt-1 text-[12.5px] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.opportunities.attach.description")}
      </p>

      <ul className="mt-3 space-y-2">
        {attachments.length === 0 ? (
          <li className="text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.attach.empty")}
          </li>
        ) : (
          attachments.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-2"
            >
              {item.kind === "link" ? (
                <Link2 className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]" aria-hidden />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => void openAttachment(item)}
                className="min-w-0 flex-1 truncate text-left text-[13px] text-[var(--bc-mobile-text)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
              >
                {item.title}
              </button>
              <ExternalLink className="h-3.5 w-3.5 text-[var(--bc-mobile-muted)]" aria-hidden />
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(item.id)}
                aria-label={t("bc.mobile.community.opportunities.attach.remove")}
                className="rounded-full p-1.5 text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))
        )}
      </ul>

      <label htmlFor="bc-opp-attach-title" className="sr-only">
        {t("bc.mobile.community.opportunities.attach.titleLabel")}
      </label>
      <input
        id="bc-opp-attach-title"
        value={title}
        maxLength={160}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("bc.mobile.community.opportunities.attach.titlePlaceholder")}
        className="mt-3 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-bg,var(--bc-mobile-surface))] px-3 py-2 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
      />
      <label htmlFor="bc-opp-attach-link" className="sr-only">
        {t("bc.mobile.community.opportunities.attach.linkLabel")}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="bc-opp-attach-link"
          value={link}
          inputMode="url"
          maxLength={2000}
          onChange={(e) => setLink(e.target.value)}
          placeholder={t("bc.mobile.community.opportunities.attach.linkPlaceholder")}
          className="min-w-0 flex-1 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-bg,var(--bc-mobile-surface))] px-3 py-2 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
        />
        <button
          type="button"
          disabled={disabled || !link.trim()}
          onClick={() => void addLink()}
          className="min-h-10 shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-3 text-[13px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
        >
          {t("bc.mobile.community.opportunities.attach.addLink")}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadFile(file);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] text-[13px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
      >
        <Upload className="h-4 w-4" aria-hidden />
        {uploading
          ? t("bc.mobile.community.opportunities.attach.uploading")
          : t("bc.mobile.community.opportunities.attach.addFile")}
      </button>

      {attachments.length >= 10 ? (
        <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.opportunities.attach.limit")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

/** Modal cập nhật ghi chú cơ hội — lưu vào chính bản ghi theo dõi của người xem. */
function OpportunityNoteSheet({
  open,
  onOpenChange,
  initialNote,
  onSave,
  saving,
  saveError,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  attachmentBusy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNote: string;
  onSave: (note: string) => void;
  saving: boolean;
  saveError: boolean;
  attachments: CommunityOpportunityAttachmentDTO[];
  onAddAttachment: (input: {
    kind: "link" | "file";
    title?: string;
    url?: string;
    storagePath?: string;
    mimeType?: string;
    sizeBytes?: number;
  }) => Promise<void>;
  onRemoveAttachment: (id: string) => void;
  attachmentBusy: boolean;
}) {
  const t = useT();
  const [text, setText] = useState(initialNote);

  useEffect(() => {
    if (open) setText(initialNote);
  }, [open, initialNote]);

  return (
    <Drawer open={open} onOpenChange={(next) => (saving ? undefined : onOpenChange(next))}>
      <DrawerContent className="bc-app mx-auto w-full max-w-[480px] rounded-t-[22px] border border-[#D8B282]/25 bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl shadow-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-[17px] text-[var(--bc-mobile-text)]">
            {t("bc.mobile.community.opportunities.note.title")}
          </DrawerTitle>
          <DrawerDescription className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.note.description")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <label htmlFor="bc-opp-note" className="sr-only">
            {t("bc.mobile.community.opportunities.note.title")}
          </label>
          <textarea
            id="bc-opp-note"
            rows={5}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("bc.mobile.community.opportunities.note.placeholder")}
            className="w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3 py-2 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
          />
          {saveError ? (
            <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.opportunities.message.failed")}
            </p>
          ) : null}

          <NoteAttachments
            attachments={attachments}
            onAdd={onAddAttachment}
            onRemove={onRemoveAttachment}
            busy={attachmentBusy || saving}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving || !text.trim()}
              onClick={() => onSave(text.trim())}
              className="min-h-11 flex-1 rounded-full bc-cta-gold text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
            >
              {saving
                ? t("bc.mobile.community.opportunities.followUp.saving")
                : t("bc.mobile.community.opportunities.note.save")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
            >
              {t("bc.mobile.community.opportunities.note.cancel")}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const PROGRESS_OPTIONS = [
  { value: "planned", key: "bc.mobile.community.opportunities.progress.planned" },
  { value: "messaged", key: "bc.mobile.community.opportunities.progress.messaged" },
  { value: "replied", key: "bc.mobile.community.opportunities.progress.replied" },
  { value: "closed", key: "bc.mobile.community.opportunities.progress.closed" },
] as const;

type OpportunityProgress = (typeof PROGRESS_OPTIONS)[number]["value"];

/** Soạn & gửi tin nhắn ngay tại thẻ gợi ý: gửi qua ứng dụng nhắn tin của thiết
 *  bị (share sheet / sao chép) và lưu tiến độ cơ hội của chính người dùng. */
function MessageComposer({
  title,
  posterName,
  onSave,
  saving,
  saveError,
}: {
  title: string;
  posterName: string | null;
  onSave: (progress: OpportunityProgress, note: string) => void;
  saving: boolean;
  saveError: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [shared, setShared] = useState<"none" | "copied">("none");

  const draft = text.trim();

  async function handSend() {
    const body = draft || t("bc.mobile.community.opportunities.message.placeholder");
    const payload = posterName ? `${posterName} — ${title}\n\n${body}` : `${title}\n\n${body}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text: payload });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(payload);
        setShared("copied");
      }
    } catch {
      /* Người dùng huỷ chia sẻ — vẫn lưu tiến độ để không mất công soạn. */
    }
    onSave("messaged", body);
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-3">
      <div className="flex items-center gap-3">
        <MessageSquare aria-hidden className="size-4 shrink-0 text-[var(--bc-mobile-accent)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
            {t("bc.mobile.community.opportunities.next.message")}
          </span>
          <span className="block text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.next.messageDesc")}
          </span>
        </span>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-9 rounded-full border border-[var(--bc-mobile-border-gold)] px-3 text-[13px] font-medium text-[var(--bc-mobile-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            {t("bc.mobile.community.opportunities.message.open")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-3">
          <label
            htmlFor="bc-opp-message"
            className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
          >
            {t("bc.mobile.community.opportunities.message.label")}
          </label>
          <textarea
            id="bc-opp-message"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={t("bc.mobile.community.opportunities.message.placeholder")}
            className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3 py-2 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          />
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.message.hint")}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handSend()}
              className="min-h-11 flex-1 rounded-full bc-cta-gold text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
            >
              {t("bc.mobile.community.opportunities.message.send")}
            </button>
            <button
              type="button"
              disabled={saving || !draft}
              onClick={() => onSave("planned", draft)}
              className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
            >
              {t("bc.mobile.community.opportunities.message.saveOnly")}
            </button>
          </div>
          {shared === "copied" ? (
            <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.opportunities.message.copied")}
            </p>
          ) : null}
          {saveError ? (
            <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.opportunities.message.failed")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Gợi ý hành động tiếp theo sau khi bỏ quan tâm — chỉ điều hướng tới màn hình
 *  đã có, không tạo dữ liệu hay backend song song. */
function NextStepsPanel({
  communityId,
  onDismiss,
  onSchedule,
  scheduling,
  scheduleError,
  title,
  posterName,
  onSaveProgress,
  savingProgress,
  progressError,
  onOpenNote,
  history,
}: {
  communityId: string;
  onDismiss: () => void;
  onSchedule: (inDays: number) => void;
  scheduling: boolean;
  scheduleError: boolean;
  title: string;
  posterName: string | null;
  onSaveProgress: (progress: OpportunityProgress, note: string) => void;
  savingProgress: boolean;
  progressError: boolean;
  onOpenNote: () => void;
  history: CommunityOpportunityFollowUpEventDTO[];
}) {
  const t = useT();
  const [pickDate, setPickDate] = useState(false);
  const items = [
    {
      to: `/connect-app/community/${communityId}/opportunities`,
      icon: Tag,
      label: t("bc.mobile.community.opportunities.next.browse"),
      desc: t("bc.mobile.community.opportunities.next.browseDesc"),
    },
  ];
  return (
    <section
      className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-4"
      aria-label={t("bc.mobile.community.opportunities.next.title")}
    >
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-accent)]">
        {t("bc.mobile.community.opportunities.next.title")}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.opportunities.next.hint")}
      </p>
      {/* Hẹn liên hệ lại — tạo nhắc hẹn ngay tại chỗ, không rời màn hình. */}
      <div className="mt-3 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-3">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-[var(--bc-mobile-accent)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.community.opportunities.next.followUp")}
            </span>
            <span className="block text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.opportunities.next.followUpDesc")}
            </span>
          </span>
          {!pickDate ? (
            <button
              type="button"
              onClick={() => setPickDate(true)}
              className="min-h-9 rounded-full border border-[var(--bc-mobile-border-gold)] px-3 text-[13px] font-medium text-[var(--bc-mobile-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
            >
              {t("bc.mobile.community.opportunities.followUp.title")}
            </button>
          ) : null}
        </div>
        {pickDate ? (
          <div
            role="group"
            aria-label={t("bc.mobile.community.opportunities.followUp.choose")}
            className="mt-3 flex gap-2"
          >
            {FOLLOW_UP_OPTIONS.map(({ days, key }) => (
              <button
                key={days}
                type="button"
                disabled={scheduling}
                onClick={() => onSchedule(days)}
                className="min-h-10 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[13px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
              >
                {scheduling ? t("bc.mobile.community.opportunities.followUp.saving") : t(key)}
              </button>
            ))}
          </div>
        ) : null}
        {scheduleError ? (
          <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.followUp.failed")}
          </p>
        ) : null}
      </div>

      {/* Cập nhật ghi chú — mở modal ngay tại thẻ gợi ý. */}
      <button
        type="button"
        onClick={onOpenNote}
        className="mt-3 flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-2 text-left transition-colors hover:border-[var(--bc-mobile-border-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <NotebookPen aria-hidden className="size-4 shrink-0 text-[var(--bc-mobile-accent)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
            {t("bc.mobile.community.opportunities.next.note")}
          </span>
          <span className="block truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.opportunities.next.noteDesc")}
          </span>
        </span>
        <ChevronRight aria-hidden className="size-4 text-[var(--bc-mobile-muted)]" />
      </button>

      <MessageComposer
        title={title}
        posterName={posterName}
        onSave={onSaveProgress}
        saving={savingProgress}
        saveError={progressError}
      />

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link
              to={item.to}
              className="flex min-h-[56px] items-center gap-3 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-2 transition-colors hover:border-[var(--bc-mobile-border-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
            >
              <item.icon aria-hidden className="size-4 shrink-0 text-[var(--bc-mobile-accent)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
                  {item.label}
                </span>
                <span className="block truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                  {item.desc}
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 text-[var(--bc-mobile-muted)]" />
            </Link>
          </li>
        ))}
      </ul>
      <FollowUpHistoryTimeline history={history} />

      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 min-h-11 w-full rounded-full border border-[var(--bc-mobile-border)] text-[13.5px] font-medium text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        {t("bc.mobile.community.opportunities.next.dismiss")}
      </button>
    </section>
  );
}

/** Dòng thời gian lịch sử ghi chú / đổi trạng thái của chính người xem. */
const HISTORY_KIND_KEY = {
  note: "bc.mobile.community.opportunities.history.kind.note",
  progress: "bc.mobile.community.opportunities.history.kind.progress",
  scheduled: "bc.mobile.community.opportunities.history.kind.scheduled",
  done: "bc.mobile.community.opportunities.history.kind.done",
  cancelled: "bc.mobile.community.opportunities.history.kind.cancelled",
} as const;

const HISTORY_PROGRESS_KEY = {
  planned: "bc.mobile.community.opportunities.progress.planned",
  messaged: "bc.mobile.community.opportunities.progress.messaged",
  replied: "bc.mobile.community.opportunities.progress.replied",
  closed: "bc.mobile.community.opportunities.progress.closed",
} as const;

function FollowUpHistoryTimeline({ history }: { history: CommunityOpportunityFollowUpEventDTO[] }) {
  const t = useT();
  const fmt = useFmt();
  return (
    <section
      className="mt-4 rounded-xl border border-[var(--bc-mobile-border)] px-3 py-3"
      aria-label={t("bc.mobile.community.opportunities.history.title")}
    >
      <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.opportunities.history.title")}
      </h3>
      {history.length === 0 ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.opportunities.history.empty")}
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {history.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                aria-hidden
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--bc-mobile-accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-[var(--bc-mobile-text)]">
                  {t(HISTORY_KIND_KEY[item.kind])}
                </span>
                <span className="block text-[12px] text-[var(--bc-mobile-muted)]">
                  {fmt.date(item.createdAt)}
                  {item.progress ? ` · ${t(HISTORY_PROGRESS_KEY[item.progress])}` : ""}
                  {item.remindAt ? ` · ${fmt.date(item.remindAt)}` : ""}
                </span>
                {item.note ? (
                  <span className="mt-1 block line-clamp-2 text-[12.5px] leading-relaxed text-[var(--bc-mobile-text)]">
                    {item.note}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CommunityOpportunityDetail({
  communityId,
  opportunityRef,
}: {
  communityId: string;
  opportunityRef: string;
}) {
  const t = useT();
  const fmt = useFmt();
  const {
    detail,
    unavailable,
    initialLoading,
    coreError,
    retry,
    interest,
    withdrawInterest,
    scheduleFollowUp,
    updateFollowUp,
    saveProgress,
    addAttachment,
    removeAttachment,
  } = useCommunityOpportunityDetail(communityId, opportunityRef);
  const opened = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_OPPORTUNITY_OPENED");
  }, []);

  useEffect(() => {
    if (interest.isSuccess) statusRef.current?.focus();
  }, [interest.isSuccess]);

  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const queryClient = useQueryClient();

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedInfo, setClaimedInfo] = useState<any>((detail as any)?.claimedBy || null);

  useEffect(() => {
    if ((detail as any)?.claimedBy) {
      setClaimedInfo((detail as any).claimedBy);
    }
  }, [detail]);

  const handleClaimOpportunity = async () => {
    try {
      setIsClaiming(true);
      const res = await fetchNestApi<any>(
        `/connect-app/community/${communityId}/opportunities/${opportunityRef}/claim`,
        { method: "POST" }
      );
      if (res?.ok) {
        setClaimedInfo(res.claimedBy);
        void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
        void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "home"] });
        queryClient.setQueryData(notificationKeys.unreadCount(), (old: any) => ({ count: (old?.count || 0) + 1 }));
        toast.success("Bạn đã nhận cơ hội thành công! Thông tin đã được đồng bộ trực tiếp về CRM.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Không thể nhận cơ hội, vui lòng thử lại.");
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (withdrawInterest.isSuccess) {
      setConfirmWithdraw(false);
      setShowNextSteps(true);
      statusRef.current?.focus();
    }
  }, [withdrawInterest.isSuccess]);

  // Mức độ quan tâm — ghi nhận và cập nhật ngay lập tức vào thông báo
  const onInterest = (level: CommunityInterestLevel) => {
    setShowNextSteps(false);
    reportCommunityMetric("COMMUNITY_OPPORTUNITY_ACTION_SELECTED");
    interest.mutate(level, {
      onSuccess: () => {
        const notifId = `notif-interest-${Date.now()}`;
        const oppTitle = detail?.opportunity?.title || "Cơ hội kinh doanh";
        const levelText = level === "low" ? "Quan tâm thấp" : "Quan tâm cao";
        const newNotif: NotificationDTO = {
          id: notifId,
          recipientUserId: "current-user",
          sourceDomain: "community" as any,
          sourceRecordId: detail?.opportunity?.id || opportunityRef,
          eventKind: "opportunity_interest_sent" as any,
          notificationKind: "opportunity_interest_sent" as any,
          titleKey: "opportunity_interest_sent",
          bodyKey: `Bạn đã cập nhật mức độ quan tâm sang "${levelText}" cho cơ hội: "${oppTitle}".`,
          safeDisplayData: {
            title: "Cập nhật mức độ quan tâm",
            body: `Đã ghi nhận mức ${levelText.toLowerCase()} đối với cơ hội "${oppTitle}". Hệ thống đã lưu lịch sử tương tác.`,
            badge: levelText,
          } as any,
          action: {
            kind: "route",
            labelKey: "bc.notif.action.view",
            targetRoute: `/connect-app/community/opportunities/${detail?.opportunity?.id || opportunityRef}`,
            targetParams: null,
            targetSearch: null,
            requiresConfirmation: false,
            canonicalCapability: null,
          } as any,
          priority: "normal",
          status: "pending" as any,
          scheduledFor: null,
          deliveredAt: new Date().toISOString(),
          readAt: null,
          archivedAt: null,
          expiredAt: null,
          dedupeKey: `interest-${detail?.opportunity?.id || opportunityRef}-${Date.now()}`,
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as NotificationDTO;

        // 1. Cập nhật ngay unread notification count
        queryClient.setQueryData(notificationKeys.unreadCount(), (old: any) => ({
          count: Math.max(1, (old?.count || 0) + 1),
        }));

        // 2. Cập nhật BusinessConnectHome unread count
        queryClient.setQueriesData({ queryKey: ["bc-mobile", "home"] }, (old: any) => {
          if (!old) return { unreadNotificationCount: 1 };
          return {
            ...old,
            unreadNotificationCount: Math.max(1, (old.unreadNotificationCount || 0) + 1),
          };
        });

        // 3. Thêm thông báo mới vào đầu danh sách menu chuông thông báo
        queryClient.setQueriesData({ queryKey: ["bc", "notifications", "list"] }, (old: any) => {
          if (!old) return { items: [newNotif], nextCursor: null, policyVersion: 1 };
          return {
            ...old,
            items: [newNotif, ...(old.items || [])],
          };
        });

        // 4. Phát event để các thành phần UI phản ứng ngay
        window.dispatchEvent(new CustomEvent("bc:notification-added", { detail: newNotif }));

        if (level === "low") {
          toast.success("Đã chuyển sang mức quan tâm thấp. Đã đẩy thông báo tới chuông hệ thống!");
        } else {
          toast.success("Đã ghi nhận mức quan tâm cao. Đã đẩy thông báo tới chuông hệ thống!");
        }
      },
    });
  };

  const interestErrorKey = interest.isError
    ? interest.error instanceof Error &&
      interest.error.message.includes("community_opportunity_expired")
      ? "bc.mobile.community.opportunities.interestExpired"
      : "bc.mobile.community.opportunities.interestFailed"
    : null;

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.opportunities.title")} />
      <main id="bc-mobile-community-opportunity-detail" className="contents">
        {initialLoading ? (
          <div className="mt-4">
            <ActivityListSkeleton rows={3} />
          </div>
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : unavailable || !detail ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.opportunities.unavailable")}
            </p>
          </section>
        ) : (
          <>
            <header className="mt-5">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
                {detail.opportunity.title}
              </h1>
              <p className="mt-1.5 text-[14px] text-[var(--bc-mobile-muted)]">
                {[
                  opportunityCategoryLabel(detail.opportunity.categoryKey, t),
                  detail.opportunity.organizationLabel,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {detail.opportunity.interested ? (
                  <span className="inline-flex rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--bc-mobile-navy)]">
                    {detail.opportunity.interestLevel === "low"
                      ? t("bc.mobile.community.opportunities.level.low")
                      : t("bc.mobile.community.opportunities.level.high")}
                  </span>
                ) : null}
                {daysLeftLabel(detail.opportunity.daysLeft, t) ? (
                  <span className="text-[12px] text-[var(--bc-mobile-muted)]">
                    {daysLeftLabel(detail.opportunity.daysLeft, t)}
                  </span>
                ) : null}
              </div>
            </header>

            {/* Nhận cơ hội kết nối (Đẩy về CRM) */}
            <div className="mt-4">
              {claimedInfo ? (
                <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-transparent p-4 text-amber-950 dark:text-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-[14.5px] text-amber-900 dark:text-[#F6E1C3]">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-[#D8B282] shrink-0" />
                    <span>Cơ hội đã được tiếp nhận kết nối</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-slate-700 dark:text-amber-200/85 leading-relaxed">
                    {claimedInfo.name ? `Doanh nghiệp tiếp nhận: ${claimedInfo.name}` : "Đã có doanh nghiệp tiếp nhận"}
                    {claimedInfo.company ? ` (${claimedInfo.company})` : ""}
                    {claimedInfo.phone ? ` • Hotline: ${claimedInfo.phone}` : ""}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-black bg-[var(--bc-mobile-accent-grad)] px-3 py-1 rounded-lg w-fit shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Dữ liệu đã tự động đồng bộ về hệ thống CRM</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#D8B282]/30 bg-gradient-to-br from-[#D8B282]/10 to-transparent p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={handleClaimOpportunity}
                    disabled={isClaiming}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--bc-mobile-accent-grad)] px-5 py-3 text-[14.5px] font-bold text-black shadow-lg shadow-[#D8B282]/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-black" />
                    {isClaiming ? "Đang xử lý tiếp nhận..." : "Nhận cơ hội kết nối (Đẩy về CRM)"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-[var(--bc-mobile-muted)]">
                    Sau khi bấm nhận, thông tin doanh nghiệp của bạn sẽ được gửi thẳng đến Web CRM và chủ cơ hội.
                  </p>
                </div>
              )}
            </div>

            {/* Primary action — one clear action only. */}
            <section className="mt-5" aria-label={t("bc.mobile.community.opportunities.interest")}>
              <p ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="sr-only">
                {withdrawInterest.isSuccess
                  ? t("bc.mobile.community.opportunities.withdrawSuccess")
                  : interest.isSuccess
                    ? t("bc.mobile.community.opportunities.interestSuccess")
                    : ""}
              </p>
              {detail.opportunity.interested ? (
                confirmWithdraw ? (
                  <div className="rounded-2xl border border-[var(--bc-mobile-border)] p-4">
                    <p className="text-[13.5px] text-[var(--bc-mobile-text)]">
                      {t("bc.mobile.community.opportunities.withdrawConfirm")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmWithdraw(false)}
                        disabled={withdrawInterest.isPending}
                        className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-text)] disabled:opacity-60"
                      >
                        {t("bc.mobile.community.opportunities.withdrawKeep")}
                      </button>
                      <button
                        type="button"
                        onClick={() => withdrawInterest.mutate()}
                        disabled={withdrawInterest.isPending}
                        className="min-h-11 flex-1 rounded-full bg-[var(--destructive)] text-[14px] font-semibold text-[var(--destructive-foreground)] disabled:opacity-60"
                      >
                        {withdrawInterest.isPending
                          ? t("bc.mobile.community.opportunities.withdrawing")
                          : t("bc.mobile.community.opportunities.withdrawConfirmCta")}
                      </button>
                    </div>
                    {withdrawInterest.isError ? (
                      <p role="alert" className="mt-2 text-[13px] text-[var(--bc-mobile-muted)]">
                        {t("bc.mobile.community.opportunities.withdrawFailed")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <InterestLevelPicker
                      label={t("bc.mobile.community.opportunities.level.current")}
                      value={detail.opportunity.interestLevel ?? "high"}
                      pending={interest.isPending}
                      onSelect={onInterest}
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmWithdraw(true)}
                      className="min-h-11 w-full rounded-2xl border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                    >
                      {t("bc.mobile.community.opportunities.withdrawInterest")}
                    </button>
                  </>
                )
              ) : detail.canExpressInterest ? (
                <>
                  <p className="mb-2 text-[13px] text-[var(--bc-mobile-muted)]">
                    {t("bc.mobile.community.opportunities.level.choose")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onInterest("high")}
                      disabled={interest.isPending}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bc-cta-gold px-4 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] focus-visible:ring-offset-2 disabled:opacity-60 motion-reduce:transition-none"
                    >
                      {interest.isPending
                        ? t("bc.mobile.community.opportunities.sending")
                        : t("bc.mobile.community.opportunities.level.high")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onInterest("low")}
                      disabled={interest.isPending}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[var(--bc-mobile-border)] px-4 text-[15px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                    >
                      {t("bc.mobile.community.opportunities.level.low")}
                    </button>
                  </div>
                  {interestErrorKey ? (
                    <p role="alert" className="mt-2 text-[13px] text-[var(--bc-mobile-muted)]">
                      {t(interestErrorKey)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.opportunities.closedNote")}
                </p>
              )}
            </section>

            {detail.followUp ? (
              <FollowUpCard
                followUp={detail.followUp}
                pending={
                  updateFollowUp.isPending || scheduleFollowUp.isPending || saveProgress.isPending
                }
                onDone={() => updateFollowUp.mutate("done")}
                onCancel={() => updateFollowUp.mutate("cancel")}
                onReschedule={(inDays) => scheduleFollowUp.mutate(inDays)}
                onProgress={(progress) => saveProgress.mutate({ progress })}
              />
            ) : null}

            {showNextSteps && !detail.opportunity.interested ? (
              <NextStepsPanel
                communityId={communityId}
                onDismiss={() => setShowNextSteps(false)}
                onSchedule={(inDays) => scheduleFollowUp.mutate(inDays)}
                scheduling={scheduleFollowUp.isPending}
                scheduleError={scheduleFollowUp.isError}
                title={detail.opportunity.title}
                posterName={detail.poster?.displayName ?? null}
                onSaveProgress={(progress, note) => saveProgress.mutate({ progress, note })}
                savingProgress={saveProgress.isPending}
                progressError={saveProgress.isError}
                onOpenNote={() => setNoteOpen(true)}
                history={detail.followUpHistory}
              />
            ) : null}

            <OpportunityNoteSheet
              open={noteOpen}
              onOpenChange={setNoteOpen}
              initialNote={detail.followUp?.note ?? ""}
              saving={saveProgress.isPending}
              saveError={saveProgress.isError}
              attachments={detail.followUpAttachments}
              attachmentBusy={addAttachment.isPending || removeAttachment.isPending}
              onAddAttachment={async (input) => {
                await addAttachment.mutateAsync(input);
              }}
              onRemoveAttachment={(id) => removeAttachment.mutate(id)}
              onSave={(note) => {
                saveProgress.mutate(
                  { progress: detail.followUp?.progress ?? "planned", note },
                  { onSuccess: () => setNoteOpen(false) },
                );
              }}
            />

            {detail.description ? (
              <section className="mt-7">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.opportunities.description")}
                </h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--bc-mobile-text)]">
                  {detail.description}
                </p>
              </section>
            ) : null}

            <section className="mt-7">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.opportunities.details")}
              </h2>
              <dl className="mt-2 divide-y divide-[var(--bc-mobile-border)] border-y border-[var(--bc-mobile-border)]">
                {detail.regionLabel ? (
                  <DetailRow
                    icon={<Tag className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.opportunities.region")}
                    value={detail.regionLabel}
                  />
                ) : null}
                {detail.industryLabel ? (
                  <DetailRow
                    icon={<Tag className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.opportunities.industry")}
                    value={detail.industryLabel}
                  />
                ) : null}
                {detail.budgetMin !== null || detail.budgetMax !== null ? (
                  <DetailRow
                    icon={<Wallet className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.opportunities.budget")}
                    value={[
                      detail.budgetMin !== null ? fmt.money(detail.budgetMin) : null,
                      detail.budgetMax !== null ? fmt.money(detail.budgetMax) : null,
                    ]
                      .filter(Boolean)
                      .join(" – ")}
                  />
                ) : null}
                <DetailRow
                  icon={<CalendarDays className="h-4.5 w-4.5" strokeWidth={1.6} />}
                  label={t("bc.mobile.community.opportunities.published")}
                  value={fmt.date(detail.opportunity.publishedAt)}
                />
                {detail.opportunity.expiresAt ? (
                  <DetailRow
                    icon={<CalendarDays className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.opportunities.expires")}
                    value={fmt.date(detail.opportunity.expiresAt)}
                  />
                ) : null}
              </dl>
            </section>

            <section className="mt-7">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.opportunities.poster")}
              </h2>
              {detail.poster ? (
                <Link
                  to="/connect-app/community/$communityId/members/$memberRef"
                  params={{ communityId, memberRef: detail.poster.memberRef }}
                  aria-label={`${t("bc.mobile.community.opportunities.viewPoster")}: ${detail.poster.displayName}`}
                  className="mt-2 flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 transition-colors duration-150 hover:bg-[var(--bc-mobile-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface)]"
                  >
                    <UserRound
                      className="h-4.5 w-4.5 text-[var(--bc-mobile-muted)]"
                      strokeWidth={1.6}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                      {detail.poster.displayName}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--bc-mobile-muted)]">
                      {detail.communityName}
                    </span>
                  </span>
                </Link>
              ) : (
                <p className="mt-2 text-[14px] text-[var(--bc-mobile-muted)]">
                  {detail.communityName}
                </p>
              )}
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.opportunities.contactNote")}
              </p>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 py-2.5">
      <span aria-hidden="true" className="shrink-0 text-[var(--bc-mobile-muted)]">
        {icon}
      </span>
      <dt className="w-24 shrink-0 text-[13px] text-[var(--bc-mobile-muted)]">{label}</dt>
      <dd className="min-w-0 flex-1 text-[14px] font-medium text-[var(--bc-mobile-text)]">
        {value}
      </dd>
    </div>
  );
}
