// BC-7.7 Turn C — Availability preferences UI.
// Working hours, timezone, buffers, notice and default duration. Client-side
// validation mirrors preferences.service; the RPC re-validates.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import {
  useAvailabilityPreferences,
  useUpdateAvailabilityPreferences,
} from "@/lib/meeting/calendar/hooks";
import { calendarErrorTKey } from "@/lib/meeting/calendar/error-i18n";
import type {
  AvailabilityPreferencesDTO,
  IsoWeekday,
  WorkingHourWindow,
} from "@/lib/meeting/calendar/types";

const DAY_KEYS: Record<IsoWeekday, string> = {
  1: "calendar.day.mon",
  2: "calendar.day.tue",
  3: "calendar.day.wed",
  4: "calendar.day.thu",
  5: "calendar.day.fri",
  6: "calendar.day.sat",
  7: "calendar.day.sun",
};

const HM_RE = /^\d{2}:\d{2}$/;

const COMMON_TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

type FormState = {
  timezone: string;
  workingDays: IsoWeekday[];
  workingHours: WorkingHourWindow[];
  minimumNoticeMinutes: number;
  defaultMeetingDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

function toForm(pref: AvailabilityPreferencesDTO | null): FormState {
  const guessed =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  if (!pref) {
    return {
      timezone: guessed || "UTC",
      workingDays: [1, 2, 3, 4, 5],
      workingHours: ([1, 2, 3, 4, 5] as IsoWeekday[]).map((d) => ({
        day: d,
        start: "09:00",
        end: "17:00",
      })),
      minimumNoticeMinutes: 120,
      defaultMeetingDurationMinutes: 30,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 5,
    };
  }
  return {
    timezone: pref.timezone,
    workingDays: pref.workingDays,
    workingHours: pref.workingHours,
    minimumNoticeMinutes: pref.minimumNoticeMinutes,
    defaultMeetingDurationMinutes: pref.defaultMeetingDurationMinutes,
    bufferBeforeMinutes: pref.bufferBeforeMinutes,
    bufferAfterMinutes: pref.bufferAfterMinutes,
  };
}

function hmToMinutes(hm: string): number | null {
  if (!HM_RE.test(hm)) return null;
  const [h, m] = hm.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function CalendarAvailabilitySettings() {
  const t = useT();
  const { data, isLoading } = useAvailabilityPreferences();
  const update = useUpdateAvailabilityPreferences();
  const [form, setForm] = useState<FormState>(() => toForm(null));

  useEffect(() => {
    if (data !== undefined) setForm(toForm(data));
  }, [data]);

  const days = useMemo(() => [1, 2, 3, 4, 5, 6, 7] as IsoWeekday[], []);

  const hoursByDay = useMemo(() => {
    const map = new Map<IsoWeekday, WorkingHourWindow>();
    for (const w of form.workingHours) map.set(w.day, w);
    return map;
  }, [form.workingHours]);

  const setDayEnabled = (day: IsoWeekday, enabled: boolean) => {
    setForm((prev) => {
      const nextDays = enabled
        ? [...new Set([...prev.workingDays, day])].sort()
        : prev.workingDays.filter((d) => d !== day);
      let nextHours = prev.workingHours.filter((w) => w.day !== day);
      if (enabled) {
        const existing = hoursByDay.get(day);
        nextHours = [...nextHours, existing ?? { day, start: "09:00", end: "17:00" }];
      }
      nextHours.sort((a, b) => a.day - b.day);
      return { ...prev, workingDays: nextDays as IsoWeekday[], workingHours: nextHours };
    });
  };

  const setDayHours = (day: IsoWeekday, patch: Partial<WorkingHourWindow>) => {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((w) => (w.day === day ? { ...w, ...patch } : w)),
    }));
  };

  const validate = (): string | null => {
    if (!form.timezone) return "CALENDAR_INVALID_TIMEZONE";
    if (form.workingDays.length === 0) return "calendar.prefs.err.noDays";
    for (const w of form.workingHours) {
      const s = hmToMinutes(w.start);
      const e = hmToMinutes(w.end);
      if (s === null || e === null || s >= e) return "calendar.prefs.err.badRange";
    }
    if (form.defaultMeetingDurationMinutes < 15) return "calendar.prefs.err.shortDuration";
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) {
      toast.error(t(err as Parameters<typeof t>[0]));
      return;
    }
    try {
      await update.mutateAsync({
        timezone: form.timezone,
        workingDays: form.workingDays,
        workingHours: form.workingHours,
        minimumNoticeMinutes: form.minimumNoticeMinutes,
        defaultMeetingDurationMinutes: form.defaultMeetingDurationMinutes,
        bufferBeforeMinutes: form.bufferBeforeMinutes,
        bufferAfterMinutes: form.bufferAfterMinutes,
        expectedVersion: data?.version ?? null,
      });
      toast.success(t("calendar.prefs.saved"));
    } catch (e) {
      const key = calendarErrorTKey(e);
      toast.error(t(key as Parameters<typeof t>[0]));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("calendar.prefs.tz.title")}</CardTitle>
          <CardDescription>{t("calendar.prefs.tz.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="cal-tz" className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("calendar.prefs.tz.label")}
          </Label>
          <Select
            value={form.timezone}
            onValueChange={(v) => setForm((p) => ({ ...p, timezone: v }))}
          >
            <SelectTrigger id="cal-tz" className="mt-1 w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([form.timezone, ...COMMON_TIMEZONES])].map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("calendar.prefs.hours.title")}</CardTitle>
          <CardDescription>{t("calendar.prefs.hours.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {days.map((d) => {
              const enabled = form.workingDays.includes(d);
              const window = hoursByDay.get(d);
              return (
                <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                  <label className="flex min-w-[9rem] items-center gap-2">
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={(v) => setDayEnabled(d, v === true)}
                      aria-label={t(DAY_KEYS[d] as Parameters<typeof t>[0])}
                    />
                    <span className="text-sm font-medium">
                      {t(DAY_KEYS[d] as Parameters<typeof t>[0])}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={window?.start ?? "09:00"}
                      onChange={(e) => setDayHours(d, { start: e.target.value })}
                      disabled={!enabled}
                      className="w-28"
                      aria-label={t("calendar.prefs.hours.start")}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={window?.end ?? "17:00"}
                      onChange={(e) => setDayHours(d, { end: e.target.value })}
                      disabled={!enabled}
                      className="w-28"
                      aria-label={t("calendar.prefs.hours.end")}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("calendar.prefs.rules.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="cal-notice"
            label={t("calendar.prefs.notice.label")}
            hint={t("calendar.prefs.notice.hint")}
            value={form.minimumNoticeMinutes}
            min={0}
            max={10080}
            onChange={(v) => setForm((p) => ({ ...p, minimumNoticeMinutes: v }))}
          />
          <NumberField
            id="cal-duration"
            label={t("calendar.prefs.duration.label")}
            hint={t("calendar.prefs.duration.hint")}
            value={form.defaultMeetingDurationMinutes}
            min={15}
            max={480}
            onChange={(v) => setForm((p) => ({ ...p, defaultMeetingDurationMinutes: v }))}
          />
          <NumberField
            id="cal-buffer-before"
            label={t("calendar.prefs.bufferBefore.label")}
            hint={t("calendar.prefs.buffer.hint")}
            value={form.bufferBeforeMinutes}
            min={0}
            max={240}
            onChange={(v) => setForm((p) => ({ ...p, bufferBeforeMinutes: v }))}
          />
          <NumberField
            id="cal-buffer-after"
            label={t("calendar.prefs.bufferAfter.label")}
            hint={t("calendar.prefs.buffer.hint")}
            value={form.bufferAfterMinutes}
            min={0}
            max={240}
            onChange={(v) => setForm((p) => ({ ...p, bufferAfterMinutes: v }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={update.isPending}>
          {update.isPending ? t("calendar.prefs.saving") : t("calendar.prefs.save")}
        </Button>
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="mt-1 max-w-[10rem]"
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
