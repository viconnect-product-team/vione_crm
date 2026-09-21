import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLang, useT } from "@/lib/i18n";
import { DEMO_SLOTS, bookDemoSlot, getDemoAvailability } from "@/lib/demo-booking.functions";
import { cn } from "@/lib/utils";

const appIcon = "/app-icon.png";

const demoSearchSchema = z.object({
  email: z.string().email().optional().catch(undefined),
  source: z.string().max(64).optional().catch(undefined),
  intent: z.enum(["schedule"]).optional().catch(undefined),
});

export const Route = createFileRoute("/demo")({
  validateSearch: (s) => demoSearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Đặt lịch demo — Business Connect Platform" },
      {
        name: "description",
        content:
          "Chọn ngày và khung giờ phù hợp để nhận buổi demo 1:1 nền tảng quản lý hiệp hội & kết nối doanh nghiệp.",
      },
      { property: "og:title", content: "Đặt lịch demo — Business Connect Platform" },
      {
        property: "og:description",
        content: "Đặt lịch demo 1:1 nền tảng số quản lý hiệp hội và kết nối doanh nghiệp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

const SLOTS = DEMO_SLOTS;

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
] as const;

function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "Asia/Ho_Chi_Minh";
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
}

/** Slot instant: base slots are Vietnam local time (fixed UTC+7, no DST). */
function slotInstant(dateISO: string, slot: string) {
  return new Date(`${dateISO}T${slot}:00+07:00`);
}

function tzOffsetLabel(tz: string, at: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

function buildDays(count = 12) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d));
  }
  return out;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DemoPage() {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { email: prefEmail, source: ctaSource, intent: ctaIntent } = Route.useSearch();
  const days = useMemo(() => buildDays(), []);
  const [form, setForm] = useState({
    name: "",
    email: prefEmail ?? "",
    organization: "",
    phone: "",
    jobTitle: "",
    notes: "",
  });
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [tz, setTz] = useState<string>("Asia/Ho_Chi_Minh");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    date: string;
    slot: string;
  } | null>(null);

  useEffect(() => {
    setTz(detectTimezone());
  }, []);

  const rangeFrom = days.length > 0 ? toISODate(days[0]) : "";
  const rangeTo = days.length > 0 ? toISODate(days[days.length - 1]) : "";

  useEffect(() => {
    if (!rangeFrom || !rangeTo) return;
    let cancelled = false;
    setLoadingSlots(true);
    getDemoAvailability({ data: { from: rangeFrom, to: rangeTo } })
      .then((res) => {
        if (!cancelled) setTaken(new Set(res.taken));
      })
      .catch((err) => console.error("[demo-availability] failed", err))
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeFrom, rangeTo]);

  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" });
  const longFmt = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: tz,
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });

  const tzOptions = useMemo(() => {
    const set = new Set<string>([...TIMEZONES, tz]);
    return Array.from(set).sort();
  }, [tz]);

  const isTaken = (d: string, s: string) => taken.has(`${d}|${s}`);
  const dayFull = (d: string) => SLOTS.every((s) => isTaken(d, s));

  // Tự chọn ngày trống đầu tiên để khung giờ không bị khoá toàn bộ khi mở trang.
  useEffect(() => {
    if (loadingSlots || date) return;
    const firstOpen = days.map(toISODate).find((iso) => !SLOTS.every((s) => taken.has(`${iso}|${s}`)));
    if (firstOpen) setDate(firstOpen);
  }, [loadingSlots, date, days, taken]);


  const schema = z.object({
    name: z.string().trim().min(1, t("demo.err.name")).max(120),
    email: z.string().trim().email(t("demo.err.email")).max(255),
    organization: z.string().trim().min(1, t("demo.err.org")).max(160),
    phone: z
      .string()
      .trim()
      .max(32)
      .refine((v) => v === "" || /^[+0-9][0-9\s.\-()]{6,}$/.test(v), t("demo.err.phone")),
    jobTitle: z.string().trim().max(120),
    notes: z.string().trim().max(1000),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !errs[k]) errs[k] = issue.message;
      }
    }
    if (!date) errs.date = t("demo.err.date");
    if (!slot) errs.slot = t("demo.err.slot");
    if (Object.keys(errs).length > 0 || !parsed.success) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await bookDemoSlot({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          organization: parsed.data.organization,
          phone: parsed.data.phone || undefined,
          jobTitle: parsed.data.jobTitle || undefined,
          notes: parsed.data.notes || undefined,
          date,
          slot: slot as (typeof SLOTS)[number],
          timezone: tz,
          locale: lang === "vi" ? "vi" : "en",
          ctaSource: ctaSource || undefined,
          ctaIntent: ctaIntent || undefined,
        },
      });
      if (!res.ok) {
        if (res.reason === "slot_taken") {
          setTaken((prev) => new Set(prev).add(`${date}|${slot}`));
          setSlot("");
          setErrors({ slot: t("demo.err.slotTaken") });
        } else {
          setErrors({ submit: t("demo.err.submit") });
        }
        return;
      }
      setConfirmation({ reference: res.reference, date: res.date, slot: res.slot });
    } catch (err) {
      console.error("[demo-request] submit failed", err instanceof Error ? err.message : err);
      setErrors({ submit: t("demo.err.submit") });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
  const errClass = "mt-1.5 text-xs text-destructive";

  const done = confirmation !== null;
  const selectedInstant = date && slot ? slotInstant(date, slot) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/landing" className="flex items-center gap-2.5">
            <img
              src={appIcon}
              alt="Business Connect"
              className="h-9 w-9 rounded-xl"
              width={36}
              height={36}
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Business Connect
            </span>
          </Link>
          <LangSwitcher variant="overlay" />
          <ThemeSwitcher variant="overlay" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-16">
        {done ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              {t("demo.success.schedule.title")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("demo.success.instant")} {t("demo.success.schedule.desc")}
            </p>
            {confirmation && (
              <>
                <p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {longFmt.format(slotInstant(confirmation.date, confirmation.slot))} ·{" "}
                  {timeFmt.format(slotInstant(confirmation.date, confirmation.slot))} ({tz}
                  {tzOffsetLabel(tz, slotInstant(confirmation.date, confirmation.slot))
                    ? ` · ${tzOffsetLabel(tz, slotInstant(confirmation.date, confirmation.slot))}`
                    : ""}
                  )
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("demo.slot.vnTime")}: {confirmation.slot} (GMT+7)
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("demo.success.ref")}:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {confirmation.reference}
                  </span>
                </p>
              </>
            )}

            <div>
              <button
                type="button"
                onClick={() => navigate({ to: "/landing" })}
                className="mt-7 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                <ArrowLeft className="h-4 w-4" /> {t("demo.back")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
            <aside className="lg:pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("demo.schedule.badge")}
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {t("demo.schedule.title")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("demo.schedule.subtitle")}
              </p>

              <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" /> {t("demo.side.title")}
                </p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {[
                    { icon: Users, key: "demo.side.b1" as const },
                    { icon: Sparkles, key: "demo.side.b2" as const },
                    { icon: ShieldCheck, key: "demo.side.b3" as const },
                  ].map(({ icon: Icon, key }) => (
                    <li key={key} className="flex gap-2.5">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  {t("demo.side.note")}
                </p>
              </div>

              <Link
                to="/landing"
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> {t("demo.back")}
              </Link>
            </aside>

            <form className="min-w-0 space-y-6" onSubmit={onSubmit} noValidate>
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="text-lg font-semibold text-foreground">{t("demo.step.info")}</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-name" className={labelClass}>
                      {t("demo.field.name")}
                    </label>
                    <input
                      id="demo-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t("demo.field.name.ph")}
                      maxLength={120}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "demo-name-err" : undefined}
                      className={fieldClass}
                    />
                    {errors.name && (
                      <p id="demo-name-err" className={errClass}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="demo-email" className={labelClass}>
                      {t("demo.field.email")}
                    </label>
                    <input
                      id="demo-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder={t("demo.field.email.ph")}
                      maxLength={255}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "demo-email-err" : undefined}
                      className={fieldClass}
                    />
                    {errors.email && (
                      <p id="demo-email-err" className={errClass}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="demo-phone" className={labelClass}>
                      {t("demo.field.phone")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("demo.field.optional")})
                      </span>
                    </label>
                    <input
                      id="demo-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder={t("demo.field.phone.ph")}
                      maxLength={32}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "demo-phone-err" : undefined}
                      className={fieldClass}
                    />
                    {errors.phone && (
                      <p id="demo-phone-err" className={errClass}>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="demo-role" className={labelClass}>
                      {t("demo.field.role")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("demo.field.optional")})
                      </span>
                    </label>
                    <input
                      id="demo-role"
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                      placeholder={t("demo.field.role.ph")}
                      maxLength={120}
                      className={fieldClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="demo-org" className={labelClass}>
                      {t("demo.field.org")}
                    </label>
                    <input
                      id="demo-org"
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                      placeholder={t("demo.field.org.ph")}
                      maxLength={160}
                      aria-invalid={!!errors.organization}
                      aria-describedby={errors.organization ? "demo-org-err" : undefined}
                      className={fieldClass}
                    />
                    {errors.organization && (
                      <p id="demo-org-err" className={errClass}>
                        {errors.organization}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="demo-notes" className={labelClass}>
                      {t("demo.field.notes")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("demo.field.optional")})
                      </span>
                    </label>
                    <textarea
                      id="demo-notes"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder={t("demo.field.notes.ph")}
                      maxLength={1000}
                      className={cn(fieldClass, "resize-y")}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="text-lg font-semibold text-foreground">{t("demo.step.time")}</h2>

                <div className="mt-5">
                  <label htmlFor="demo-tz" className={labelClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-primary" /> {t("demo.tz.label")}
                    </span>
                  </label>
                  <select
                    id="demo-tz"
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                    className={fieldClass}
                  >
                    {tzOptions.map((z) => (
                      <option key={z} value={z}>
                        {z.replace(/_/g, " ")} ({tzOffsetLabel(z, new Date())})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("demo.tz.hint")}</p>
                </div>

                <fieldset className="mt-6">
                  <legend className={labelClass}>{t("demo.time.date")}</legend>
                  <div
                    role="radiogroup"
                    aria-label={t("demo.time.date")}
                    className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1"
                  >

                    {days.map((d) => {
                      const iso = toISODate(d);
                      const active = iso === date;
                      const full = !loadingSlots && dayFull(iso);
                      return (
                        <button
                          key={iso}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={full}
                          onClick={() => {
                            setDate(iso);
                            setSlot("");
                            setErrors((e) => ({ ...e, date: "", slot: "" }));
                          }}
                          className={cn(
                            "min-h-11 min-w-[76px] shrink-0 snap-start rounded-xl border px-3 py-2 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted/50",
                          )}
                        >
                          <span className="block text-[11px] uppercase tracking-wide opacity-80">
                            {dayFmt.format(d)}
                          </span>
                          <span className="block text-sm font-semibold">{dateFmt.format(d)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.date && <p className={errClass}>{errors.date}</p>}
                </fieldset>

                <fieldset className="mt-6">
                  <legend className={labelClass}>{t("demo.time.slot")}</legend>
                  {loadingSlots ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("demo.slot.loading")}
                    </p>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-label={t("demo.time.slot")}
                      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
                    >
                      {SLOTS.map((s) => {
                        const active = s === slot;
                        const instant = slotInstant(date || toISODate(days[0]), s);
                        const busy = !!date && isTaken(date, s);
                        return (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!date || busy}
                            title={busy ? t("demo.slot.taken") : undefined}
                            onClick={() => {
                              setSlot(s);
                              setErrors((e) => ({ ...e, slot: "" }));
                            }}
                            className={cn(
                              "min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted/50",
                              busy && "line-through",
                            )}
                          >
                            <span className="block">{timeFmt.format(instant)}</span>
                            <span className="block text-[11px] opacity-70">{s} GMT+7</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!loadingSlots && date && dayFull(date) && (
                    <p className={errClass}>{t("demo.slot.none")}</p>
                  )}
                  {errors.slot && <p className={errClass}>{errors.slot}</p>}
                </fieldset>

                {selectedInstant && (
                  <p
                    aria-live="polite"
                    className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground"
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <span className="text-muted-foreground">{t("demo.time.selected")}: </span>
                      {longFmt.format(selectedInstant)} · {timeFmt.format(selectedInstant)} ({tz})
                      <span className="text-muted-foreground"> · {slot} GMT+7</span>
                    </span>
                  </p>
                )}
              </section>

              {errors.submit && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.submit}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-56"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("demo.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> {t("demo.submit.schedule")}
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
