import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Printer, Nfc, CalendarDays, MapPin, Users, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { QrCanvas } from "@/components/member/QrCanvas";
import { getCheckinQrEventsFn, type CheckinQrEvent } from "@/lib/checkin-qr.functions";
import { detectNfcCapability } from "@/lib/nfc/capability";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/checkin-qr")({
  ssr: false,
  // Mã QR/NFC phải luôn khớp ID sự kiện mới nhất → không dùng dữ liệu loader cũ.
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  loader: () => getCheckinQrEventsFn(),
  component: CheckinQrPage,
  head: () => ({
    meta: [
      { title: "Mã QR check-in sự kiện | ViOne" },
      {
        name: "description",
        content:
          "Bảng mã QR và dữ liệu chạm NFC cho toàn bộ sự kiện, sẵn sàng in hoặc trình chiếu để check-in tại chỗ.",
      },
      { property: "og:title", content: "Mã QR check-in sự kiện | ViOne" },
      {
        property: "og:description",
        content: "Bảng mã QR/NFC cho toàn bộ sự kiện để check-in tại chỗ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function EventQrCard({ event }: { event: CheckinQrEvent }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [writing, setWriting] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(event.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t("checkinQr.copyFailed"));
    }
  };

  const writeNfc = async () => {
    if (detectNfcCapability() !== "SUPPORTED_WRITE") {
      toast.info(t("checkinQr.nfcUnsupported"));
      return;
    }
    setWriting(true);
    try {
      const Ctor = (window as unknown as { NDEFReader: new () => { write: (m: unknown) => Promise<void> } })
        .NDEFReader;
      const ndef = new Ctor();
      await ndef.write({ records: [{ recordType: "text", data: event.id }] });
      toast.success(t("checkinQr.nfcDone"));
    } catch {
      toast.error(t("checkinQr.nfcFailed"));
    } finally {
      setWriting(false);
    }
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm break-inside-avoid">
      <header className="min-w-0">
        <h2 className="truncate text-base font-semibold text-foreground">{event.name}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
            {new Date(event.date).toLocaleDateString("vi-VN")}
          </span>
          {event.location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            {event.checkedIn}/{event.registered}
          </span>
        </p>
      </header>

      <div className="flex items-center gap-4">
        <QrCanvas value={event.id} size={148} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-muted-foreground">{t("checkinQr.payload")}</p>
          <code className="mt-1 block truncate rounded-md bg-muted px-2 py-1 font-mono text-[12px] text-foreground">
            {event.id}
          </code>
          <p className="mt-2 leading-relaxed text-muted-foreground">{t("checkinQr.cardHint")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {copied ? t("checkinQr.copied") : t("checkinQr.copy")}
        </button>
        <button
          type="button"
          onClick={writeNfc}
          disabled={writing}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          <Nfc aria-hidden="true" className="h-3.5 w-3.5" />
          {writing ? t("checkinQr.nfcWriting") : t("checkinQr.nfcWrite")}
        </button>
      </div>
    </article>
  );
}

function CheckinQrPage() {
  const t = useT();
  const router = useRouter();
  const events = Route.useLoaderData();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await router.invalidate();
      toast.success(t("checkinQr.refreshed"));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("checkinQr.title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("checkinQr.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? t("checkinQr.refreshing") : t("checkinQr.refresh")}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Printer aria-hidden="true" className="h-4 w-4" />
              {t("checkinQr.print")}
            </button>
          </div>
        </header>


        {events.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("checkinQr.empty")}</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((e: any) => (
              <EventQrCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
