import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * Sync a single piece of UI state to the URL search params so filters,
 * search text, sort and page are preserved on reload and shareable via link.
 *
 * Works on routes without a `validateSearch` (the default identity validator
 * passes unknown params through). State is stored as a string; pass a parser
 * to read typed values.
 */
export function useUrlState<T extends string = string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const raw = search[key];
  const value = (raw == null || raw === "" ? defaultValue : String(raw)) as T;

  const setValue = useCallback(
    (next: T) => {
      navigate({
        // preserve all other params
        search: ((prev: Record<string, unknown>) => {
          const out = { ...prev };
          if (next == null || next === "" || next === defaultValue) delete out[key];
          else out[key] = next;
          return out;
        }) as never,
        replace: true,
        resetScroll: false,
      } as never);
    },
    [navigate, key, defaultValue],
  );

  return [value, setValue];
}

/** Number-typed convenience wrapper over useUrlState. */
export function useUrlNumber(key: string, defaultValue: number): [number, (value: number) => void] {
  const [raw, setRaw] = useUrlState(key, String(defaultValue));
  const num = Number(raw);
  const value = Number.isFinite(num) ? num : defaultValue;
  return [value, (n: number) => setRaw(String(n))];
}
