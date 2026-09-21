// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, Building2, Search, User } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listMembers, type DirectoryMember } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/members")({
  component: MembersScreen,
});

function MembersScreen() {
  const t = useT();
  const fetchMembers = useServerFn(listMembers);
  const { data: members, loading } = useServerData<DirectoryMember[]>(() => fetchMembers(), []);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.industry.toLowerCase().includes(term) ||
        m.region.toLowerCase().includes(term),
    );
  }, [members, q]);

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.members.title")} back />

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--vba-text-dim)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("m.members.search_placeholder")}
            className="flex-1 bg-transparent text-[13px] text-[var(--vba-text)] outline-none placeholder:text-[var(--vba-text-dim)]"
          />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" data-testid="members-announcement">
        {loading
          ? t("m.members.announce.loading")
          : t("m.members.announce.count", { count: filtered.length })}
      </p>
      <div
        className="mt-3 space-y-2.5 px-4"
        role="list"
        aria-live="polite"
        aria-busy={loading}
        aria-label={t("m.members.title")}
      >
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.members.loading")}
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.members.empty")}
          </p>
        )}
        {filtered.map((m) => (
          <Link
            key={m.code}
            to="/card/$code"
            params={{ code: m.code }}
            role="listitem"
            className="vba-card flex items-center gap-3 p-3 transition hover:border-[var(--vba-gold)]/60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--vba-surface-2)] text-[var(--vba-gold)]">
              {m.type === "individual" ? (
                <User className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                  {m.name}
                </span>
                {m.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--vba-gold)]" />
                )}
              </div>
              <div className="truncate text-[11px] text-[var(--vba-text-muted)]">
                {[m.industry, m.region].filter(Boolean).join(" · ")}
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
              {m.code}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
