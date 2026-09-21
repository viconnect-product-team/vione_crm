// Quản lý lưu trữ sự kiện lịch cá nhân (Persistent Calendar Events Storage)

export type SavedCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  location?: string;
  description?: string;
  organizer?: string;
  isOnline?: boolean;
  savedAt: string;
};

const STORAGE_KEY = "vione_saved_calendar_events";

export function getSavedCalendarEvents(): SavedCalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCalendarEvent(event: Omit<SavedCalendarEvent, "savedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getSavedCalendarEvents();
    if (current.some((e) => e.id === event.id)) return true;
    const next = [
      ...current,
      { ...event, savedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("vione:calendar-updated"));
    return true;
  } catch {
    return false;
  }
}

export function removeSavedCalendarEvent(eventId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedCalendarEvents();
    const next = current.filter((e) => e.id !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("vione:calendar-updated"));
  } catch {}
}

export function isCalendarEventSaved(eventId: string): boolean {
  const current = getSavedCalendarEvents();
  return current.some((e) => e.id === eventId);
}

export function downloadIcsFile(event: {
  id: string;
  title: string;
  startsAt: string;
  location?: string;
  description?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const dt = new Date(event.startsAt);
    const validDt = isNaN(dt.getTime()) ? new Date() : dt;
    const start = validDt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDt = new Date(validDt.getTime() + 3 * 60 * 60 * 1000);
    const end = endDt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ViOne//Connect App//VI",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${event.id}@vione.app`,
      `SUMMARY:${event.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${(event.location || "").replace(/\n/g, " ")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${event.id.slice(0, 8)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("downloadIcsFile error:", err);
  }
}
