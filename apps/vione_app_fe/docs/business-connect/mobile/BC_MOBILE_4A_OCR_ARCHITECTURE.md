# BC-Mobile-4A — OCR Architecture Audit & Decision

Status: FROZEN for BC-Mobile-4A
Scope: Paper Business Card → Capture → OCR → Structured Candidate → Preview.
Persistence into Network / Guest Contact / Journey is OUT of scope (BC-Mobile-4B+).

## 1. Technology audit

| Candidate technology | Location | Verdict | Rationale |
|---|---|---|---|
| Lovable AI Gateway vision (Gemini) via server-side `fetch` | `src/lib/card-ai.functions.ts` (AI Card Import, production) | REUSE_WITH_ADAPTER | Production-ready server-side vision runtime, no client secret, 30s abort convention, 402/429 mapping. Adapter = new OCR-specific prompt + strict Zod output + evidence-by-construction candidate builder. |
| Client image validation + EXIF-stripping canvas pipeline | `src/lib/business-connect/mobile/moment-image.ts` (BC-Mobile-2E, production) | REUSE_WITH_ADAPTER | Canvas re-encode strips ALL EXIF (incl. GPS) by construction; bounded edge + byte target; truthful HEIC failure. Adapter = OCR-specific limits (12MB source, 2048px edge, data-URL output). |
| In-memory fixed-window rate limiter | `src/lib/public-rate-limit.ts` (BC-Mobile-3A) | REUSE_AS_IS | Keyed by `bc-ocr:<userId>`; 20 scans / 10 min / instance. |
| `requireSupabaseAuth` server-fn middleware | `src/integrations/supabase/auth-middleware.ts` | REUSE_AS_IS | Authenticated-only OCR endpoint; no anonymous scans. |
| V Action Sheet capability slot `scanCard` | `src/components/business-connect/mobile/VActionSheet.tsx` | REUSE_AS_IS | Becomes `available` → `/connect-app/card-scan` only after the full 4A flow works. |
| QR/barcode camera scanner | `src/hooks/use-qr-scanner.ts`, `src/components/checkin/Scanner.tsx` | NOT_SUITABLE (4A) | Live-camera check-in scanner, not still-image QR decode. QR-on-card is reported as a `qr_present` warning by the vision pass instead of being decoded. |
| Client-side OCR (tesseract.js etc.) | — | NOT_SUITABLE | Large WASM bundle on a 480px PWA, weak Vietnamese diacritics accuracy vs. the production vision runtime, and raw OCR would run untrusted on-device. |
| New OCR dependency / external OCR SaaS | — | NEW_RUNTIME_REQUIRED: none | The existing gateway vision runtime satisfies privacy + quality requirements. No image leaves current infrastructure beyond the already-approved AI Gateway path used by AI Card Import. |
| Temporary object storage for card images | — | NOT_SUITABLE (4A) | No transient-media lifecycle exists today. Decision: NO server-side image persistence at all — image is request-scoped only (in-flight POST body → vision call → dropped). |

## 2. OCR engine decision

- **Runtime**: Lovable AI Gateway, model `google/gemini-2.5-flash` (same production model as AI Card Import).
- **Execution point**: server-only (`card-scan.server.ts`). Browser never holds `LOVABLE_API_KEY`, a service-role key, or any provider credential.
- **Data flow**: device camera/library → client canvas preprocessing (EXIF strip, ≤2048px, JPEG ≤2MB) → authenticated server fn → vision call (image in request body only) → strict-validated JSON → candidate DTO → response. **No storage write anywhere.**
- **Retention**: request-scoped transient. No bucket, no DB row, no analytics payload containing image or text.
- **Expected latency**: one vision round-trip (seconds); hard abort at 30s server-side, 45s client-side. Not benchmarked in the test environment — documented as unknown in the gate doc.
- **Cost control**: ≤2MB processed JPEG, 20 scans / 10 min / user, single image per attempt, no batch endpoint.

## 3. Extraction architecture — evidence by construction

Hybrid deterministic + model:

1. Model returns **raw text lines** (with per-line confidence) plus **line-index classification** for `displayName / title / companyName / address` only. The model is never asked to transcribe phones/emails/URLs into fields.
2. Server-side **deterministic parsers** extract emails, phone numbers (with Mobile/Office/Hotline/Fax labels from line context), and websites (http/https only) from those lines.
3. Every candidate field's `sourceText` IS the OCR line text — the value is derived from the line, never from model imagination. Classification indexes are range-checked and contact-pattern-guarded; violations drop the field with a `*_needs_review` warning.
4. Strict `.strict()` Zod schema rejects unexpected keys, wrong types, oversized strings, malformed arrays.

Prompt-injection boundary: the system prompt declares the image UNTRUSTED DATA; any in-image "instructions" are card content. Extraction semantics are fixed server-side; the model cannot add fields, rename fields, or trigger actions.

## 4. Candidate DTO (client-safe)

```text
BusinessCardCandidate {
  schemaVersion: 1
  scanId: uuid            // opaque, minted server-side per attempt; no persistence
  status: "candidate"     // never "saved" / "canonical"
  fields: {
    displayName?: CandidateField
    title?:       CandidateField
    companyName?: CandidateField
    phones:  CandidateField[]  // + label?: mobile|office|hotline|fax
    emails:  CandidateField[]
    website?:    CandidateField  // normalized https:// only
    address?:    CandidateField
  }
  warnings: CandidateWarning[]  // no_name, no_contact_channel, qr_present, *_needs_review, email_uncertain, phone_uncertain
  overallConfidence: number     // 0..1, mean of present fields
}
CandidateField { value, confidence: 0..1, sourceText }
```

DTO never contains: owner ids, tenant ids, storage paths, provider internals, prompts, or raw OCR payloads.

## 5. Reviewable threshold (truthful unusable state)

Unusable when: model says not-a-card, zero lines survive normalization, or the candidate has neither a plausible name nor any communication channel (phone/email/website). Partial candidates (e.g. name + phone, no company) are valid.

## 6. Privacy

- Authenticated feature only (`/connect-app/*` route guard + `requireSupabaseAuth`).
- EXIF (incl. GPS) stripped client-side by canvas re-encode before upload.
- Telemetry: allowlisted metric names + numeric latency only (`card-scan.telemetry.ts`). No names, phones, emails, OCR text, or image references in logs.
- Provider retention: vision call uses the same Lovable AI Gateway path already approved for AI Card Import; no new third-party data flow is introduced. We do not claim "zero retention" beyond that existing configuration.

## 7. Explicitly deferred (BC-Mobile-4B+)

Candidate editing, save to Network / Guest Contact, duplicate resolution, backside scan, batch scan, QR decode on card, geocoding, company enrichment, Journey/Moment integration.
