// BC-Mobile-4A — Business Card Scan candidate contract.
//
// OCR is an assistant, not an authority: everything here is UNCONFIRMED
// candidate data until a human reviews and saves it in BC-Mobile-4B. The DTO
// is client-safe by construction — no owner ids, tenant ids, storage paths,
// provider internals, or raw OCR payloads.

import { z } from "zod";

export const CARD_SCAN_SCHEMA_VERSION = 1 as const;

export type ConfidenceBand = "clear" | "review" | "unclear";

/** Display banding only — never treated as truth. */
export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return "clear";
  if (confidence >= 0.5) return "review";
  return "unclear";
}

export type PhoneLabel = "mobile" | "office" | "hotline" | "fax";

export type CandidateField = {
  /** Normalized candidate value (NFC, trimmed; emails lowercased; URLs https). */
  value: string;
  /** 0..1 — presentation aid for review, NOT a save threshold. */
  confidence: number;
  /** The OCR line this value was derived from — evidence is mandatory. */
  sourceText: string;
};

export type CandidatePhone = CandidateField & { label?: PhoneLabel };

export type CandidateWarning =
  | "no_name"
  | "no_contact_channel"
  | "qr_present"
  | "name_needs_review"
  | "title_needs_review"
  | "company_needs_review"
  | "address_needs_review"
  | "email_uncertain"
  | "phone_uncertain";

export type BusinessCardCandidate = {
  schemaVersion: typeof CARD_SCAN_SCHEMA_VERSION;
  /** Opaque per-attempt id, minted server-side. Identifies nothing persistent. */
  scanId: string;
  /** Hard gate for 4A: candidates are never canonical/saved. */
  status: "candidate";
  fields: {
    displayName?: CandidateField;
    title?: CandidateField;
    companyName?: CandidateField;
    phones: CandidatePhone[];
    emails: CandidateField[];
    website?: CandidateField;
    address?: CandidateField;
  };
  warnings: CandidateWarning[];
  overallConfidence: number;
};

// ── Vision model output (strictly validated, server-side only) ──────────────
//
// The model transcribes lines and classifies line INDEXES for the semantic
// fields. It never emits contact values — deterministic parsers own those —
// so every candidate field traces to an OCR line by construction.

export const OCR_MODEL_MAX_LINES = 40;

export const ocrModelOutputSchema = z
  .object({
    isBusinessCard: z.boolean(),
    unusableReason: z.string().max(120).nullish(),
    lines: z
      .array(
        z
          .object({
            text: z.string().min(1).max(200),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(OCR_MODEL_MAX_LINES),
    displayNameLine: z.number().int().min(0).nullable(),
    titleLine: z.number().int().min(0).nullable(),
    companyNameLine: z.number().int().min(0).nullable(),
    addressLine: z.number().int().min(0).nullable(),
    qrPresent: z.boolean().nullish(),
  })
  .strict();

export type OcrModelOutput = z.infer<typeof ocrModelOutputSchema>;
export type OcrLine = OcrModelOutput["lines"][number];

// ── RPC response ─────────────────────────────────────────────────────────────

export type CardScanFailureCode =
  | "unusable" // OCR ran but nothing reviewable — retake guidance shown
  | "invalid_output" // model output failed strict validation
  | "timeout" // server vision call aborted
  | "provider_busy" // provider rate-limited — retry shortly
  | "rate_limited" // per-user scan budget exhausted
  | "failed"; // generic provider/transport failure

export type CardScanResponse =
  | { ok: true; candidate: BusinessCardCandidate }
  | { ok: false; code: CardScanFailureCode };
