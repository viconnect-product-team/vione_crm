// BC-4.1C — Propose-new-time dialog. Builds a versioned proposal input from
// wall-clock date/time in a chosen IANA timezone (DST-safe via meeting-time).
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import { BUSINESS_MEETING_LOCATION_TYPES } from "@/lib/business-meetings/types";
import type { RescheduleInput } from "@/lib/business-meetings/client-sdk";
import { validateProposedRange, wallClockToUtcIso } from "@/lib/meeting-time";

const BROWSER_TZ =
  typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

export function RescheduleDialog({
  open,
  defaultTimezone,
  busy,
  onSubmit,
  onClose,
}: {
  open: boolean;
  defaultTimezone?: string | null;
  busy?: boolean;
  onSubmit: (input: RescheduleInput) => void;
  onClose: () => void;
}) {
  const t = useT();
  const tz = defaultTimezone || BROWSER_TZ;

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [locationType, setLocationType] = useState("online");
  const [locationText, setLocationText] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [message, setMessage] = useState("");

  const startIso = useMemo(
    () => (date && start ? wallClockToUtcIso(date, start, tz) : null),
    [date, start, tz],
  );
  const endIso = useMemo(
    () => (date && end ? wallClockToUtcIso(date, end, tz) : null),
    [date, end, tz],
  );
  const rangeError = useMemo(() => validateProposedRange(startIso, endIso), [startIso, endIso]);
  const canSubmit = !!date && !!start && !!end && rangeError === null && !busy;

  const handleSubmit = () => {
    if (!canSubmit || !startIso || !endIso) return;
    onSubmit({
      startAt: startIso,
      endAt: endIso,
      timezone: tz,
      locationType: locationType as RescheduleInput["locationType"],
      locationText: locationText || null,
      meetingUrl: meetingUrl || null,
      proposalMessage: message || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("connect.meetings.reschedule.title")}</DialogTitle>
          <DialogDescription>
            {t("connect.meetings.reschedule.tz")}: {tz}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="rs-date">{t("connect.meetings.reschedule.date")}</Label>
            <Input
              id="rs-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rs-start">{t("connect.meetings.reschedule.start")}</Label>
              <Input
                id="rs-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rs-end">{t("connect.meetings.reschedule.end")}</Label>
              <Input id="rs-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rs-loc">{t("connect.meetings.reschedule.locType")}</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger id="rs-loc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_MEETING_LOCATION_TYPES.map((lt) => (
                  <SelectItem key={lt} value={lt}>
                    {t(`connect.meetings.loc.${lt}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {locationType === "online" || locationType === "hybrid" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="rs-url">{t("connect.meetings.reschedule.url")}</Label>
              <Input
                id="rs-url"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="rs-loctext">{t("connect.meetings.reschedule.locText")}</Label>
            <Input
              id="rs-loctext"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rs-msg">{t("connect.meetings.reschedule.message")}</Label>
            <Textarea
              id="rs-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {rangeError && date && start && end ? (
            <p role="alert" className="text-sm text-destructive">
              {t(`connect.meetings.reschedule.${rangeError}` as Parameters<typeof t>[0])}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t("connect.meetings.reschedule.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? t("connect.meetings.action.working") : t("connect.meetings.reschedule.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
