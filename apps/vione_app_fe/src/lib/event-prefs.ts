/**
 * Client-side event list preferences (view mode, saved filters). Persisted in
 * localStorage — no backend involved. SSR-safe (return defaults on the server).
 */

const VIEW_KEY = "vba.events.view";
const SAVED_FILTERS_KEY = "vba.events.savedFilters";

export type EventView = "cards" | "calendar" | "table";

export type EventSavedFilter = {
  id: string;
  name: string;
  q: string;
  type: string;
  status: string;
  bucket: string;
};

export function getEventView(): EventView {
  if (typeof window === "undefined") return "cards";
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "calendar" || v === "table" || v === "cards") return v;
    return "cards";
  } catch {
    return "cards";
  }
}

export function setEventView(v: EventView) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* ignore */
  }
}

export function getEventFilters(): EventSavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    return raw ? (JSON.parse(raw) as EventSavedFilter[]) : [];
  } catch {
    return [];
  }
}

export function saveEventFilter(f: EventSavedFilter): EventSavedFilter[] {
  const cur = getEventFilters().filter((x: any) => x.id !== f.id);
  const next = [...cur, f].slice(-12);
  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function deleteEventFilter(id: string): EventSavedFilter[] {
  const next = getEventFilters().filter((x: any) => x.id !== id);
  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
