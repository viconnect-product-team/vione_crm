// BC-Mobile — hook tuỳ chọn thẻ HÔM NAY (cục bộ, tách biệt theo viewer).
import { useCallback, useEffect, useState } from "react";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import {
  DEFAULT_TODAY_PREFERENCES,
  loadTodayPreferences,
  saveTodayPreferences,
  type TodayPreferences,
} from "@/lib/business-connect/mobile/today-preferences";

export function useTodayPreferences() {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "anon";
  const [prefs, setPrefs] = useState<TodayPreferences>(DEFAULT_TODAY_PREFERENCES);

  // Đọc sau khi hydrate để tránh lệch server/client.
  useEffect(() => {
    setPrefs(loadTodayPreferences(viewerKey));
  }, [viewerKey]);

  const update = useCallback(
    (next: TodayPreferences) => {
      setPrefs(next);
      saveTodayPreferences(viewerKey, next);
    },
    [viewerKey],
  );

  const reset = useCallback(() => {
    update({ ...DEFAULT_TODAY_PREFERENCES });
  }, [update]);

  return { prefs, update, reset };
}
