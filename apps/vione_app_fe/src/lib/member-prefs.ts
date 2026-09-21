/**
 * Client-side member list preferences (favorites, pinned, recently viewed,
 * saved filters). Persisted in localStorage — no backend involved. All getters
 * are SSR-safe (return empty on the server).
 */

const FAV_KEY = "vba.members.favorites";
const PIN_KEY = "vba.members.pinned";
const RECENT_KEY = "vba.members.recent";
const SAVED_FILTERS_KEY = "vba.members.savedFilters";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new Event("member-prefs-changed"));
  } catch {
    /* ignore */
  }
}

export function getFavorites(): string[] {
  return read(FAV_KEY);
}
export function getPinned(): string[] {
  return read(PIN_KEY);
}
export function getRecent(): string[] {
  return read(RECENT_KEY);
}

export function toggleFavorite(id: string): string[] {
  const cur = read(FAV_KEY);
  const next = cur.includes(id) ? cur.filter((x: any) => x !== id) : [...cur, id];
  write(FAV_KEY, next);
  return next;
}

export function togglePinned(id: string): string[] {
  const cur = read(PIN_KEY);
  const next = cur.includes(id) ? cur.filter((x: any) => x !== id) : [id, ...cur].slice(0, 12);
  write(PIN_KEY, next);
  return next;
}

/** Record a viewed member — most-recent-first, capped at 12. */
export function pushRecent(id: string) {
  const cur = read(RECENT_KEY).filter((x: any) => x !== id);
  write(RECENT_KEY, [id, ...cur].slice(0, 12));
}

export type SavedFilter = {
  id: string;
  name: string;
  q: string;
  industry: string;
  region: string;
  type: string;
  status: string;
};

export function getSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    return raw ? (JSON.parse(raw) as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

export function saveFilter(f: SavedFilter): SavedFilter[] {
  const cur = getSavedFilters().filter((x: any) => x.id !== f.id);
  const next = [...cur, f].slice(-12);
  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("member-prefs-changed"));
  } catch {
    /* ignore */
  }
  return next;
}

export function deleteSavedFilter(id: string): SavedFilter[] {
  const next = getSavedFilters().filter((x: any) => x.id !== id);
  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("member-prefs-changed"));
  } catch {
    /* ignore */
  }
  return next;
}
