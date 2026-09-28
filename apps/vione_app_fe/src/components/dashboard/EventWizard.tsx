import { useMemo, useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, QrCode, Ticket, Trash2, X, ImagePlus, Sparkles, MapPin, Users, ShieldCheck, Search, Award, CheckSquare, Square, Building2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  QR_FIELDS,
  type EventItem,
  type QrField,
} from "@/lib/events.functions";
import { fetchNestApi } from "@/lib/api-client";
import { QrCanvas } from "@/components/member/QrCanvas";
import { useT } from "@/lib/i18n";
import { EVENT_TYPE_TEMPLATES, type EventTypeKey } from "@/lib/event-type-templates";

type EventType = EventItem["type"];
type EventStatus = EventItem["status"];

export type MediaMember = {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  avatar?: string;
  department?: string;
};

export type SponsorDraft = {
  name: string;
  logoUrl: string;
  tier: "diamond" | "gold" | "silver" | "bronze" | "companion";
  description: string;
};

type TicketDraft = {
  name: string;
  price: string;
  quantity: string;
  description: string;
};

type Info = {
  name: string;
  date: string;
  location: string;
  capacity: string;
  type: EventType;
  status: EventStatus;
  imageUrl?: string;
};

const emptyTicket = (): TicketDraft => ({ name: "", price: "", quantity: "", description: "" });
const emptySponsor = (): SponsorDraft => ({ name: "", logoUrl: "", tier: "gold", description: "" });

const TYPE_OPTS: EventType[] = ["forum", "workshop", "networking", "training"];
const STATUS_OPTS: EventStatus[] = ["upcoming", "ongoing", "completed", "cancelled"];

