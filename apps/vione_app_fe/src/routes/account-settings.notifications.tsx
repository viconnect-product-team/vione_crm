// BC-8.1 Turn C §E §F §L §Q — Notification Preferences UI.
//
// Recipient-scoped preferences editor. Provider posture (§L §Q):
// email/push channels render as available toggles but are labeled "not
// available yet" — the runtime records unsupported dispatches with
// unavailable_provider (see BC-8.1 Turn B) so preferences remain forward-
// compatible when providers are activated later.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader } from "@/components/dashboard/PageKit";
import { useT, type TKey } from "@/lib/i18n";
import {
  NOTIFICATION_CHANNEL_AVAILABILITY,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useUpdateNotificationOverride,
  useClearNotificationOverride,
} from "@/hooks/use-bc-notifications";
import {
  NOTIFICATION_DIGEST_MODES,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  NOTIFICATION_KINDS,
  type NotificationDigestMode,
  type NotificationPreferencesDTO,
  type NotificationKind,
  type NotificationPreferenceOverrideDTO,
  type NotificationPreferenceCategory,
} from "@/lib/business-connect/notification-orchestration/types";
import { categoryForKind } from "@/lib/business-connect/notification-orchestration/preference-policy";

export const Route = createFileRoute("/account-settings/notifications")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Notification preferences — Account settings" }],
  }),
  component: NotificationPreferencesPage,
});

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-border"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${label}-hint` : undefined}
      />
      <div className="min-w-0">
        <div className="text-sm text-foreground">{label}</div>
        {hint ? (
          <div id={`${label}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KindOverrideRow({
  kind,
  override,
}: {
  kind: NotificationKind;
  override: NotificationPreferenceOverrideDTO | undefined;
}) {
  const t = useT();
  const upsert = useUpdateNotificationOverride();
  const clear = useClearNotificationOverride();
  const inApp = override?.inAppEnabled ?? null;
  const opts: Array<{ v: boolean | null; label: string }> = [
    { v: null, label: t("bc.notif.prefs.overrideUse") },
    { v: true, label: t("bc.notif.prefs.overrideOn") },
    { v: false, label: t("bc.notif.prefs.overrideOff") },
  ];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-foreground truncate">{kind}</span>
      <div className="flex items-center gap-1" role="group" aria-label={kind}>
        {opts.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={inApp === o.v}
            className={[
              "rounded-md border px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              inApp === o.v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            ].join(" ")}
            disabled={upsert.isPending || clear.isPending}
            onClick={() => {
              if (o.v === null) {
                clear.mutate({ notificationKind: kind });
              } else {
                upsert.mutate({ notificationKind: kind, inAppEnabled: o.v });
              }
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationPreferencesPage() {
  const t = useT();
  const q = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const [draft, setDraft] = useState<Partial<NotificationPreferencesDTO> | null>(null);
  useEffect(() => {
    if (q.data && draft === null) setDraft({});
  }, [q.data, draft]);

  const value = useMemo<NotificationPreferencesDTO | null>(() => {
    if (!q.data) return null;
    return { ...q.data.preferences, ...(draft ?? {}) };
  }, [q.data, draft]);

  const overridesByKind = useMemo(() => {
    const m = new Map<NotificationKind, NotificationPreferenceOverrideDTO>();
    for (const o of q.data?.overrides ?? []) m.set(o.notificationKind, o);
    return m;
  }, [q.data]);

  const kindsByCategory = useMemo(() => {
    const m = new Map<NotificationPreferenceCategory, NotificationKind[]>();
    for (const k of NOTIFICATION_KINDS) {
      const cat = categoryForKind(k);
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(k);
    }
    return m;
  }, []);

  if (q.isLoading || !value) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-3xl px-4 py-6">
          <PageHeader title={t("bc.notif.prefs.title")} subtitle={t("bc.notif.prefs.subtitle")} />
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {t("bc.notif.prefs.loading")}
          </p>
        </main>
      </AppShell>
    );
  }

  if (q.isError) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-3xl px-4 py-6">
          <PageHeader title={t("bc.notif.prefs.title")} subtitle={t("bc.notif.prefs.subtitle")} />
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {t("bc.notif.prefs.error")}
          </div>
        </main>
      </AppShell>
    );
  }

  const invalidQuiet =
    (value.quietHoursStart !== null && !HHMM_RE.test(value.quietHoursStart)) ||
    (value.quietHoursEnd !== null && !HHMM_RE.test(value.quietHoursEnd));
  const invalidDigestTime = !HHMM_RE.test(value.digestTime);

  const setField = <K extends keyof NotificationPreferencesDTO>(
    k: K,
    v: NotificationPreferencesDTO[K],
  ) => {
    setDraft((d) => ({ ...(d ?? {}), [k]: v }));
  };

  const save = () => {
    if (!draft || Object.keys(draft).length === 0) return;
    update.mutate(draft, {
      onSuccess: () => {
        setDraft({});
        toast.success(t("bc.notif.prefs.saved"));
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <PageHeader title={t("bc.notif.prefs.title")} subtitle={t("bc.notif.prefs.subtitle")} />

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <Toggle
            label={t("bc.notif.prefs.global")}
            checked={value.globalEnabled}
            onChange={(v) => setField("globalEnabled", v)}
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t("bc.notif.prefs.channels")}</h2>
          <Toggle
            label={t("bc.notif.prefs.channel.in_app")}
            checked={value.inAppEnabled}
            onChange={(v) => setField("inAppEnabled", v)}
          />
          <Toggle
            label={`${t("bc.notif.prefs.channel.email")} · ${t("bc.notif.prefs.channelUnavailable")}`}
            hint={
              NOTIFICATION_CHANNEL_AVAILABILITY.email === "unavailable"
                ? t("bc.notif.prefs.channelUnavailableHint")
                : undefined
            }
            checked={value.emailEnabled}
            onChange={(v) => setField("emailEnabled", v)}
          />
          <Toggle
            label={`${t("bc.notif.prefs.channel.push")} · ${t("bc.notif.prefs.channelUnavailable")}`}
            hint={
              NOTIFICATION_CHANNEL_AVAILABILITY.push === "unavailable"
                ? t("bc.notif.prefs.channelUnavailableHint")
                : undefined
            }
            checked={value.pushEnabled}
            onChange={(v) => setField("pushEnabled", v)}
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-4 grid gap-3 sm:grid-cols-2">
          <Field label={t("bc.notif.prefs.digest")}>
            <select
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={value.digestMode}
              onChange={(e) => setField("digestMode", e.target.value as NotificationDigestMode)}
            >
              {NOTIFICATION_DIGEST_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`bc.notif.prefs.digest.${m}` as TKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("bc.notif.prefs.digestTime")}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="HH:mm"
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={value.digestTime}
              onChange={(e) => setField("digestTime", e.target.value)}
              aria-invalid={invalidDigestTime}
            />
            {invalidDigestTime ? (
              <span className="text-xs text-destructive">{t("bc.notif.prefs.invalidTime")}</span>
            ) : null}
          </Field>
          <Field label={t("bc.notif.prefs.timezone")}>
            <input
              type="text"
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={value.timezone}
              onChange={(e) => setField("timezone", e.target.value)}
              placeholder="Asia/Ho_Chi_Minh"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("bc.notif.prefs.quietHours")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("bc.notif.prefs.quietStart")}>
              <input
                type="text"
                placeholder="HH:mm"
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={value.quietHoursStart ?? ""}
                onChange={(e) => setField("quietHoursStart", e.target.value || null)}
                aria-invalid={
                  value.quietHoursStart !== null && !HHMM_RE.test(value.quietHoursStart)
                }
              />
            </Field>
            <Field label={t("bc.notif.prefs.quietEnd")}>
              <input
                type="text"
                placeholder="HH:mm"
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={value.quietHoursEnd ?? ""}
                onChange={(e) => setField("quietHoursEnd", e.target.value || null)}
                aria-invalid={value.quietHoursEnd !== null && !HHMM_RE.test(value.quietHoursEnd)}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Toggle
              label={t("bc.notif.prefs.criticalBypass")}
              checked={value.criticalBypassQuietHours}
              onChange={(v) => setField("criticalBypassQuietHours", v)}
            />
            <button
              type="button"
              className="ml-auto rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setField("quietHoursStart", null);
                setField("quietHoursEnd", null);
              }}
            >
              {t("bc.notif.prefs.quietClear")}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t("bc.notif.prefs.perKind")}</h2>
          <p className="text-xs text-muted-foreground">{t("bc.notif.prefs.perKindHint")}</p>
          <div className="space-y-4">
            {NOTIFICATION_PREFERENCE_CATEGORIES.map((cat) => (
              <div key={cat}>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`bc.notif.category.${cat}` as TKey)}
                </h3>
                <div className="rounded-md border border-border">
                  {(kindsByCategory.get(cat) ?? []).map((k) => (
                    <div key={k} className="px-3">
                      <KindOverrideRow kind={k} override={overridesByKind.get(k)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setDraft({})}
            disabled={!draft || Object.keys(draft).length === 0}
          >
            {t("bc.notif.prefs.reset")}
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={save}
            disabled={
              update.isPending ||
              !draft ||
              Object.keys(draft).length === 0 ||
              invalidQuiet ||
              invalidDigestTime
            }
          >
            {t("bc.notif.prefs.save")}
          </button>
        </div>
      </main>
    </AppShell>
  );
}
