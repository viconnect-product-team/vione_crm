import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { Attendee } from "@/lib/checkin-data";

export function SearchBox({
  attendees,
  onPick,
}: {
  attendees: Attendee[];
  onPick: (a: Attendee) => void;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const results = q.trim()
    ? attendees.filter((a: any) =>
        [a.name, a.company, a.phone].some((f) => f.toLowerCase().includes(q.toLowerCase())),
      )
    : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("checkin.search")}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{t("checkin.searchHint")}</p>

      {results.length > 0 && (
        <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
          {results.map((a: any) => (
            <button
              key={a.id}
              onClick={() => {
                onPick(a);
                setQ("");
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition hover:border-border hover:bg-muted"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {a.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{a.company}</div>
              </div>
              <UserPlus className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
