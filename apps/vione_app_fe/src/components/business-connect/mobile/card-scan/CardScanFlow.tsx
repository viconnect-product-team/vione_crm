// BC-Mobile-4B — /connect-app/card-scan flow container.
//
// State machine:
//   capture → preview → processing → review → (duplicate sheet) → saved
//                                 ↘ unusable | error
//
// OCR proposes; the human confirms. The review stage holds an editable draft
// derived from the candidate; only confirmed draft values are saved, via the
// server-authority save RPC (re-normalizes, re-checks duplicates in the same
// transaction, idempotent on the per-attempt client token).
//
// Privacy: the image lives in component state as a processed JPEG data URL;
// the OCR call carries no client secret; the card image is never persisted.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Camera, ImagePlus, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { safeRandomUUID } from "@/lib/utils";
import { fetchNestApi } from "@/lib/api-client";
import { bcMobileCardScanFn } from "@/lib/business-connect/mobile/card-scan.functions";
import {
  bcMobileCardScanResolveFn,
  bcMobileCardScanSaveFn,
} from "@/lib/business-connect/mobile/card-scan-save.functions";
import { reportCardScanMetric } from "@/lib/business-connect/mobile/card-scan.telemetry";
import {
  CARD_SCAN_ACCEPT,
  processCardScanImage,
  validateCardScanImageFile,
  type CardScanImageProcessed,
} from "@/lib/business-connect/mobile/card-scan-image";
import type {
  BusinessCardCandidate,
  CardScanFailureCode,
} from "@/lib/business-connect/mobile/card-scan.types";
import {
  computeScanFieldResolutions,
  draftFromCandidate,
  toScanSavePayload,
  validateScanReviewDraft,
  type ScanDuplicateResolution,
  type ScanFieldChoices,
  type ScanFieldKey,
  type ScanFieldResolution,
  type ScanReviewDraft,
  type ScanReviewErrors,
  type ScanSaveResultKind,
} from "@/lib/business-connect/mobile/card-scan.review";
import { parseBcMobilePersonId } from "@/lib/business-connect/mobile/person-journey.types";
import { GuestContactSDK } from "@/lib/business-card/guest-contact.sdk";
import {
  cardScanSessionRemainingMs,
  isCardScanSessionValid,
} from "@/lib/business-connect/mobile/card-scan.session";
import { buildScanDraftVCard } from "@/lib/business-connect/mobile/card-scan.vcard";
import { personVcfFilename, shareOrDownloadVcf } from "@/lib/business-connect/mobile/person-vcard";
import { VcfPreviewSheet } from "@/components/business-connect/mobile/VcfPreviewSheet";
import { BusinessCardCapture } from "./BusinessCardCapture";
import { LiveCardAutoCapture } from "./LiveCardAutoCapture";
import { BusinessCardImagePreview } from "./BusinessCardImagePreview";
import { BusinessCardCropper } from "./BusinessCardCropper";
import { BusinessCardOcrProgress, type CardScanProcessingStage } from "./BusinessCardOcrProgress";
import { BusinessCardReviewForm } from "./BusinessCardReviewForm";
import { CardScanDuplicateSheet } from "./CardScanDuplicateSheet";
import { CardScanFieldResolutionSheet } from "./CardScanFieldResolutionSheet";
import { CardScanSaveSuccess } from "./CardScanSaveSuccess";
import { CardScanSessionExpired } from "./CardScanSessionExpired";

type Stage = "capture" | "preview" | "processing" | "review" | "saved" | "unusable" | "error";

const CLIENT_TIMEOUT_MS = 45_000;

const IMAGE_ERROR_KEY = {
  unsupported_type: "bc.mobile.cardScan.error.unsupported",
  too_large: "bc.mobile.cardScan.error.tooLarge",
  decode_failed: "bc.mobile.cardScan.error.decode",
} as const;

const SCAN_ERROR_KEY: Record<CardScanFailureCode, string> = {
  unusable: "bc.mobile.cardScan.error.failed",
  invalid_output: "bc.mobile.cardScan.error.failed",
  timeout: "bc.mobile.cardScan.error.timeout",
  provider_busy: "bc.mobile.cardScan.error.providerBusy",
  rate_limited: "bc.mobile.cardScan.error.rateLimited",
  failed: "bc.mobile.cardScan.error.failed",
} as const;

