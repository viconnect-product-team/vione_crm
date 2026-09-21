import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface TableControls<T> {
  /** Rows for the current page after sorting. */
  pageRows: T[];
  /** Alias for pageRows for compatibility */
  paged: T[];
  /** Full sorted list (useful for export). */
  sorted: T[];
  sortKey: string | null;
  sortDir: SortDir;
  /** Toggle sorting for a column key. */
  toggleSort: (key: string) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  total: number;
  from: number;
  to: number;
}

/**
 * Reusable client-side pagination + sorting for data tables.
 * `accessors` maps a column key to a comparable value for sorting.
 */
export function useTableControls<T>(
  rows: T[],
  accessors: Record<string, (row: T) => string | number | null | undefined>,
  opts?: { initialPageSize?: number; initialSortKey?: string; initialSortDir?: SortDir },
): TableControls<T> {
  const [sortKey, setSortKey] = useState<string | null>(opts?.initialSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(opts?.initialSortDir ?? "asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(opts?.initialPageSize ?? 20);

  const safeRows = Array.isArray(rows) ? rows : [];

  const sorted = useMemo(() => {
    if (!sortKey || !accessors[sortKey]) return safeRows;
    const acc = accessors[sortKey];
    const copy = [...safeRows];
    copy.sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeRows, sortKey, sortDir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const setPageSize = (n: number) => {
    setPageSizeState(n);
    setPage(1);
  };

  return {
    pageRows,
    paged: pageRows,
    sorted,
    sortKey,
    sortDir,
    toggleSort,
    page: safePage,
    pageCount,
    pageSize,
    setPage,
    setPageSize,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}
