// BC-7.7 Turn C — Common availability finder. Organizer-only UI. Queries
// the deterministic engine and lets the organizer batch-select up to 5
// slots to become the next proposal round.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useT, useFmt } from "@/lib/i18n";
import { useCommonAvailability, useCreateTimeProposals } from "@/lib/meeting/calendar/hooks";
import { calendarErrorTKey } from "@/lib/meeting/calendar/error-i18n";
import type { AvailabilitySlotDTO } from "@/lib/meeting/calendar/types";

const MAX_SELECT = 5;

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function CommonAvailabilityFinder({
  meetingId,
  participantUserIds,
  organizerTimezone,
  defaultDurationMinutes,
}: {
  meetingId: string;
  participantUserIds: string[];
  organizerTimezone: string;
  defaultDurationMinutes: number;
}) {
  const t = useT();
  const fmt = useFmt();
  const _t = (iso: string) =>
    new Date(iso).toLocaleTimeString(fmt.locale, { hour: "2-digit", minute: "2-digit" });
  const _dt = (iso: string) => new Date(iso).toLocaleString(fmt.locale);
  const [fromDate, setFromDate] = useState(() => todayIso(0));
  const [toDate, setToDate] = useState(() => todayIso(14));
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes);
  const [submitted, setSubmitted] = useState<null | {
    fromDate: string;
    toDate: string;
    durationMinutes: number;
  }>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const input = useMemo(() => {
    if (!submitted) return null;
    return {
      meetingId,
      participantUserIds,
      organizerTimezone,
      ...submitted,
    };
  }, [meetingId, participantUserIds, organizerTimezone, submitted]);

  const { data: slots, isLoading, isError, error } = useCommonAvailability(input);
  const createProposals = useCreateTimeProposals();

  const onSearch = () => {
    if (fromDate > toDate) {
      toast.error(t("calendar.err.invalidDateRange"));
      return;
    }
    setSelected(new Set());
    setSubmitted({ fromDate, toDate, durationMinutes });
  };

  const toggleSlot = (slot: AvailabilitySlotDTO) => {
    const key = slot.startAt;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_SELECT) next.add(key);
      return next;
    });
  };

  const onPropose = async () => {
    if (!slots || selected.size === 0) return;
    const chosen = slots.filter((s) => selected.has(s.startAt));
    try {
      await createProposals.mutateAsync({
        meetingId,
        proposals: chosen.map((s) => ({
          startAt: s.startAt,
          endAt: s.endAt,
          timezone: s.displayTimezone,
        })),
        clientRequestId: `finder-${meetingId}-${Date.now()}`,
      });
      toast.success(t("calendar.finder.proposed"));
      setSelected(new Set());
    } catch (e) {
      toast.error(t(calendarErrorTKey(e) as Parameters<typeof t>[0]));
    }
  };

  return (
    <section aria-label={t("calendar.finder.title")} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Label
            htmlFor="af-from"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            {t("calendar.finder.from")}
          </Label>
          <Input
            id="af-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="af-to" className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("calendar.finder.to")}
          </Label>
          <Input
            id="af-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="af-dur" className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("calendar.finder.duration")}
          </Label>
          <Input
            id="af-dur"
            type="number"
            min={15}
            max={480}
            step={5}
            value={durationMinutes}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setDurationMinutes(Math.round(n));
            }}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={onSearch} className="w-full">
            {t("calendar.finder.search")}
          </Button>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-lg border">
          {isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <p className="p-3 text-sm text-destructive" role="alert">
              {t(calendarErrorTKey(error) as Parameters<typeof t>[0])}
            </p>
          ) : !slots || slots.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{t("calendar.finder.empty")}</p>
          ) : (
            <>
              <ul className="max-h-72 divide-y overflow-y-auto">
                {slots.map((s) => {
                  const isSel = selected.has(s.startAt);
                  const disabled = !isSel && selected.size >= MAX_SELECT;
                  return (
                    <li key={s.startAt} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleSlot(s)}
                        disabled={disabled}
                        aria-label={fmt.date(s.startAt)}
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-foreground">
                          {fmt.date(s.startAt)} · {_t(s.startAt)}–{_t(s.endAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.displayTimezone} · {s.durationMinutes}′
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t p-3">
                <span className="text-xs text-muted-foreground">
                  {t("calendar.finder.selected", { n: selected.size, max: MAX_SELECT })} ·{" "}
                  {t("calendar.finder.limit")}
                </span>
                <Button
                  size="sm"
                  onClick={onPropose}
                  disabled={selected.size === 0 || createProposals.isPending}
                >
                  {t("calendar.finder.propose")}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
