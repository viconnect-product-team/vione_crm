import { useEffect, useState } from "react";

const memoryCache = new Map<string, any>();

/**
 * Lightweight client-side fetch for PWA pages with instant in-memory cache (SWR).
 * When cacheKey is provided, returns cached data immediately on mount (loading = false),
 * eliminating layout shifts and flashes when switching tabs.
 */
export function useServerData<T>(fn: () => Promise<T>, fallback: T, cacheKey?: string) {
  const cached = cacheKey ? memoryCache.get(cacheKey) : undefined;
  const [data, setData] = useState<T>(cached !== undefined ? cached : fallback);
  const [loading, setLoading] = useState<boolean>(cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    // If we have cached data, don't set loading to true (stale-while-revalidate)
    if (!cacheKey || !memoryCache.has(cacheKey)) {
      setLoading(true);
    }
    fn()
      .then((d) => {
        if (active) {
          if (cacheKey) {
            memoryCache.set(cacheKey, d);
          }
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return {
    data,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
    invalidate: () => {
      if (cacheKey) memoryCache.delete(cacheKey);
      setTick((t) => t + 1);
    },
  };
}
