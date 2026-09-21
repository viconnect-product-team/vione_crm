// BC-3.1C — Shared renderer for a Global Business Networking section.
// Presentation only: consumes the hook layer, renders rows + contextual actions
// per section, and wires state/empty/error UI. All strings are i18n keys.
// BC-3.1F — adds abuse controls (report + block) per row.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { ReportUserDialog } from "@/components/connect/ReportUserDialog";
import { useT, type TKey } from "@/lib/i18n";
import {
  useNetworkMutations,
  useNetworkSection,
  type NetworkRow,
  type NetworkSection as Section,
} from "@/hooks/use-global-network";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function Avatar({ row }: { row: NetworkRow }) {
  const url = row.counterpart?.avatarUrl ?? null;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
    >
      <UserRound className="h-5 w-5" />
    </span>
  );
}

export function NetworkSectionView({ section }: { section: Section }) {
  const t = useT();
  const { rows, loading, refreshing, error, reload, removeRow } = useNetworkSection(section);
  const m = useNetworkMutations(removeRow);
  const [reportTarget, setReportTarget] = useState<NetworkRow | null>(null);

  const emptyTitle: TKey = `connect.network.empty.${section}.title` as TKey;
  const emptyDesc: TKey = `connect.network.empty.${section}.desc` as TKey;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {refreshing ? t("connect.network.refreshing") : null}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("connect.network.refresh")}
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => void reload()} />
      ) : rows.length === 0 ? (
        <EmptyState title={t(emptyTitle)} description={t(emptyDesc)} />
      ) : (
        <ul
          className="flex flex-col gap-3"
          aria-label={t("connect.network.listLabel")}
          aria-busy={refreshing}
        >
          {rows.map((row) => (
            <RowItem
              key={row.id}
              row={row}
              section={section}
              busy={m.busyId === row.id}
              onAccept={() => void m.accept(row.id)}
              onDecline={() => void m.decline(row.id)}
              onCancel={() => void m.cancel(row.id)}
              onReport={() => setReportTarget(row)}
              onBlock={() => {
                if (window.confirm(t("connect.network.confirmBlock"))) {
                  void m.block(row.id, row.counterpartUserId);
                }
              }}
              onDisconnect={() => {
                if (window.confirm(t("connect.network.confirmDisconnect"))) {
                  void m.disconnect(row.id);
                }
              }}
            />
          ))}
        </ul>
      )}

      <ReportUserDialog
        open={reportTarget != null}
        onOpenChange={(o) => !o && setReportTarget(null)}
        targetUserId={reportTarget?.counterpartUserId ?? null}
        connectionId={reportTarget?.id ?? null}
      />
    </section>
  );
}

function RowItem({
  row,
  section,
  busy,
  onAccept,
  onDecline,
  onCancel,
  onDisconnect,
  onReport,
  onBlock,
}: {
  row: NetworkRow;
  section: Section;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const t = useT();
  const name = row.counterpart?.displayName ?? t("connect.network.unknownUser");
  const headline = row.counterpart?.headline ?? null;
  const company = row.counterpart?.companyName ?? null;
  const slug = row.counterpart?.primaryCardSlug ?? null;
  const dateLine =
    section === "connections"
      ? t("connect.network.since", { date: formatDate(row.respondedAt ?? row.createdAt) })
      : t("connect.network.requestedOn", { date: formatDate(row.requestedAt) });

  return (
    <li className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <Avatar row={row} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{name}</p>
        {headline ? <p className="truncate text-sm text-muted-foreground">{headline}</p> : null}
        {company ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {company}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">{dateLine}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {slug ? (
          <Link
            to="/b/$slug"
            params={{ slug }}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("connect.network.viewProfile")}
          </Link>
        ) : null}

        {busy ? (
          <span className="inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("connect.network.action.processing")}
          </span>
        ) : section === "incoming" ? (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("connect.network.action.accept")}
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("connect.network.action.decline")}
            </button>
          </>
        ) : section === "sent" ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("connect.network.action.cancel")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("connect.network.action.disconnect")}
          </button>
        )}

        {!busy ? (
          <>
            <button
              type="button"
              onClick={onReport}
              aria-label={t("connect.network.report.action")}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {t("connect.network.report.action")}
            </button>
            <button
              type="button"
              onClick={onBlock}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("connect.network.action.block")}
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}
