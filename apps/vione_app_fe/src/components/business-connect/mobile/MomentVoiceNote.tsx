// BC-Mobile-7E — AI ghi nhớ bằng giọng nói cho màn Lưu khoảnh khắc.
//
// Ghi âm trên máy (MediaRecorder) → gửi một lần lên máy chủ → nhận ghi chú đã
// tóm tắt và điền vào ô ghi chú riêng tư. Âm thanh KHÔNG được lưu ở đâu cả:
// nó chỉ tồn tại trong bộ nhớ tạm của trình duyệt và trong đúng request đó.

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Undo2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { bcMobileMomentVoiceNoteFn } from "@/lib/business-connect/mobile/moment.functions";

const MAX_MS = 3 * 60_000;

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

async function toBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) {
    bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export function MomentVoiceNote({
  disabled,
  onApply,
  onUndo,
  canUndo,
}: {
  disabled?: boolean;
  onApply: (note: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const t = useT();
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorKey, setErrorKey] = useState<TKey | null>(null);
  const [applied, setApplied] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (state !== "recording") return;
    const id = window.setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsed(ms);
      if (ms >= MAX_MS) recorderRef.current?.stop();
    }, 250);
    return () => window.clearInterval(id);
  }, [state]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  async function start() {
    setErrorKey(null);
    setApplied(false);
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setErrorKey("bc.mobile.moment.voice.error.unsupported");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorKey("bc.mobile.moment.voice.error.permission");
      return;
    }
    const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      stream.getTracks().forEach((tr) => tr.stop());
      setErrorKey("bc.mobile.moment.voice.error.unsupported");
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      cleanupStream();
      void transcribe(blob, type);
    };
    streamRef.current = stream;
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setState("recording");
    recorder.start();
  }

  async function transcribe(blob: Blob, mimeType: string) {
    if (blob.size < 1024) {
      setState("idle");
      setErrorKey("bc.mobile.moment.voice.error.empty_audio");
      return;
    }
    setState("processing");
    try {
      const audioBase64 = await toBase64(blob);
      const res = await bcMobileMomentVoiceNoteFn({ data: { audioBase64, mimeType } });
      if (!res.ok) {
        setErrorKey(`bc.mobile.moment.voice.error.${res.error}` as TKey);
        return;
      }
      onApply(res.note);
      setApplied(true);
    } catch {
      setErrorKey("bc.mobile.moment.voice.error.unavailable");
    } finally {
      setState("idle");
    }
  }

  const busy = disabled || state === "processing";

  return (
    <section className="rounded-2xl border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface)] p-3.5">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]"
        >
          <Mic className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.moment.voice.title")}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {state === "recording"
              ? t("bc.mobile.moment.voice.recording", { time: fmt(elapsed) })
              : state === "processing"
                ? t("bc.mobile.moment.voice.processing")
                : t("bc.mobile.moment.voice.hint")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (state === "recording" ? recorderRef.current?.stop() : void start())}
          disabled={busy}
          aria-live="polite"
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] font-semibold transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60 ${
            state === "recording"
              ? "border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]"
              : "bc-cta-gold"
          }`}
        >
          {state === "processing" ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          ) : state === "recording" ? (
            <Square aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <Mic aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          )}
          {state === "processing"
            ? t("bc.mobile.moment.voice.processing")
            : state === "recording"
              ? t("bc.mobile.moment.voice.stop")
              : applied || errorKey
                ? t("bc.mobile.moment.voice.retry")
                : t("bc.mobile.moment.voice.start")}
        </button>
        {applied && canUndo ? (
          <button
            type="button"
            onClick={() => {
              onUndo();
              setApplied(false);
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--bc-mobile-border)] px-3 text-[14px] font-medium text-[var(--bc-mobile-text-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
          >
            <Undo2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.moment.voice.undo")}
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.moment.voice.limit")}
      </p>

      {applied ? (
        <p role="status" className="mt-2 text-[12.5px] text-[var(--bc-mobile-accent)]">
          {t("bc.mobile.moment.voice.applied")}
        </p>
      ) : null}
      {errorKey ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[#b91c1c]">
          {t(errorKey)}
        </p>
      ) : null}
    </section>
  );
}