type SaveOutcome = {
  result: ScanSaveResultKind;
  personId: string;
  displayName: string;
  title: string | null;
  companyName: string | null;
};

export function CardScanFlow() {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scanFn = useServerFn(bcMobileCardScanFn);
  const resolveFn = useServerFn(bcMobileCardScanResolveFn);
  const saveFn = useServerFn(bcMobileCardScanSaveFn);

  const [stage, setStage] = useState<Stage>("capture");
  const [processingStage, setProcessingStage] = useState<CardScanProcessingStage>("preparing");
  const [image, setImage] = useState<CardScanImageProcessed | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [candidate, setCandidate] = useState<BusinessCardCandidate | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<CardScanFailureCode | null>(null);

  // ── 4B review/save state ─────────────────────────────────────────────────
  const [draft, setDraft] = useState<ScanReviewDraft | null>(null);
  const [draftErrors, setDraftErrors] = useState<ScanReviewErrors>({});
  const [resolution, setResolution] = useState<ScanDuplicateResolution | null>(null);
  const [duplicateSheetOpen, setDuplicateSheetOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<"conflict" | "notFound" | "generic" | null>(null);
  const [saveOutcome, setSaveOutcome] = useState<SaveOutcome | null>(null);
  /** Cards saved during this scanning session (newest first). In-memory only. */
  const [sessionSaved, setSessionSaved] = useState<
    { personId: string; displayName: string; result: ScanSaveResultKind }[]
  >([]);
  /** Pending .vcf export awaiting human confirmation in the preview sheet. */
  const [vcfPreview, setVcfPreview] = useState<{ vcf: string; filename: string } | null>(null);
  /** True while the confirmed .vcf is being generated/delivered — keeps the
      preview sheet open with its confirm action disabled + loading. */
  const [vcfDelivering, setVcfDelivering] = useState(false);

  // ── Field-level merge confirmation (existing-person update) ──────────────
  /** Set when the chosen guest target has conflicting populated fields —
   *  identity is never silently overwritten, each conflict is a human choice. */
  const [fieldSheet, setFieldSheet] = useState<{
    targetPersonId: string;
    targetName: string;
    resolutions: ScanFieldResolution[];
    choices: ScanFieldChoices;
  } | null>(null);

  // ── Recognition session (privacy TTL on the in-memory candidate+draft) ──
  const [sessionExpired, setSessionExpired] = useState(false);

  // ── Auto capture (live viewfinder) ───────────────────────────────────────
  /** Preference: fire the shutter automatically on a steady, readable card. */
  const [autoCapture, setAutoCapture] = useState(true);
  const [liveOpen, setLiveOpen] = useState(false);

  /** Live camera is possible in a secure context, localhost, or native mobile container with mediaDevices. */
  function canUseLiveCamera(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function"
    );
  }

  /** Entry point for every "take photo" action: live auto mode when enabled
   * and supported, otherwise the native camera input (unchanged behaviour). */
  function startCamera() {
    if (autoCapture && canUseLiveCamera()) {
      setCaptureError(null);
      setLiveOpen(true);
      return;
    }
    cameraInputRef.current?.click();
  }

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  /** Per-attempt idempotency token: one save logical op = one token, safe to
   * retry. Minted when the review opens; discarded when the attempt ends. */
  const clientTokenRef = useRef<string>(safeRandomUUID());
  /** Wall-clock start of the live recognition session (review opened). */
  const reviewStartedAtRef = useRef<number | null>(null);
  /** Mirror of sessionExpired for guard-closure reads (fire expiry once). */
  const sessionExpiredRef = useRef(false);

  // Focus moves logically after each stage transition.
  useEffect(() => {
    const target =
      stage === "review" || stage === "saved" ? resultHeadingRef.current : headingRef.current;
    target?.focus();
  }, [stage]);

  // Auto-start camera on initial mount for instant card capture experience
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage === "capture" && !liveOpen && !image) {
        startCamera();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // The expiry alert takes focus when the session lapses mid-review.
  useEffect(() => {
    if (sessionExpired) resultHeadingRef.current?.focus();
  }, [sessionExpired]);

  /** Expire the live review session exactly once: notify, lock, offer recapture. */
  function expireReviewSession() {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true;
    setSessionExpired(true);
    setDuplicateSheetOpen(false);
    setFieldSheet(null);
    setVcfPreview(null);
    reportCardScanMetric("OCR_REVIEW_SESSION_EXPIRED");
    toast.error(t("bc.mobile.cardScan.session.expiredTitle"), {
      description: t("bc.mobile.cardScan.session.expiredDesc"),
    });
  }

  function isReviewSessionLive(): boolean {
    return isCardScanSessionValid(reviewStartedAtRef.current, Date.now());
  }

  // Foreground passage of time: lock the review when the TTL elapses.
  useEffect(() => {
    if (stage !== "review" || sessionExpired) return undefined;
    const remaining = cardScanSessionRemainingMs(reviewStartedAtRef.current, Date.now());
    const id = window.setTimeout(expireReviewSession, remaining);
    return () => window.clearTimeout(id);
  }, [stage, sessionExpired]);

  // Backgrounded tab/app: re-validate on return. A still-valid session keeps
  // every edit untouched; an elapsed one expires now (timers may have been
  // throttled while hidden).
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (stage !== "review" || sessionExpiredRef.current) return;
      if (!isReviewSessionLive()) expireReviewSession();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [stage]);

  async function onFileSelected(file: File | null) {
    if (!file) return;
    const invalid = validateCardScanImageFile(file);
    if (invalid) {
      setCaptureError(t(IMAGE_ERROR_KEY[invalid] as never));
      return;
    }
    setCaptureError(null);
    setCandidate(null);
    setScanError(null);
    setProcessingStage("preparing");
    setStage("processing");
    const processed = await processCardScanImage(file);
    if (!processed.ok) {
      setCaptureError(t(IMAGE_ERROR_KEY[processed.error] as never));
      setStage("capture");
      return;
    }
    setImage(processed.image);
    setStage("preview");
  }

  /** Read-only deterministic duplicate resolve for the current draft. Never
   * blocks saving — `none` on any failure, and the save RPC re-checks in the
   * same transaction anyway (TOCTOU guard). Name/company drive the tiered
   * (strong/possible) signals; they never auto-merge. */
  async function refreshResolution(d: ScanReviewDraft) {
    const payload = toScanSavePayload(d);
    if (!payload.phone && !payload.email && !payload.displayName) {
      setResolution({ state: "none", candidates: [] });
      return;
    }
    try {
      const r = await resolveFn({
        data: {
          email: payload.email,
          phone: payload.phone,
          displayName: payload.displayName || null,
          companyName: payload.companyName,
        },
      });
      setResolution(r);
    } catch {
      setResolution({ state: "none", candidates: [] });
    }
  }

  async function recognize() {
    if (!image) return;
    setProcessingStage("reading");
    setStage("processing");
    setScanError(null);
    try {
      const result = await Promise.race([
        scanFn({ data: { imageDataUrl: image.dataUrl, clientToken: safeRandomUUID() } }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("client-timeout")), CLIENT_TIMEOUT_MS),
        ),
      ]);
      if (result.ok) {
        const nextDraft = draftFromCandidate(result.candidate);
        setCandidate(result.candidate);
        setDraft(nextDraft);
        setDraftErrors({});
        setResolution(null);
        setSaveError(null);
        setSaveOutcome(null);
        clientTokenRef.current = safeRandomUUID();
        reviewStartedAtRef.current = Date.now();
        sessionExpiredRef.current = false;
        setSessionExpired(false);
        setStage("review");
        reportCardScanMetric("OCR_REVIEW_OPENED");
        void refreshResolution(nextDraft);
      } else if (result.code === "unusable") {
        setStage("unusable");
      } else {
        setScanError(result.code);
        setStage("error");
      }
    } catch {
      // Client timeout or transport failure — the image is still local.
      setScanError("timeout");
      setStage("error");
    }
  }

  async function doSave(
    resolutionChoice: "new" | "update",
    targetPersonId: string | null,
    opts?: { confirmedNew?: boolean; fieldChoices?: ScanFieldChoices },
  ) {
    if (!candidate || !draft || saving) return;
    // Late-save guard: the session may lapse while the duplicate sheet is
    // open or while a backgrounded tab's timers were throttled. Expired scan
    // results are never saved.
    if (!isReviewSessionLive()) {
      expireReviewSession();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = toScanSavePayload(draft);
      const res = await saveFn({
        data: {
          clientToken: clientTokenRef.current,
          scanId: candidate.scanId,
          displayName: payload.displayName,
          phone: payload.phone,
          email: payload.email,
          companyName: payload.companyName,
          title: payload.title,
          website: payload.website,
          address: payload.address,
          resolution: resolutionChoice,
          targetPersonId,
          confirmedNew: opts?.confirmedNew === true,
          fieldChoices: opts?.fieldChoices ?? null,
        },
      });
      if (res.ok) {
        setSaveOutcome({
          result: res.result,
          personId: res.personId,
          displayName: res.displayName,
          title: res.title,
          companyName: res.companyName,
        });
        // Batch session log: one entry per saved card, newest first. Kept in
        // memory only for the current scanning session.
        setSessionSaved((prev) => [
          { personId: res.personId, displayName: res.displayName, result: res.result },
          ...prev.filter((p) => p.personId !== res.personId),
        ]);
        setDuplicateSheetOpen(false);
        setFieldSheet(null);
        setStage("saved");

        // The Network list + Home aggregations read guest contacts.
        void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "network"] });
        void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "home"] });
        return;
      }
      if (res.code === "match_conflict" || res.code === "not_found") {
        // The server re-computed the duplicate state and disagreed with the
        // human's decision — refresh the truthful state and let them re-decide.
        setDuplicateSheetOpen(false);
        setFieldSheet(null);
        setSaveError(res.code === "match_conflict" ? "conflict" : "notFound");
        await refreshResolution(draft);
        return;
      }
      setSaveError("generic");
    } catch {
      setSaveError("generic");
    } finally {
      setSaving(false);
    }
  }

  function onReviewContinue() {
    if (!draft) return;
    if (!isReviewSessionLive()) {
      expireReviewSession();
      return;
    }
    const v = validateScanReviewDraft(draft);
    if (!v.ok) {
      setDraftErrors(v.errors);
      return;
    }
    setDraftErrors({});
    setSaveError(null);
    if (resolution && resolution.state !== "none") {
      // Human decision required — never merge automatically. Preselect only
      // the single exact guest candidate (saved cards / connections are
      // read-only references, never update targets).
      const single = resolution.state === "exact" ? resolution.candidates[0] : null;
      setSelectedTargetId(single && single.kind === "guest" ? single.personId : null);
      setDuplicateSheetOpen(true);
      return;
    }
    void doSave("new", null);
  }

  /** "Update this contact": before the save, surface field-level conflicts
   *  between the confirmed card values and the stored guest contact — every
   *  conflicting populated field is an explicit human choice, identity is
   *  never silently overwritten. */
  async function beginUpdateExisting() {
    if (!draft || !selectedTargetId) return;
    if (!isReviewSessionLive()) {
      expireReviewSession();
      return;
    }
    const parsed = parseBcMobilePersonId(selectedTargetId);
    if (!parsed || parsed.kind !== "guest_contact") {
      setSaveError("generic");
      return;
    }
    try {
      const guest = await GuestContactSDK.getMine(parsed.id);
      if (!guest) {
        setDuplicateSheetOpen(false);
        setSaveError("notFound");
        await refreshResolution(draft);
        return;
      }
      const resolutions = computeScanFieldResolutions(toScanSavePayload(draft), guest);
      if (resolutions.some((r) => r.status === "conflict")) {
        setDuplicateSheetOpen(false);
        setFieldSheet({
          targetPersonId: selectedTargetId,
          targetName: guest.displayName,
          resolutions,
          choices: {},
        });
        return;
      }
      void doSave("update", selectedTargetId, { fieldChoices: {} });
    } catch {
      setSaveError("generic");
    }
  }

  function confirmFieldResolution() {
    const sheet = fieldSheet;
    if (!sheet) return;
    void doSave("update", sheet.targetPersonId, { fieldChoices: sheet.choices });
  }

  function retake() {
    setImage(null);
    setCandidate(null);
    reviewStartedAtRef.current = null;
    sessionExpiredRef.current = false;
    setSessionExpired(false);
    setDraft(null);
    setDraftErrors({});
    setResolution(null);
    setDuplicateSheetOpen(false);
    setFieldSheet(null);
    setSelectedTargetId(null);
    setSaveError(null);
    setSaveOutcome(null);
    setScanError(null);
    setCaptureError(null);
    setVcfPreview(null);
    setStage("capture");
  }

  function cancelReview() {
    reportCardScanMetric("OCR_REVIEW_CANCELLED");
    retake();
  }

  /** .vcf export of the current draft — opens the preview sheet so the user
   *  checks every exported field before the Share Sheet / download fires.
   *  Refuses once the recognition session has lapsed, same late-action guard
   *  as saving. */
  function exportDraftVcf() {
    if (!draft) return;
    if (!isReviewSessionLive()) {
      expireReviewSession();
      return;
    }
    const vcf = buildScanDraftVCard(draft, window.location.origin);
    if (!vcf) return;
    reportCardScanMetric("OCR_REVIEW_VCF_PREVIEW_OPENED");
    setVcfPreview({ vcf, filename: personVcfFilename(draft.displayName) });
  }

  /** Deliver a confirmed .vcf, then confirm via toast. The sheet stays open
   *  in its loading state (confirm action disabled, spinner shown) until the
   *  Share Sheet / download resolves, then closes. On failure the error toast
   *  carries a one-tap "Retry" action that re-runs exactly the same export.
   *  Telemetry emits allowlisted metric names + latency only — never the
   *  draft content, name, or filename. */
  async function deliverConfirmedVcf(pending: { vcf: string; filename: string }) {
    setVcfDelivering(true);
    const start = Date.now();
    try {
      const result = await shareOrDownloadVcf(pending.vcf, pending.filename);
      if (result === "shared") {
        reportCardScanMetric("OCR_REVIEW_VCF_EXPORTED_SHARED", { latencyMs: Date.now() - start });
        toast.success(t("bc.mobile.cardScan.vcf.shared"));
      } else if (result === "downloaded") {
        reportCardScanMetric("OCR_REVIEW_VCF_EXPORTED_DOWNLOADED", {
          latencyMs: Date.now() - start,
        });
        toast.success(t("bc.mobile.cardScan.vcf.downloaded"));
      } else {
        // User dismissed the Share Sheet — an intentional choice, no toast.
        reportCardScanMetric("OCR_REVIEW_VCF_CANCELLED");
      }
    } catch {
      reportCardScanMetric("OCR_REVIEW_VCF_FAILED");
      toast.error(t("bc.mobile.cardScan.vcf.error"), {
        action: {
          label: t("bc.mobile.vcf.retry"),
          // One-tap retry: reopen the preview sheet in its loading state and
          // re-deliver the same reviewed file — still gated on the review
          // session TTL, since time may have passed before the tap.
          onClick: () => {
            if (!isReviewSessionLive()) {
              expireReviewSession();
              return;
            }
            setVcfPreview(pending);
            void deliverConfirmedVcf(pending);
          },
        },
      });
    } finally {
      setVcfDelivering(false);
      setVcfPreview(null);
    }
  }

  /** Confirm from the preview sheet: re-validate the session (the sheet may
   *  have been open past the TTL), then deliver exactly the reviewed file. */
  async function confirmVcfPreview() {
    const pending = vcfPreview;
    if (!pending) return;
    if (!isReviewSessionLive()) {
      setVcfPreview(null);
      expireReviewSession();
      return;
    }
    await deliverConfirmedVcf(pending);
  }

  const statusText =
    stage === "processing"
      ? processingStage === "preparing"
        ? t("bc.mobile.cardScan.preparing")
        : t("bc.mobile.cardScan.reading")
      : stage === "review"
        ? sessionExpired
          ? t("bc.mobile.cardScan.session.expiredTitle")
          : t("bc.mobile.cardScan.review.title")
        : stage === "saved"
          ? saveOutcome?.result === "updated"
            ? t("bc.mobile.cardScan.success.updated")
            : t("bc.mobile.cardScan.success.savedNew")
          : stage === "unusable"
            ? t("bc.mobile.cardScan.unusable.title")
            : stage === "error" && scanError
              ? t(SCAN_ERROR_KEY[scanError] as never)
              : "";

  const showTopBar = stage !== "processing";

  const saveErrorText =
    saveError === "conflict"
      ? t("bc.mobile.cardScan.duplicate.conflict")
      : saveError === "notFound"
        ? t("bc.mobile.cardScan.duplicate.notFound")
        : saveError === "generic"
          ? t("bc.mobile.cardScan.saveError")
          : null;

  return (
    <div className="flex min-h-[70dvh] flex-1 flex-col">
      {/* Polite live region: processing, result and error states are announced. */}
      <div aria-live="polite" role="status" className="sr-only">
        {statusText}
      </div>

      {showTopBar ? (
        <header className="flex items-center gap-2 px-3 pt-2">
          <button
            type="button"
            aria-label={t("bc.mobile.cardScan.back")}
            onClick={() => void navigate({ to: "/connect-app" })}
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] motion-reduce:transition-none"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </button>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-[17px] font-semibold tracking-tight text-[var(--bc-mobile-text)] outline-none"
          >
            {stage === "review"
              ? t("bc.mobile.cardScan.review.title")
              : stage === "preview"
                ? t("bc.mobile.cardScan.preview.title")
                : t("bc.mobile.cardScan.title")}
          </h1>
        </header>
      ) : null}

      <input
        ref={cameraInputRef}
        type="file"
        accept={CARD_SCAN_ACCEPT}
        capture="environment"
        aria-label={t("bc.mobile.cardScan.a11y.cameraInput")}
        className="sr-only absolute pointer-events-none opacity-0 -z-10"
        tabIndex={-1}
        onChange={(e) => {
          void onFileSelected(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept={CARD_SCAN_ACCEPT}
        aria-label={t("bc.mobile.cardScan.a11y.libraryInput")}
        className="sr-only absolute pointer-events-none opacity-0 -z-10"
        tabIndex={-1}
        onChange={(e) => {
          void onFileSelected(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {stage === "capture" ? (
        <BusinessCardCapture
          onCaptured={(file) => void onFileSelected(file)}
          onLibrary={() => libraryInputRef.current?.click()}
          error={captureError}
          autoCapture={autoCapture}
          onAutoCaptureChange={setAutoCapture}
        />
      ) : null}

      {liveOpen ? (
        <LiveCardAutoCapture
          onCaptured={(file) => {
            setLiveOpen(false);
            void onFileSelected(file);
          }}
          onCancel={() => setLiveOpen(false)}
          onManualFallback={() => {
            setLiveOpen(false);
            setAutoCapture(false);
            window.setTimeout(() => cameraInputRef.current?.click(), 0);
          }}
        />
      ) : null}

      {stage === "preview" && image ? (
        <BusinessCardImagePreview
          image={image}
          onRecognize={() => void recognize()}
          onRetake={startCamera}
          onChooseOther={() => libraryInputRef.current?.click()}
          onCrop={() => setCropOpen(true)}
        />
      ) : null}

      {stage === "preview" && image && cropOpen ? (
        <BusinessCardCropper
          image={image}
          onCancel={() => setCropOpen(false)}
          onApply={(cropped) => {
            setImage(cropped);
            setCropOpen(false);
          }}
        />
      ) : null}

      {stage === "processing" ? <BusinessCardOcrProgress stage={processingStage} /> : null}

      {stage === "review" && !sessionExpired && candidate && draft ? (
        <BusinessCardReviewForm
          ref={resultHeadingRef}
          candidate={candidate}
          draft={draft}
          errors={draftErrors}
          duplicateHint={resolution != null && resolution.state !== "none"}
          saveErrorText={saveErrorText}
          saving={saving}
          onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
          onContinue={onReviewContinue}
          onCancel={cancelReview}
          onExportVcf={exportDraftVcf}
          exportVcfDisabled={!draft.displayName.trim()}
        />
      ) : null}

      {/* .vcf preview — the human checks the exact exported fields before
          the Share Sheet / download fires. Session-guarded on confirm. */}
      {stage === "review" && !sessionExpired && vcfPreview ? (
        <VcfPreviewSheet
          vcf={vcfPreview.vcf}
          filename={vcfPreview.filename}
          confirming={vcfDelivering}
          onClose={() => setVcfPreview(null)}
          onConfirm={() => void confirmVcfPreview()}
        />
      ) : null}

      {stage === "review" &&
      !sessionExpired &&
      duplicateSheetOpen &&
      resolution &&
      resolution.state !== "none" ? (
        <CardScanDuplicateSheet
          resolution={resolution}
          selectedTargetId={selectedTargetId}
          busy={saving}
          onSelectTarget={setSelectedTargetId}
          onUpdateExisting={() => void beginUpdateExisting()}
          onKeepNew={() => void doSave("new", null, { confirmedNew: true })}
          onEditFirst={() => setDuplicateSheetOpen(false)}
        />
      ) : null}

      {/* Field-level merge confirmation — identity fields are never silently
          overwritten; every conflict is an explicit human choice. */}
      {stage === "review" && !sessionExpired && fieldSheet ? (
        <CardScanFieldResolutionSheet
          targetName={fieldSheet.targetName}
          resolutions={fieldSheet.resolutions}
          choices={fieldSheet.choices}
          busy={saving}
          onChoice={(key: ScanFieldKey, choice) =>
            setFieldSheet((s) => (s ? { ...s, choices: { ...s.choices, [key]: choice } } : s))
          }
          onConfirm={confirmFieldResolution}
          onBack={() => {
            setFieldSheet(null);
            setDuplicateSheetOpen(true);
          }}
        />
      ) : null}

      {stage === "review" && sessionExpired ? (
        <CardScanSessionExpired ref={resultHeadingRef} onRecapture={retake} />
      ) : null}

      {stage === "saved" && saveOutcome ? (
        <CardScanSaveSuccess
          ref={resultHeadingRef}
          result={saveOutcome.result}
          personId={saveOutcome.personId}
          displayName={saveOutcome.displayName}
          title={saveOutcome.title}
          companyName={saveOutcome.companyName}
          ocrConfidence={candidate?.overallConfidence}
          sessionSaved={sessionSaved}
          onScanAnother={retake}
          onScanNext={() => {
            retake();
            // Straight back to the camera — batch scanning skips the empty
            // capture screen between cards.
            window.setTimeout(startCamera, 0);
          }}
          onDone={() => void navigate({ to: "/connect-app/network" })}
        />
      ) : null}

      {stage === "unusable" ? (
        <div className="flex flex-1 flex-col px-6 pb-8">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <h2 className="text-[17px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.cardScan.unusable.title")}
            </h2>
            <p className="max-w-[300px] text-[14px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.cardScan.unusable.desc")}
            </p>
          </div>
          <div className="grid gap-3">
            {image ? (
              <button
                type="button"
                onClick={() => void recognize()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 motion-reduce:transition-none"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t("bc.mobile.cardScan.retry")}
              </button>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
              >
                <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t("bc.mobile.cardScan.retake")}
              </button>
              <button
                type="button"
                onClick={() => libraryInputRef.current?.click()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
              >
                <ImagePlus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t("bc.mobile.cardScan.chooseOther")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {stage === "error" && scanError ? (
        <div className="flex flex-1 flex-col px-6 pb-8">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p
              role="alert"
              className="max-w-[300px] text-[14px] font-medium text-[var(--bc-mobile-text)]"
            >
              {t(SCAN_ERROR_KEY[scanError] as never)}
            </p>
          </div>
          <div className="grid gap-3">
            {image ? (
              <button
                type="button"
                onClick={() => void recognize()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 motion-reduce:transition-none"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t("bc.mobile.cardScan.retry")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={retake}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
            >
              <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              {t("bc.mobile.cardScan.retake")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
