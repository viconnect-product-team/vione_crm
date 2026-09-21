// Phiên & thiết bị — /connect-app/me/sessions
// Liệt kê các thiết bị đang đăng nhập và cho phép ngắt phiên từ xa.
// Chỉ chủ tài khoản: mọi đọc/ghi đều xác định chủ thể phía máy chủ.

import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MonitorSmartphone, Smartphone } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { MeSheet } from "@/components/business-connect/mobile/me/MeSheet";
import { fetchNestApi } from "@/lib/api-client";
import {
  bcDeviceSessionsListFn,
  bcDeviceSessionRevokeFn,
} from "@/lib/business-connect/mobile/device-session.functions";
import { getDeviceKey } from "@/lib/business-connect/mobile/device-session.client-info";
import type { DeviceSessionInfo } from "@/lib/business-connect/mobile/device-session.types";

export const Route = createFileRoute("/connect-app/me/sessions")({
  head: () => ({
    meta: [
      { title: "Phiên & thiết bị — Business Connect" },
      {
        name: "description",
        content: "Xem các thiết bị đang đăng nhập và ngắt phiên từ xa khi cần.",
      },
      { property: "og:title", content: "Phiên & thiết bị — Business Connect" },
      {
        property: "og:description",
        content: "Xem các thiết bị đang đăng nhập và ngắt phiên từ xa khi cần.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionsPage,
});

function formatWhen(value: string, locale: string): string {
  try {
    return new Date(value).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function SessionsPage() {
  const t = useT();
  const { lang } = useLang();
  const listSessions = useServerFn(bcDeviceSessionsListFn);
  const revokeSession = useServerFn(bcDeviceSessionRevokeFn);

  const [sessions, setSessions] = useState<DeviceSessionInfo[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState<DeviceSessionInfo | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeFailed, setRevokeFailed] = useState(false);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      setSessions(await listSessions({ data: { deviceKey: getDeviceKey() } }));
    } catch {
      try {
        const key = getDeviceKey();
        const data = await fetchNestApi<DeviceSessionInfo[]>(
          `/connect-app/me/device-sessions${key ? `?deviceKey=${key}` : ""}`,
        );
        setSessions(data);
      } catch {
        setLoadFailed(true);
      }
    }
  }, [listSessions]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRevoke() {
    if (!pending || revoking) return;
    setRevoking(true);
    setRevokeFailed(false);
    try {
      let updated: DeviceSessionInfo;
      try {
        updated = await revokeSession({
          data: { sessionId: pending.id, deviceKey: getDeviceKey() },
        });
      } catch {
        const key = getDeviceKey();
        updated = await fetchNestApi<DeviceSessionInfo>(
          `/connect-app/me/device-sessions/${pending.id}${key ? `?deviceKey=${key}` : ""}`,
          { method: "DELETE" },
        );
      }
      setSessions((prev) => prev?.map((s) => (s.id === updated.id ? updated : s)) ?? prev);
      setPending(null);
    } catch {
      setRevokeFailed(true);
    } finally {
      setRevoking(false);
    }
  }

  const active = sessions?.filter((s) => !s.revokedAt) ?? [];
  const revoked = sessions?.filter((s) => s.revokedAt) ?? [];

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.me.sessions.pageTitle")} back />
      <div className="grid gap-4 pt-6">
        <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.sessions.pageDesc")}
        </p>

        {loadFailed ? (
          <section className="rounded-2xl bc-translucent-card p-6 text-center shadow-md">
            <p role="alert" className="text-[14px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.loadError")}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 min-h-11 rounded-full btn-luxury-gold px-6 text-[14px] font-bold shadow-md shadow-[#D8B282]/25"
            >
              {t("bc.mobile.me.retry")}
            </button>
          </section>
        ) : !sessions ? (
          <section
            aria-busy="true"
            aria-label={t("bc.mobile.me.sessions.pageTitle")}
            className="flex justify-center rounded-2xl bc-translucent-card p-10 shadow-md"
          >
            <Loader2
              aria-hidden="true"
              className="h-6 w-6 animate-spin text-[#D8B282] motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          </section>
        ) : sessions.length === 0 ? (
          <section className="rounded-2xl bc-translucent-card p-6 text-center shadow-md">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(216,178,130,0.25)] bg-[rgba(216,178,130,0.12)] text-[#D8B282]">
              <MonitorSmartphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="mt-3 text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.sessions.empty")}
            </p>
          </section>
        ) : (
          <>
            <ul className="grid gap-3">
              {[...active, ...revoked].map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-2xl bc-translucent-card p-4 shadow-md"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[rgba(216,178,130,0.25)] bg-[rgba(216,178,130,0.12)] text-[#D8B282]">
                    <Smartphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
                      {t("bc.mobile.me.sessions.lastSeen")}:{" "}
                      {formatWhen(s.lastSeenAt, lang === "vi" ? "vi-VN" : "en-US")}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-2 text-[11.5px] font-medium">
                      {s.isCurrent && (
                        <span className="rounded-full border border-[rgba(216,178,130,0.35)] bg-[rgba(216,178,130,0.15)] px-2.5 py-0.5 text-[11px] font-bold text-[#F6E1C3]">
                          {t("bc.mobile.me.sessions.current")}
                        </span>
                      )}
                      {s.isStandalone && (
                        <span className="rounded-full bg-[var(--bc-mobile-surface-2)]/60 px-2 py-0.5 text-[var(--bc-mobile-muted)]">
                          {t("bc.mobile.me.sessions.pwa")}
                        </span>
                      )}
                      {s.revokedAt && (
                        <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-red-400">
                          {t("bc.mobile.me.sessions.revoked")}
                        </span>
                      )}
                    </p>
                  </div>
                  {!s.revokedAt && (
                    <button
                      type="button"
                      onClick={() => {
                        setRevokeFailed(false);
                        setPending(s);
                      }}
                      className="min-h-9 shrink-0 rounded-full btn-luxury-gold px-4 text-[12.5px] font-bold shadow-sm shadow-[#D8B282]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] motion-reduce:transition-none cursor-pointer"
                    >
                      {t("bc.mobile.me.sessions.revokeAction")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.sessions.note")}
            </p>
          </>
        )}
      </div>

      {pending && (
        <MeSheet
          title={t("bc.mobile.me.sessions.confirmTitle")}
          subtitle={t("bc.mobile.me.sessions.confirmSubtitle")}
          busy={revoking}
          onClose={() => setPending(null)}
          footer={
            <>
              {revokeFailed && (
                <p role="alert" className="text-center text-[12.5px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.me.sessions.revokeError")}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={revoking}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bc-cta-gold px-6 text-[15px] font-bold shadow-md shadow-[#D8B282]/25 hover:opacity-95 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] motion-reduce:transition-none cursor-pointer"
              >
                {revoking && (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    strokeWidth={1.8}
                  />
                )}
                {revoking
                  ? t("bc.mobile.me.sessions.revokePending")
                  : t("bc.mobile.me.sessions.revokeConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={revoking}
                className="min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                {t("bc.mobile.me.cancel")}
              </button>
            </>
          }
        >
          <p className="text-[13.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {pending.label}
          </p>
        </MeSheet>
      )}
    </MobilePage>
  );
}
