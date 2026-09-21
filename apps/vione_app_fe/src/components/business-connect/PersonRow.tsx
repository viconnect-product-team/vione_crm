// BC-5.1 — Compact person row used across Incoming/Sent/Connected lists.

import { UserRound } from "lucide-react";
import type { CounterpartSummary } from "@/lib/global-network/types";

interface Props {
  counterpart: CounterpartSummary | null | undefined;
  fallbackUserId: string;
  subtitle?: string | null;
}

export function PersonRow({ counterpart, fallbackUserId, subtitle }: Props) {
  const name = counterpart?.displayName?.trim() || fallbackUserId.slice(0, 8);
  const url = counterpart?.avatarUrl ?? null;
  const sub = subtitle ?? counterpart?.headline ?? counterpart?.companyName ?? null;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {url ? (
        <img
          src={url}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
        >
          <UserRound className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}
