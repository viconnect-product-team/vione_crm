/**
 * Client-only "Add to calendar" helper. Generates a minimal RFC 5545 iCalendar
 * file from data already loaded on the page and triggers a download. No backend,
 * no network — safe to call in the browser only.
 */

export type IcsEvent = {
  uid: string;
  title: string;
  start: string; // ISO date/datetime
  location?: string;
  description?: string;
  durationMinutes?: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a Date as a UTC iCalendar timestamp (YYYYMMDDTHHMMSSZ). */
function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape text per iCalendar TEXT rules. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(ev: IcsEvent): string {
  const start = new Date(ev.start);
  const valid = !Number.isNaN(start.getTime());
  const startD = valid ? start : new Date();
  const end = new Date(startD.getTime() + (ev.durationMinutes ?? 120) * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VBA//Events//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${esc(ev.uid)}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(startD)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadIcs(ev: IcsEvent): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^\w-]+/g, "-").slice(0, 60) || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