export function EventWizard({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (event: EventItem) => void;
}) {
  const t = useT();
  const defaultTpl = EVENT_TYPE_TEMPLATES.forum;

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<Info>({
    name: defaultTpl.name,
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    location: defaultTpl.defaultLocation,
    capacity: defaultTpl.defaultCapacity,
    type: "forum",
    status: "upcoming",
    imageUrl: defaultTpl.bgImage,
  });
  const [tickets, setTickets] = useState<TicketDraft[]>([
    {
      name: defaultTpl.defaultTicketName,
      price: defaultTpl.defaultTicketPrice,
      quantity: defaultTpl.defaultCapacity,
      description: defaultTpl.description,
    },
  ]);
  const [sponsors, setSponsors] = useState<SponsorDraft[]>([]);
  const [qrFields, setQrFields] = useState<QrField[]>(["registration_code"]);
  const [selectedScanners, setSelectedScanners] = useState<MediaMember[]>([]);
  const [mediaMembers, setMediaMembers] = useState<MediaMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Tải danh sách hội viên Ban Truyền thông khi mở Wizard
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoadingMembers(true);
    fetchNestApi<any[]>("/members")
      .then((res) => {
        if (!isMounted) return;
        const membersList = Array.isArray(res) ? res : (res as any)?.items || [];
        // Lọc các hội viên thuộc Ban Truyền thông hoặc liên quan Media
        const mediaList: MediaMember[] = membersList
          .filter((m: any) => {
            const dept = String(m.department || "").toLowerCase();
            const role = String(m.executive_role || m.role || "").toLowerCase();
            return dept.includes("truyền thông") || dept.includes("media") || role.includes("truyền thông");
          })
          .map((m: any) => ({
            id: m.id,
            name: m.name || m.full_name || "Hội viên Ban Truyền thông",
            code: m.code || m.member_code || "",
            phone: m.phone || "",
            avatar: m.avatar || m.avatar_url || "",
            department: m.department || "Ban Truyền thông",
          }));

        if (mediaList.length > 0) {
          setMediaMembers(mediaList);
          // Mặc định chọn tất cả thành viên Ban Truyền thông để thuận tiện soát vé
          setSelectedScanners(mediaList);
        } else if (membersList.length > 0) {
          const fallback = membersList.slice(0, 4).map((m: any) => ({
            id: m.id,
            name: m.name || "Hội viên",
            code: m.code || "",
            phone: m.phone || "",
            avatar: m.avatar || "",
            department: "Ban Truyền thông (Gợi ý)",
          }));
          setMediaMembers(fallback);
          setSelectedScanners(fallback);
        }
      })
      .catch((err) => {
        console.error("[EventWizard] Failed to fetch members:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const reset = () => {
    setStep(0);
    const forumTpl = EVENT_TYPE_TEMPLATES.forum;
    setInfo({
      name: forumTpl.name,
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      location: forumTpl.defaultLocation,
      capacity: forumTpl.defaultCapacity,
      type: "forum",
      status: "upcoming",
      imageUrl: forumTpl.bgImage,
    });
    setTickets([
      {
        name: forumTpl.defaultTicketName,
        price: forumTpl.defaultTicketPrice,
        quantity: forumTpl.defaultCapacity,
        description: forumTpl.description,
      },
    ]);
    setSponsors([]);
    setQrFields(["registration_code"]);
    setSelectedScanners(mediaMembers);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const qrSample = useMemo(() => {
    const parts: string[] = [];
    if (qrFields.includes("registration_code")) parts.push("REG-XXXXXX");
    if (qrFields.includes("verify_url")) parts.push(`${originSafe()}/verify?c=REG-XXXXXX`);
    if (qrFields.includes("ticket_code")) parts.push(tickets[0]?.name.trim() || "TK-STANDARD");
    return parts.join("|") || "REG-XXXXXX";
  }, [qrFields, tickets]);

  if (!open) return null;

  const validateInfo = () => {
    if (!info.name.trim()) {
      toast.error(t("ewz.err.name"));
      return false;
    }
    if (!info.date.trim()) {
      toast.error(t("ewz.err.date"));
      return false;
    }
    return true;
  };

  const validateTickets = () => {
    if (tickets.some((tk) => !tk.name.trim())) {
      toast.error(t("ewz.err.ticketName"));
      return false;
    }
    return true;
  };

  const next = () => {
    if (step === 0 && !validateInfo()) return;
    if (step === 1 && !validateTickets()) return;
    setStep((s) => (s + 1) as 0 | 1 | 2);
  };

  const back = () => setStep((s) => (s - 1) as 0 | 1 | 2);

  const toggleQr = (f: QrField) => {
    setQrFields((prev) => (prev.includes(f) ? prev.filter((x: any) => x !== f) : [...prev, f]));
  };

  const submit = async () => {
    if (!validateInfo() || !validateTickets()) return;
    if (qrFields.length === 0) {
      toast.error(t("ewz.err.qr"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchNestApi<{ event: EventItem }>("/events", {
        method: "POST",
        body: JSON.stringify({
          name: info.name.trim(),
          date: info.date,
          location: info.location.trim(),
          capacity: Number(info.capacity) || 0,
          type: info.type,
          status: info.status,
          imageUrl: info.imageUrl,
          qrFields,
          qrScanners: selectedScanners,
          sponsors: sponsors.filter((s) => s.name.trim()),
          tickets: tickets.map((tk) => ({
            name: tk.name.trim(),
            price: Number(tk.price) || 0,
            quantity: Number(tk.quantity) || 0,
            description: tk.description.trim(),
          })),
        }),
      });
      toast.success(t("ewz.created"));
      reset();
      onCreated(res?.event || (res as unknown as EventItem));
    } catch (err: any) {
      console.error("[EventWizard] Create error:", err);
      toast.error(err?.message || t("ewz.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [t("ewz.step.info"), t("ewz.step.tickets"), t("ewz.step.qr")];
  const announcement = submitting
    ? t("ewz.announce.submitting")
    : t("ewz.announce.step", { n: step + 1, total: 3, label: steps[step] });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("ewz.title")}
      aria-busy={submitting}
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <p className="sr-only" role="status" aria-live="polite" data-testid="ewz-announcement">
        {announcement}
      </p>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="border-b border-border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t("ewz.title")}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("ewz.cancel")}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ol
            className="flex items-center gap-2"
            aria-label={t("ewz.step.of", { n: step + 1, total: 3 })}
          >
            {steps.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`truncate text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && <InfoStep info={info} setInfo={setInfo} />}
          {step === 1 && (
            <TicketStep
              tickets={tickets}
              setTickets={setTickets}
              sponsors={sponsors}
              setSponsors={setSponsors}
            />
          )}
          {step === 2 && (
            <QrStep
              qrFields={qrFields}
              toggleQr={toggleQr}
              sample={qrSample}
              mediaMembers={mediaMembers}
              selectedScanners={selectedScanners}
              setSelectedScanners={setSelectedScanners}
              loadingMembers={loadingMembers}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={step === 0 ? close : back}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {step === 0 ? (
              t("ewz.cancel")
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t("ewz.back")}
              </>
            )}
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("ewz.next")} <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {submitting ? t("ewz.creating") : t("ewz.create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function originSafe() {
  return typeof window !== "undefined" ? window.location.origin : "https://app";
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

function InfoStep({ info, setInfo }: { info: Info; setInfo: (v: Info) => void }) {
  const t = useT();
  const currentTpl = EVENT_TYPE_TEMPLATES[info.type as EventTypeKey] || EVENT_TYPE_TEMPLATES.forum;

  const handleSelectType = (newType: EventTypeKey) => {
    const tpl = EVENT_TYPE_TEMPLATES[newType];
    setInfo({
      ...info,
      type: newType,
      name: tpl.name,
      location: tpl.defaultLocation,
      capacity: tpl.defaultCapacity,
      imageUrl: tpl.bgImage,
    });
    toast.info(`Đã áp dụng bố cục nội dung & banner: ${tpl.label}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("ewz.info.heading")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.info.hint")}</p>
      </div>

      {/* Event Type Grid Selector (Requirement 2: chọn loại sự kiện -> tự động hiện text & banner đúng) */}
      <div>
        <label className={labelCls}>
          Chọn loại sự kiện (Tự động áp dụng bố cục nội dung & banner đặc thù)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["forum", "workshop", "networking", "training"] as EventTypeKey[]).map((key) => {
            const tpl = EVENT_TYPE_TEMPLATES[key];
            const isSelected = info.type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectType(key)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-xs font-bold text-foreground line-clamp-1">{tpl.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
                  {tpl.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Custom Banner Preview */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls}>Bố cục Banner xem trước theo loại sự kiện</label>
          <button
            type="button"
            onClick={() => handleSelectType(info.type as EventTypeKey)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Khôi phục nội dung mẫu
          </button>
        </div>
        <div
          className="relative overflow-hidden rounded-2xl p-4 shadow-md text-white min-h-[160px] flex flex-col justify-between border border-white/15"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${info.imageUrl || currentTpl.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: currentTpl.badgeBg, color: currentTpl.badgeText }}
            >
              {currentTpl.badge}
            </span>
            <span className="text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
              CLB CEO 1983
            </span>
          </div>

          {/* Headline Title & Tagline */}
          <div className="my-2">
            <h4 className="text-sm sm:text-base font-extrabold uppercase leading-tight tracking-tight drop-shadow-md text-white line-clamp-2">
              {info.name || currentTpl.name}
            </h4>
            <p className="mt-1 text-xs font-semibold drop-shadow-sm line-clamp-1" style={{ color: currentTpl.accentColor }}>
              {currentTpl.tagline}
            </p>
          </div>

          {/* Bottom Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/20 text-[10.5px] text-white/90">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="line-clamp-1 max-w-[220px]">{info.location || currentTpl.defaultLocation}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span>📅 {info.date || "2026-09-25"}</span>
              <span>👥 {info.capacity || currentTpl.defaultCapacity} khách</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div>
        <label className={labelCls} htmlFor="ewz-name">
          {t("ewz.field.name")}
        </label>
        <input
          id="ewz-name"
          className={inputCls}
          value={info.name}
          onChange={(e) => setInfo({ ...info, name: e.target.value })}
        />
      </div>

      {/* Event Banner / Photo Upload */}
      <div>
        <label className={labelCls}>Ảnh nền Banner sự kiện</label>
        {info.imageUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img
              src={info.imageUrl}
              alt="Banner sự kiện"
              className="h-28 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setInfo({ ...info, imageUrl: "" })}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
              aria-label="Xoá ảnh"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-3 hover:border-primary/60 hover:bg-muted/30 transition">
            <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs font-semibold text-foreground">Tải ảnh sự kiện lên</span>
            <span className="text-[10px] text-muted-foreground">PNG, JPG hoặc WEBP</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    setInfo({ ...info, imageUrl: reader.result });
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="ewz-date">
            {t("ewz.field.date")}
          </label>
          <input
            id="ewz-date"
            type="date"
            className={inputCls}
            value={info.date}
            onChange={(e) => setInfo({ ...info, date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="ewz-capacity">
            {t("ewz.field.capacity")}
          </label>
          <input
            id="ewz-capacity"
            type="number"
            min={0}
            className={inputCls}
            value={info.capacity}
            onChange={(e) => setInfo({ ...info, capacity: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="ewz-location">
          {t("ewz.field.location")}
        </label>
        <input
          id="ewz-location"
          className={inputCls}
          value={info.location}
          onChange={(e) => setInfo({ ...info, location: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="ewz-type">
            {t("ewz.field.type")}
          </label>
          <select
            id="ewz-type"
            className={inputCls}
            value={info.type}
            onChange={(e) => handleSelectType(e.target.value as EventTypeKey)}
          >
            {TYPE_OPTS.map((o) => (
              <option key={o} value={o}>
                {t(`events.type.${o}` as never)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="ewz-status">
            {t("ewz.field.status")}
          </label>
          <select
            id="ewz-status"
            className={inputCls}
            value={info.status}
            onChange={(e) => setInfo({ ...info, status: e.target.value as EventStatus })}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o} value={o}>
                {t(`events.status.${o}` as never)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function TicketStep({
  tickets,
  setTickets,
  sponsors,
  setSponsors,
}: {
  tickets: TicketDraft[];
  setTickets: (v: TicketDraft[]) => void;
  sponsors: SponsorDraft[];
  setSponsors: (v: SponsorDraft[]) => void;
}) {
  const t = useT();
  const updateTicket = (i: number, patch: Partial<TicketDraft>) =>
    setTickets(tickets.map((tk, idx) => (idx === i ? { ...tk, ...patch } : tk)));
  const removeTicket = (i: number) => setTickets(tickets.filter((_, idx) => idx !== i));

  const updateSponsor = (i: number, patch: Partial<SponsorDraft>) =>
    setSponsors(sponsors.map((sp, idx) => (idx === i ? { ...sp, ...patch } : sp)));
  const removeSponsor = (i: number) => setSponsors(sponsors.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      {/* Phần 1: Các loại vé */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Ticket className="h-4 w-4 text-primary" aria-hidden="true" /> {t("ewz.tickets.heading")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.tickets.hint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setTickets([...tickets, emptyTicket()])}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5 text-primary" /> Thêm loại vé
          </button>
        </div>

        {tickets.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            {t("ewz.tickets.empty")}
          </p>
        )}

        <div className="space-y-3">
          {tickets.map((tk, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <input
                  className={`${inputCls} font-medium`}
                  placeholder={t("ewz.tickets.namePh")}
                  aria-label={t("ewz.tickets.name")}
                  value={tk.name}
                  onChange={(e) => updateTicket(i, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeTicket(i)}
                  aria-label={t("ewz.tickets.remove")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>{t("ewz.tickets.price")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={tk.price}
                    onChange={(e) => updateTicket(i, { price: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("ewz.tickets.qty")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={tk.quantity}
                    onChange={(e) => updateTicket(i, { quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className={labelCls}>{t("ewz.tickets.desc")}</label>
                <input
                  className={inputCls}
                  value={tk.description}
                  onChange={(e) => updateTicket(i, { description: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phần 2: Nhà tài trợ sự kiện */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Award className="h-4 w-4 text-amber-500" aria-hidden="true" /> Nhà tài trợ sự kiện
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Vinh danh các đơn vị, cá nhân tài trợ cho sự kiện</p>
          </div>
          <button
            type="button"
            onClick={() => setSponsors([...sponsors, emptySponsor()])}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" /> Thêm tài trợ
          </button>
        </div>

        {sponsors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Chưa có nhà tài trợ nào được thêm vào sự kiện này.</p>
            <button
              type="button"
              onClick={() => setSponsors([...sponsors, emptySponsor()])}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              + Bấm vào đây để thêm nhà tài trợ đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsors.map((sp, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      className={`${inputCls} font-medium flex-1`}
                      placeholder="Tên doanh nghiệp / Nhà tài trợ..."
                      value={sp.name}
                      onChange={(e) => updateSponsor(i, { name: e.target.value })}
                    />
                  </div>
                  <select
                    className="h-10 rounded-lg border border-border bg-background px-2.5 text-xs font-medium"
                    value={sp.tier}
                    onChange={(e) => updateSponsor(i, { tier: e.target.value as any })}
                  >
                    <option value="diamond">💎 Kim Cương</option>
                    <option value="gold">🥇 Vàng</option>
                    <option value="silver">🥈 Bạc</option>
                    <option value="bronze">🥉 Đồng</option>
                    <option value="companion">🤝 Đồng Hành</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSponsor(i)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Logo URL</label>
                    <input
                      className={inputCls}
                      placeholder="https://..."
                      value={sp.logoUrl}
                      onChange={(e) => updateSponsor(i, { logoUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Ghi chú / Quyền lợi</label>
                    <input
                      className={inputCls}
                      placeholder="Quyền lợi gian hàng, phát biểu..."
                      value={sp.description}
                      onChange={(e) => updateSponsor(i, { description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QrStep({
  qrFields,
  toggleQr,
  sample,
  mediaMembers,
  selectedScanners,
  setSelectedScanners,
  loadingMembers,
}: {
  qrFields: QrField[];
  toggleQr: (f: QrField) => void;
  sample: string;
  mediaMembers: MediaMember[];
  selectedScanners: MediaMember[];
  setSelectedScanners: React.Dispatch<React.SetStateAction<MediaMember[]>>;
  loadingMembers: boolean;
}) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return mediaMembers;
    const q = search.toLowerCase();
    return mediaMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(q))
    );
  }, [mediaMembers, search]);

  const toggleScanner = (member: MediaMember) => {
    const isSelected = selectedScanners.some((s) => s.id === member.id);
    if (isSelected) {
      setSelectedScanners(selectedScanners.filter((s) => s.id !== member.id));
    } else {
      setSelectedScanners([...selectedScanners, member]);
    }
  };

  const selectAll = () => {
    setSelectedScanners(mediaMembers);
  };

  const clearAll = () => {
    setSelectedScanners([]);
  };

  return (
    <div className="space-y-6">
      {/* Multi-Select: Ban Truyền thông quét mã QR */}
      <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Người có quyền quét mã QR (Ban Truyền thông)
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chỉ các nhân sự được chọn mới có quyền dùng app để check-in và quét vé sự kiện này.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Đã chọn: {selectedScanners.length}
            </span>
          </div>
        </div>

        {/* Action bar: Search + Select All */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã thành viên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Bỏ chọn
          </button>
        </div>

        {/* Member cards grid */}
        {loadingMembers ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Đang tải danh sách thành viên Ban Truyền thông...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            {search ? "Không tìm thấy thành viên phù hợp" : "Chưa có thành viên nào thuộc Ban Truyền thông"}
          </div>
        ) : (
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {filteredMembers.map((member) => {
              const isSelected = selectedScanners.some((s) => s.id === member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => toggleScanner(member)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition select-none ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-primary/20 text-xs font-bold text-primary">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{member.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {member.code && <span className="font-mono">{member.code}</span>}
                      {member.phone && <span>• {member.phone}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Truyền thông
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cấu hình trường nhúng mã QR */}
      <div className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <QrCode className="h-4 w-4 text-primary" aria-hidden="true" /> {t("ewz.qr.heading")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.qr.hint")}</p>
        </div>

        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {QR_FIELDS.map((f) => {
            const checked = qrFields.includes(f);
            return (
              <label
                key={f}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition ${
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 accent-[var(--primary)]"
                  checked={checked}
                  onChange={() => toggleQr(f)}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">
                    {t(`ewz.qr.${f}` as never)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t(`ewz.qr.${f}.desc` as never)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("ewz.qr.preview")}</p>
          <div className="flex items-center gap-4">
            <QrCanvas value={sample} size={100} />
            <div className="min-w-0">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("ewz.qr.previewHint")}
              </p>
              <code className="block break-all rounded-md bg-background px-2 py-1 text-[11px] text-foreground">
                {sample}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
