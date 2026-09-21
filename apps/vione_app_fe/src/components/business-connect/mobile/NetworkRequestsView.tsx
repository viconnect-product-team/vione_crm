import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CircleCheck, Loader2, RefreshCw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useFmt, useT } from "@/lib/i18n";
import { useIncomingConnectionRequests } from "@/hooks/use-network-requests";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import { resolveMediaUrl } from "@/lib/api-client";
import { BusinessConnectTopBar } from "./BusinessConnectTopBar";

function initialsOf(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "…";
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function NetworkRequestsView() {
  const t = useT();
  const fmt = useFmt();
  const [actionStates, setActionStates] = useState<Record<string, "accepted" | "declined">>({});
  const { requests, initialLoading, coreError, retry, accept, decline, busy } =
    useIncomingConnectionRequests();

  const fail = () => toast.error(t("bc.mobile.connection.error"));

  return (
    <>
      <BusinessConnectTopBar />
      <main id="bc-mobile-network-requests" className="contents">
        <div className="mt-2">
          <Link
            to="/connect-app/network"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg pr-3 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.network.requests.back")}
          </Link>
        </div>

        <h1 className="mt-1 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.network.requests.title")}
        </h1>

        {initialLoading ? (
          <div
            role="status"
            aria-label={t("bc.mobile.network.requests.loading")}
            aria-busy="true"
            className="mt-4"
          >
            <div className="divide-y divide-[var(--bc-mobile-border)]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex min-h-[76px] items-center gap-3.5 py-3.5">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                  <div className="flex-1">
                    <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                    <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : coreError ? (
          <div role="alert" className="mt-16 flex flex-col items-center px-2 text-center">
            <p className="text-[15px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.network.requests.error")}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              {t("bc.mobile.network.retry")}
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-16 flex flex-col items-center px-2 pb-4 text-center">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
            >
              <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="mt-4 text-[16px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.network.requests.empty.title")}
            </p>
            <p className="mx-auto mt-2 max-w-[30ch] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.network.requests.empty.body")}
            </p>
          </div>
        ) : (
          <ul
            aria-label={t("bc.mobile.network.requests.title")}
            aria-busy={busy}
            className="mt-2 divide-y divide-[var(--bc-mobile-border)]"
          >
            {requests.map((req) => {
              const name = req.counterpart?.displayName ?? t("bc.mobile.network.unknownPerson");
              const context = [req.counterpart?.headline, req.counterpart?.companyName]
                .filter(Boolean)
                .join(" · ");
              const status = actionStates[req.connectionId];

              return (
                <li key={req.connectionId} className="py-4">
                  {req.counterpart?.userId ? (
                    <Link
                      to="/connect-app/network/$personId"
                      params={{ personId: `u:${req.counterpart.userId}` }}
                      className="flex items-center gap-3.5 group cursor-pointer"
                    >
                      {(() => {
                        const avatarUrl = resolveMediaUrl(req.counterpart?.avatarUrl);
                        return avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)] group-hover:ring-[var(--bc-mobile-accent)] transition-all"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[15px] font-semibold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors"
                          >
                            {initialsOf(req.counterpart?.displayName ?? null)}
                          </span>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors">
                          {name}
                        </p>
                        {context ? (
                          <p className="mt-0.5 truncate text-[13px] text-[var(--bc-mobile-muted)]">
                            {context}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
                          {t("bc.mobile.network.requests.wantsToConnect")} ·{" "}
                          {fmt.rel(req.requestedAt)}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3.5">
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[15px] font-semibold text-[var(--bc-mobile-text)]"
                      >
                        {initialsOf(null)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
                          {name}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
                          {t("bc.mobile.network.requests.wantsToConnect")} ·{" "}
                          {fmt.rel(req.requestedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 pl-[62px]">
                    {status === "accepted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <UserCheck className="h-4 w-4" />
                        ✓ Đã kết nối
                      </span>
                    ) : status === "declined" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bc-mobile-surface-2)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--bc-mobile-muted)]">
                        <UserX className="h-4 w-4" />
                        ✕ Đã từ chối
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={t("bc.mobile.network.requests.acceptAria", { name })}
                          onClick={() => {
                            setActionStates((prev) => ({ ...prev, [req.connectionId]: "accepted" }));
                            accept.mutate(req.connectionId, {
                              onSuccess: () => {
                                reportIdentityMetric("CONNECTION_REQUEST_ACCEPTED");
                                toast.success(t("bc.mobile.connection.toast.accepted"));
                              },
                              onError: (err) => {
                                setActionStates((prev) => {
                                  const next = { ...prev };
                                  delete next[req.connectionId];
                                  return next;
                                });
                                fail();
                              },
                            });
                          }}
                          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-4 text-[14px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none cursor-pointer"
                        >
                          {accept.isPending ? (
                            <Loader2
                              aria-hidden="true"
                              className="h-4 w-4 animate-spin motion-reduce:animate-none"
                              strokeWidth={1.8}
                            />
                          ) : null}
                          {t("bc.mobile.connection.accept")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={t("bc.mobile.network.requests.declineAria", { name })}
                          onClick={() => {
                            setActionStates((prev) => ({ ...prev, [req.connectionId]: "declined" }));
                            decline.mutate(req.connectionId, {
                              onSuccess: () => {
                                reportIdentityMetric("CONNECTION_REQUEST_DECLINED");
                                toast.success(t("bc.mobile.connection.toast.declined"));
                              },
                              onError: (err) => {
                                setActionStates((prev) => {
                                  const next = { ...prev };
                                  delete next[req.connectionId];
                                  return next;
                                });
                                fail();
                              },
                            });
                          }}
                          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none cursor-pointer"
                        >
                          {t("bc.mobile.connection.decline")}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

