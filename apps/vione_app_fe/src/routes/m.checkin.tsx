import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  QrCode,
  Wifi,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  History,
  CloudOff,
  Cloud,
} from "lucide-react";
import { MemberHeader } from "@/components/member/MemberShell";
import {
  getMyCheckinState,
  checkInMyself,
  type MyCheckinRecord,
  type CheckinStatus,
} from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";
import { extractScanCode } from "@/lib/scan";
import { extractNdefPayload, type NdefReadingEventLike } from "@/hooks/use-nfc-scanner";

export const Route = createFileRoute("/m/checkin")({
  component: CheckinScreen,
});

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function CheckinScreen() {
  const t = useT();
  const [mode, setMode] = useState<"qr" | "nfc">("qr");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MyCheckinRecord | null>(null);
  const [history, setHistory] = useState<MyCheckinRecord[]>([]);
  const [online, setOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fetchState = useServerFn(getMyCheckinState);
  const submitCheckin = useServerFn(checkInMyself);

  const statusMap: Record<
    CheckinStatus,
    { label: string; sub: string; Icon: typeof CheckCircle2; color: string; bg: string }
  > = {
    success: {
      label: t("m.checkin.statusSuccessLabel"),
      sub: t("m.checkin.statusSuccessSub"),
      Icon: CheckCircle2,
      color: "#3fbf7f",
      bg: "rgba(63,191,127,0.14)",
    },
    already: {
      label: t("m.checkin.statusAlreadyLabel"),
      sub: t("m.checkin.statusAlreadySub"),
      Icon: AlertTriangle,
      color: "#e8a04c",
      bg: "rgba(232,160,76,0.14)",
    },
    invalid: {
      label: t("m.checkin.statusInvalidLabel"),
      sub: t("m.checkin.statusInvalidSub"),
      Icon: XCircle,
      color: "#ff6b6b",
      bg: "rgba(255,107,107,0.14)",
    },
  };

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchState();
      setHistory(rows);
    } catch {
      /* keep last known server-fetched state; do NOT invent local truth */
    }
  }, [fetchState]);

  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    void refresh();
    const goOnline = () => {
      setOnline(true);
      void refresh();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced handler: ignore duplicates within a short window and require
  // the server to be reachable — Option A (online-required check-in).
  const lastScan = useRef<{ payload: string; t: number } | null>(null);
  const handlePayload = useCallback(
    async (raw: string) => {
      const resolved = extractScanCode(raw) || raw.trim();
      if (!resolved) return;
      const now = Date.now();
      if (
        lastScan.current &&
        lastScan.current.payload === resolved &&
        now - lastScan.current.t < 3000
      ) {
        return;
      }
      lastScan.current = { payload: resolved, t: now };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setResult({
          id: `local-offline-${now}`,
          eventId: null,
          eventTitle: t("m.checkin.offline"),
          status: "invalid",
          method: mode,
          at: new Date().toISOString(),
        });
        return;
      }

      if (submitting) return;
      setSubmitting(true);
      try {
        const rec = await submitCheckin({ data: { payload: resolved, method: mode } });
        setResult(rec);
        await refresh();
      } catch {
        setResult({
          id: `local-error-${now}`,
          eventId: null,
          eventTitle: t("m.checkin.statusInvalidLabel"),
          status: "invalid",
          method: mode,
          at: new Date().toISOString(),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [mode, submitCheckin, refresh, submitting, t],
  );

  // --- Real QR (camera) + NFC scanning ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrControls = useRef<{ stop: () => void } | null>(null);
  const nfcAbort = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScan = useCallback(() => {
    qrControls.current?.stop();
    qrControls.current = null;
    try {
      nfcAbort.current?.abort();
    } catch {
      /* ignore */
    }
    nfcAbort.current = null;
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    setError(null);
    setResult(null);
    if (mode === "qr") {
      // 1. Check camera permission trước
      try {
        if (navigator.permissions) {
          const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
          if (perm.state === "denied") {
            setError(t("m.checkin.cameraError") + " — Camera bị chặn, vui lòng cấp quyền trong cài đặt trình duyệt.");
            setScanning(false);
            return;
          }
        }
      } catch {
        /* permissions API không khả dụng — tiếp tục thử */
      }

      // 2. Thử lấy stream camera sau (environment) trước
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        try {
          // Fallback: camera bất kỳ
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch {
          setError(t("m.checkin.cameraError"));
          setScanning(false);
          return;
        }
      }

      // 3. Attach stream vào video element
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        try {
          await videoRef.current.play();
        } catch {
          /* Autoplay restriction — user will tap */
        }
      }

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoElement(videoRef.current!, (res, _err) => {
          if (res) void handlePayload(res.getText());
        });
        qrControls.current = {
          stop: () => {
            controls.stop();
            // Stop camera tracks to release camera indicator
            if (videoRef.current?.srcObject) {
              const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
              tracks.forEach((t) => t.stop());
              videoRef.current.srcObject = null;
            }
          },
        };
        setScanning(true);
      } catch {
        // Stop stream on failure
        if (stream) stream.getTracks().forEach((t) => t.stop());
        setError(t("m.checkin.cameraError"));
        setScanning(false);
      }
    } else {
      if (typeof window === "undefined") {
        setError(t("m.checkin.nfcNotSupported"));
        return;
      }

      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor);
      if (!window.isSecureContext && !isLocal) {
        setError("Chạm NFC yêu cầu kết nối bảo mật HTTPS hoặc ứng dụng di động ViOne.");
        return;
      }

      const NDEFReader = (window as unknown as { NDEFReader?: new () => any }).NDEFReader;
      if (!NDEFReader || typeof NDEFReader !== "function") {
        setError("Thiết bị hoặc trình duyệt chưa hỗ trợ Web NFC. Vui lòng mở bằng Google Chrome trên Android hoặc chuyển sang quét QR.");
        return;
      }

      try {
        const reader = new NDEFReader();
        const abort = new AbortController();
        nfcAbort.current = abort;
        await reader.scan({ signal: abort.signal });
        reader.onreading = (ev: NdefReadingEventLike) => {
          const payload = extractNdefPayload(ev);
          if (payload) {
            void handlePayload(payload);
          }
        };
        reader.onreadingerror = () => {
          /* tag moved or partial read — keep listening */
        };
        setScanning(true);
      } catch (e: any) {
        if (e?.name === "NotAllowedError" || e?.message?.includes("not allowed") || e?.message?.includes("permission")) {
          setError("Quyền NFC bị từ chối. Hãy cho phép quyền NFC trong cài đặt trình duyệt Chrome.");
        } else {
          setError("Không thể bật NFC. Hãy kiểm tra xem NFC đã được bật trong Cài đặt của máy và mở khóa màn hình.");
        }
        setScanning(false);
      }
    }
  }, [mode, handlePayload, t]);


  function toggleScan() {
    if (scanning) stopScan();
    else void startScan();
  }

  useEffect(() => {
    stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => () => stopScan(), [stopScan]);

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.checkin.headerTitle")} back />

      {/* Mode toggle */}
      <div className="px-4 pt-4">
        <div className="relative grid grid-cols-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-bg-2)] p-1">
          <span
            className="vba-gold-grad absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl transition-transform duration-300"
            style={{
              transform: mode === "qr" ? "translateX(0)" : "translateX(calc(100% + 0.5rem))",
            }}
          />
          <button
            onClick={() => setMode("qr")}
            className="relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition"
            style={{ color: mode === "qr" ? "#1a1206" : "var(--vba-text-dim)" }}
          >
            <QrCode className="h-4 w-4" /> {t("m.checkin.modeQr")}
          </button>
          <button
            onClick={() => setMode("nfc")}
            className="relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition"
            style={{ color: mode === "nfc" ? "#1a1206" : "var(--vba-text-dim)" }}
          >
            <Wifi className="h-4 w-4" /> {t("m.checkin.modeNfc")}
          </button>
        </div>
      </div>

      {/* Scanner viewport */}
      <div className="px-4 pt-4">
        <div className="vba-card relative grid aspect-square place-items-center overflow-hidden p-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(var(--vba-gold-soft) 1px,transparent 1px),linear-gradient(90deg,var(--vba-gold-soft) 1px,transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          {mode === "qr" ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: scanning ? 1 : 0 }}
                muted
                playsInline
              />
              <div className="relative h-[62%] w-[62%]">
                <span className="absolute -left-1 -top-1 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px] border-[var(--vba-gold)]" />
                <span className="absolute -right-1 -top-1 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px] border-[var(--vba-gold)]" />
                <span className="absolute -bottom-1 -left-1 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px] border-[var(--vba-gold)]" />
                <span className="absolute -bottom-1 -right-1 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px] border-[var(--vba-gold)]" />
                {scanning && (
                  <span className="absolute inset-x-2 top-2 h-0.5 animate-[mscan_1.4s_ease-in-out_infinite] rounded-full bg-[var(--vba-gold)] shadow-[0_0_14px_var(--vba-gold)]" />
                )}
                {!scanning && (
                  <ScanLine className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-[var(--vba-text-dim)]" />
                )}
              </div>
            </>
          ) : (
            <div className="relative grid place-items-center">
              {scanning &&
                [0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="absolute h-28 w-28 animate-ping rounded-full border-2 border-[var(--vba-gold)] opacity-40"
                    style={{ animationDelay: `${i * 0.4}s`, animationDuration: "1.8s" }}
                  />
                ))}
              <span className="vba-gold-grad grid h-24 w-24 place-items-center rounded-full text-[#1a1206]">
                <Wifi className="h-10 w-10 -rotate-90" />
              </span>
              {scanning && (
                <p className="mt-3 text-center text-[12px] font-medium text-[var(--vba-gold)]">
                  Áp thẻ vào vị trí giữa lưng điện thoại
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-[rgba(255,107,107,0.3)] bg-[rgba(255,107,107,0.1)] px-3 py-2 text-[12px] text-[#ff6b6b]">
            {error}
          </p>
        )}

        <button
          onClick={toggleScan}
          disabled={submitting}
          className="vba-gold-grad mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-[#1a1206] disabled:opacity-60"
        >
          <ScanLine className="h-4 w-4" />
          {scanning
            ? t("m.checkin.stopScan")
            : mode === "qr"
              ? t("m.checkin.startQr")
              : t("m.checkin.startNfc")}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="px-4 pt-4">
          <ResultCard rec={result} statusMap={statusMap} />
        </div>
      )}

      {/* Connection status — no local queue, online is required */}
      <div className="px-4 pt-5">
        <div className="vba-card flex items-center gap-3 p-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{
              background: online ? "rgba(63,191,127,0.14)" : "rgba(255,107,107,0.14)",
            }}
          >
            {online ? (
              <Cloud className="h-4.5 w-4.5" style={{ color: "#3fbf7f" }} />
            ) : (
              <CloudOff className="h-4.5 w-4.5" style={{ color: "#ff6b6b" }} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--vba-text)]">
              {online ? t("m.checkin.synced") : t("m.checkin.offline")}
            </div>
            <div className="text-[11px] text-[var(--vba-text-muted)]">
              {online ? t("m.checkin.syncSubOnline") : t("m.checkin.syncSubOffline")}
            </div>
          </div>
        </div>
      </div>

      {/* History (server-authoritative) */}
      <div className="px-4 pb-4 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--vba-gold)]" />
          <h2 className="text-[14px] font-bold text-[var(--vba-text)]">
            {t("m.checkin.historyTitle")}
          </h2>
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--vba-border-soft)] py-8 text-center text-[12px] text-[var(--vba-text-muted)]">
            {t("m.checkin.historyEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((r: any) => {
              const s = statusMap[r.status as CheckinStatus];
              return (
                <div key={r.id} className="vba-card flex items-center gap-3 p-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                    style={{ background: s.bg }}
                  >
                    <s.Icon className="h-4.5 w-4.5" style={{ color: s.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                      {r.eventTitle}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--vba-text-muted)]">
                      {r.method === "qr" ? "QR" : "NFC"} · {fmtTime(r.at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  rec,
  statusMap,
}: {
  rec: MyCheckinRecord;
  statusMap: Record<
    CheckinStatus,
    { label: string; sub: string; Icon: typeof CheckCircle2; color: string; bg: string }
  >;
}) {
  const s = statusMap[rec.status];
  return (
    <div className="vba-card p-4">
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          style={{ background: s.bg }}
        >
          <s.Icon className="h-6 w-6" style={{ color: s.color }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold" style={{ color: s.color }}>
            {s.label}
          </div>
          <div className="truncate text-[12px] text-[var(--vba-text-muted)]">{s.sub}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-[12px] text-[var(--vba-text-muted)]">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
          <span className="truncate text-[var(--vba-text)]">{rec.eventTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
          <span>{fmtTime(rec.at)}</span>
        </div>
      </div>
    </div>
  );
}
